/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React, {useContext, useMemo, useState, useCallback} from 'react';
import {truncate} from 'lodash-es';
import TextField from '@material-ui/core/TextField';
import {makeStyles} from '@material-ui/core/styles';
import Radio from '@material-ui/core/Radio';
import MaUTable from '@material-ui/core/Table';
import PropTypes from 'prop-types';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import DeleteIcon from '@material-ui/icons/Delete';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import {
  useGlobalFilter,
  useSortBy,
  useGroupBy,
  useTable,
  useExpanded,
} from 'react-table';
import axios from 'axios';
import TableToolbar from '../components/TableToolbar';
import {
  IdeDispatchContext,
  IdeVarsContext,
  IdeProjectIdContext,
} from '../../Contexts';
import useSnackbarTypeError from '../../../hooks/useSnackbarTypeError';
import useConfirmationDialog from '../../../hooks/useConfirmationDialog';
import {VarTypes, ErrorType, Endpoints} from '../../../Constants';
import {handleApiError, prepareEndpoint} from '../../../common';
import {
  VAR_NEW,
  VAR_EDIT,
  VAR_DELETE,
  CONFIG_DRY_ON_BUILD_VAR_DELETE,
} from '../../actionTypes';
import {CONFIG_BUILD_ON_BUILD_VAR_DELETE} from '../../../actions/actionTypes';
import {BuildVars as BuildVariables} from '../../../variables/model';
import {getCurrentPrimaryBuildVar} from '../../reducers/var';
import batchActions from '../../actionCreators';
import normalizeString, {equalIgnoreCase} from '../../../utils';

const DEF_GROUPED_COLUMN = 'key';

const useStyles = makeStyles((theme) => ({
  deleteButton: {
    color: theme.palette.background.contrastText,
  },
  noRecordText: {
    marginTop: theme.spacing(4),
  },
  textField: {
    paddingLeft: '1px',
    paddingRight: '1px',
    border: `1px solid`,
    borderColor: 'transparent',
    borderRadius: '4px',
    '&:hover': {
      borderColor: 'grey',
    },
    '&$focused': {
      borderColor: theme.palette.primary.main,
    },
  },
  focused: {},
}));

// update is a custom function that we supplied to our table instance
const EditableCell = React.memo(({cell, row, column, update}) => {
  const [value, setValue] = useState(cell.value);
  const [error, setError] = useState(null);
  const {id} = column;
  const classes = useStyles();

  const onTextChange = (e) => {
    const v = e.target.value;
    setValue(v);
    if (v.trim().length === 0) {
      setError('Value is required');
    } else if (error) {
      setError(null);
    }
  };

  const onTextBlur = () => {
    if (error) {
      setValue(cell.value);
      setError(null);
      return;
    }
    update(row.original, id, value);
  };

  const onRadioChange = ({target: {checked}}) => {
    // not setting state value, it will be set after state by effect
    update(row.original, id, checked);
  };

  // If the cell's value (i.e vars state) is changed externally, sync it up with our state
  React.useEffect(() => {
    setValue(cell.value);
  }, [cell.value]);

  // for a grouped row, just aggregated column would show, and that without
  // edit enabled.
  if (row.isGrouped) {
    if (id === DEF_GROUPED_COLUMN) {
      return value;
    }
    return null;
  }

  if (id === 'isPrimary') {
    return (
      <Radio
        value={value ? 'on' : 'off'}
        checked={Boolean(value)} // primary is undefined too, when undefined we want that to parse into bool
        onChange={onRadioChange}
        title={
          value ? 'primary variable' : 'click to make this variable primary'
        }
      />
    );
  }
  return (
    <TextField
      multiline
      rowsMax={8}
      value={value}
      onChange={onTextChange}
      onBlur={onTextBlur}
      fullWidth
      error={Boolean(error)}
      helperText={error ?? ''}
      InputProps={{
        disableUnderline: true,
        classes: {root: classes.textField, focused: classes.focused},
      }}
      title="click to edit, focus out to update"
    />
  );
});

EditableCell.propTypes = {
  cell: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  }).isRequired,
  row: PropTypes.shape({
    isGrouped: PropTypes.bool,
  }).isRequired,
  column: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
  update: PropTypes.func.isRequired,
};

const Actions = React.memo(({originalRow, onDelete}) => {
  const vars = useContext(IdeVarsContext);
  const classes = useStyles();
  const varShotName = truncate(originalRow.value, {
    length: 50,
  });

  const deleteAcceptHandler = () => {
    onDelete(originalRow);
  };

  const [setShowDeleteDialog, deleteDialog] = useConfirmationDialog(
    deleteAcceptHandler,
    'Delete',
    `Are you sure you want to delete variable ${varShotName} from key group ${originalRow.key}?`,
    'delete-alert-dialog-description'
  );

  const deleteHandler = (e) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const isDeleteDisabled = () => {
    return (
      originalRow.isPrimary &&
      vars.build.result.filter(
        (b) => vars.build.entities.buildVars[b].key === originalRow.key
      ).length > 1
    );
  };

  return (
    <>
      <div>
        <IconButton
          onClick={deleteHandler}
          disabled={isDeleteDisabled()}
          title="Delete Variable"
          className={classes.deleteButton}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </div>
      {deleteDialog}
    </>
  );
});

Actions.propTypes = {
  originalRow: PropTypes.shape({
    id: PropTypes.number,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

const BuildVars = () => {
  const dispatch = useContext(IdeDispatchContext);
  const projectId = useContext(IdeProjectIdContext);
  const vars = useContext(IdeVarsContext);
  const classes = useStyles();
  // console.log('vars', vars);
  const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
  const columns = useMemo(
    () => [
      {
        Header: 'Key',
        accessor: 'key',
      },
      {
        Header: 'Value',
        accessor: 'value',
      },
      {
        Header: 'Is Primary',
        accessor: 'isPrimary',
      },
    ],
    []
  );
  const data = useMemo(
    () =>
      vars.build
        ? vars.build.result.map((r) => vars.build.entities.buildVars[r])
        : [],
    [vars.build]
  );

  const update = (originalRow, columnId, value) => {
    const oldValue = originalRow[columnId];
    if (oldValue === value) {
      return;
    }
    if (typeof value === 'string') {
      const v = value.trim();
      if (v.length === 0) {
        return;
      }
      if (oldValue === v) {
        return;
      }
    }
    let currentPrimary = null;
    if (columnId === 'isPrimary' && value && !oldValue.isPrimary) {
      // keep the entry that is currently primary before the current
      // update makes it non primary. This will help reverting on error.
      currentPrimary = getCurrentPrimaryBuildVar(vars, originalRow.key);
    }

    let normalized = value;
    if (typeof normalized === 'string') {
      normalized = normalizeString(value);
    }
    dispatch({
      type: VAR_EDIT,
      payload: {
        type: VarTypes.BUILD,
        value: {...originalRow, [columnId]: normalized},
      },
    });

    async function sendUpdate() {
      try {
        await axios.patch(prepareEndpoint(Endpoints.BUILD_VARS, projectId), {
          columnId,
          value: normalized,
          buildVarId: originalRow.id,
        });
      } catch (error) {
        handleApiError(error, setSnackbarErrorMsg, "Couldn't update");
        // revert to original on error
        if (currentPrimary !== null) {
          dispatch({
            type: VAR_EDIT,
            payload: {type: VarTypes.BUILD, value: currentPrimary}, // currentPrimary had isPrimary = true
            // so sending it now will make it primary again as it turned to non
            // primary after this after.
          });
        } else {
          dispatch({
            type: VAR_EDIT,
            payload: {type: VarTypes.BUILD, value: originalRow},
          });
        }
      }
    }

    sendUpdate();
  };

  const add = (buildVar) => {
    const normalized = {...buildVar};
    normalized.key = normalizeString(normalized.key);
    normalized.value = normalizeString(normalized.value);
    // check whether this is a duplicate
    if (
      vars.build &&
      vars.build.result.some(
        (id) =>
          equalIgnoreCase(
            vars.build.entities.buildVars[id].key,
            normalized.key
          ) && vars.build.entities.buildVars[id].value === normalized.value
      )
    ) {
      return {
        error: true,
        errorType: ErrorType.BUILD_VAR_DUPE_ERROR,
      };
    }
    async function save() {
      try {
        const response = await axios.post(
          prepareEndpoint(Endpoints.BUILD_VARS, projectId),
          normalized
        );
        dispatch({
          type: VAR_NEW,
          payload: {
            type: VarTypes.BUILD,
            value: new BuildVariables(
              response.data,
              normalized.key,
              normalized.value,
              normalized.isPrimary
            ),
          },
        });
      } catch (error) {
        handleApiError(error, setSnackbarErrorMsg, "Couldn't save");
      }
    }
    save();
    return null;
  };

  const del = useCallback(
    (originalRow) => {
      dispatch({
        type: VAR_DELETE,
        payload: {
          type: VarTypes.BUILD,
          id: originalRow.id,
        },
      });
      async function sendDelete() {
        try {
          await axios.delete(
            prepareEndpoint(Endpoints.BUILD_VARS, projectId, originalRow.id),
            {
              params: {
                isPrimary: originalRow.isPrimary,
              },
            }
          );
          const payload = {
            buildVar: originalRow,
          };
          dispatch(
            batchActions([
              {type: CONFIG_BUILD_ON_BUILD_VAR_DELETE, payload},
              {type: CONFIG_DRY_ON_BUILD_VAR_DELETE, payload},
            ])
          );
        } catch (error) {
          handleApiError(error, setSnackbarErrorMsg, "Couldn't delete");
          // revert to original on error
          dispatch({
            type: VAR_NEW,
            payload: {
              type: VarTypes.BUILD,
              value: originalRow,
            },
          });
        }
      }
      sendDelete();
    },
    [dispatch, setSnackbarErrorMsg, projectId]
  );

  // This will hide the grouped column by adding it into hidden column list in
  // table's state return by useTable hook.
  const useControlledState = (state) => {
    return React.useMemo(() => {
      if (state.groupBy.length) {
        return {
          ...state,
          hiddenColumns: [...state.hiddenColumns, ...state.groupBy].filter(
            (d, i, all) => all.indexOf(d) === i // filter any duplicates
          ),
        };
      }
      return state;
    }, [state]);
  };

  // Set our editable cell renderer as the default Cell renderer
  const defaultColumn = {
    Cell: EditableCell,
  };

  const {
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: {globalFilter},
  } = useTable(
    {
      columns,
      data,
      defaultColumn,
      // update isn't part of the API, but
      // anything we put into these options will
      // automatically be available on the instance.
      // That way we can call this function from our
      // cell renderer!
      update,
      initialState: {groupBy: useMemo(() => [DEF_GROUPED_COLUMN], [])},
      autoResetExpanded: false,
    },
    useGroupBy,
    useGlobalFilter,
    useSortBy,
    useExpanded,
    (hooks) => {
      // first add the column we wish dynamically. Every column requires at least
      // mentioned properties
      hooks.allColumns.push((cols) => [
        {
          id: 'actions',
          Header: '', // don't show a header for action column
          Cell: ({row}) =>
            !row.canExpand ? (
              <Actions
                originalRow={row.original}
                onDelete={del}
                key={row.original.id}
              />
            ) : null,
        },
        ...cols,
      ]);
      hooks.useControlledState.push(useControlledState);
      // The grouped column is hidden, let's add a new aggregated column in place
      hooks.visibleColumns.push((cols, {instance}) => {
        if (!instance.state.groupBy.length) {
          return cols;
        }
        return [
          {
            id: 'expander', // The id of the aggregated column
            // Build our expander column
            canSort: true,
            Header: ({allColumns, state: {groupBy}}) => {
              return groupBy.map((columnId) => {
                const column = allColumns.find((d) => d.id === columnId);
                return (
                  <span {...column.getHeaderProps()}>
                    {column.render('Header')} {/* render the column's name */}
                  </span>
                );
              });
            },
            Cell: ({row}) => {
              if (row.canExpand) {
                const groupedCell = row.allCells.find((d) => d.isGrouped);
                const toggleProps = {
                  ...row.getToggleRowExpandedProps({
                    style: {
                      // We can even use the row.depth property
                      // and paddingLeft to indicate the depth
                      // of the row
                      paddingLeft: `${row.depth * 2}rem`,
                    },
                  }),
                  title: row.isExpanded ? 'Hide key group' : 'Show key group',
                };
                return (
                  <span {...toggleProps}>
                    {row.isExpanded ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )}{' '}
                    {groupedCell.render('Cell')} ({row.subRows.length})
                  </span>
                );
              }
              return null;
            },
          },
          ...cols,
        ];
      });
    }
  );
  return (
    <>
      <TableContainer>
        <TableToolbar
          addHandler={add}
          varType={VarTypes.BUILD}
          preGlobalFilteredRows={preGlobalFilteredRows}
          setGlobalFilter={setGlobalFilter}
          globalFilter={globalFilter}
        />
        {rows.length ? (
          <MaUTable {...getTableProps()}>
            <colgroup>
              <col style={{width: '25%'}} />
              <col style={{width: '10%'}} />
              <col style={{width: '50%'}} />
              <col style={{width: '15%'}} />
            </colgroup>
            <TableHead>
              {headerGroups.map((headerGroup) => (
                <TableRow {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((col) => (
                    <TableCell
                      {...(col.id === 'actions'
                        ? col.getHeaderProps()
                        : col.getHeaderProps(col.getSortByToggleProps()))}>
                      {col.render('Header')}
                      {col.id !== 'actions' ? (
                        <TableSortLabel
                          active={col.isSorted}
                          // react-table has a unsorted state which is not treated here
                          direction={col.isSortedDesc ? 'desc' : 'asc'}
                        />
                      ) : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                prepareRow(row);
                return (
                  <TableRow {...row.getRowProps()} hover>
                    {row.cells.map((cell) => {
                      return (
                        <TableCell {...cell.getCellProps()}>
                          {cell.render('Cell')}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </MaUTable>
        ) : (
          <Typography variant="body2" className={classes.noRecordText}>
            Nothing to show yet, add some variable(s).
          </Typography>
        )}
      </TableContainer>
      {snackbarTypeError}
    </>
  );
};

export default BuildVars;
