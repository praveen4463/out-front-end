/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React, {useContext, useMemo, useState} from 'react';
import {random, truncate} from 'lodash-es';
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
import TableToolbar from '../components/TableToolbar';
import {IdeDispatchContext, IdeVarsContext} from '../../Contexts';
import useSnackbarTypeError from '../../../hooks/useSnackbarTypeError';
import useConfirmationDialog from '../../../hooks/useConfirmationDialog';
import {ApiStatuses, VarTypes, ErrorType} from '../../Constants';
import {VAR_NEW, VAR_EDIT, VAR_DELETE} from '../../actionTypes';
import {BuildVars as BuildVariables} from '../../../variables/model';
import {getCurrentPrimaryBuildVar} from '../../reducers/var';
import normalizeString from '../../../utils';

const DEF_GROUPED_COLUMN = 'key';

const useStyle = makeStyles((theme) => ({
  deleteButton: {
    color: theme.palette.background.contrastText,
  },
  noRecordText: {
    marginTop: theme.spacing(4),
  },
}));

// update is a custom function that we supplied to our table instance
const EditableCell = React.memo(({cell, row, column, update}) => {
  const [value, setValue] = useState(cell.value);
  const [error, setError] = useState(null);
  const {id} = column;

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

  if (id === 'primary') {
    return (
      <Radio
        value={value ? 'on' : 'off'}
        checked={Boolean(value)} // primary is undefined too, when undefined we want that to parse into bool
        onChange={onRadioChange}
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

const Actions = ({row: {original}, onDelete}) => {
  const vars = useContext(IdeVarsContext);
  const classes = useStyle();
  const varShotName = truncate(original.value, {
    length: 50,
  });

  const deleteAcceptHandler = () => {
    onDelete(original);
  };

  const [setShowDeleteDialog, deleteDialog] = useConfirmationDialog(
    deleteAcceptHandler,
    'Delete',
    `Are you sure you want to delete variable ${varShotName} from key group ${original.key}?`,
    'delete-alert-dialog-description'
  );

  const deleteHandler = (e) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const isDeleteDisabled = () => {
    return (
      original.primary &&
      vars.build.result.filter(
        (b) => vars.build.entities.buildVars[b].key === original.key
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
};

Actions.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      id: PropTypes.number,
    }),
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

const BuildVars = () => {
  const dispatch = useContext(IdeDispatchContext);
  const vars = useContext(IdeVarsContext);
  const classes = useStyle();
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
        accessor: 'primary',
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
    // keep the entry that is currently primary before the current
    // update makes it non primary (if value.primary === true). This
    // will help reverting on error.
    let currentPrimary = null;
    if (columnId === 'primary' && value.primary && !oldValue.primary) {
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

    const onError = (response) => {
      setSnackbarErrorMsg(`Couldn't update, ${response.error.reason}`);
      // revert to original on error
      if (currentPrimary !== null) {
        dispatch({
          type: VAR_EDIT,
          payload: {type: VarTypes.BUILD, value: currentPrimary}, // currentPrimary had primary = true
          // so sending it now will make it primary again as it turned to non
          // primary after this after.
        });
      } else {
        dispatch({
          type: VAR_EDIT,
          payload: {type: VarTypes.BUILD, value: originalRow},
        });
      }
    };
    // send to api only column that is changed, i.e columnId
    setTimeout(() => {
      /* const response = {
        status: ApiStatuses.FAILURE,
        error: {
          reason: 'Network error',
        },
      }; */
      const response = {
        status: ApiStatuses.SUCCESS,
      };
      if (response.status === ApiStatuses.FAILURE) {
        onError(response);
      }
    }, 500);
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
          vars.build.entities.buildVars[id].key === normalized.key &&
          vars.build.entities.buildVars[id].value === normalized.value
      )
    ) {
      return {
        error: true,
        errorType: ErrorType.BUILD_VAR_DUPE_ERROR,
      };
    }
    const onSuccess = (response) => {
      dispatch({
        type: VAR_NEW,
        payload: {
          type: VarTypes.BUILD,
          value: new BuildVariables(
            response.data.id,
            normalized.key,
            normalized.value,
            normalized.primary
          ),
        },
      });
    };
    const onError = (response) => {
      setSnackbarErrorMsg(`Couldn't save, ${response.error.reason}`);
    };
    setTimeout(() => {
      const response = {
        status: ApiStatuses.SUCCESS,
        data: {
          id: random(1000, 10000),
        },
      };
      /* const response = {
        status: ApiStatuses.FAILURE,
        error: {
          reason: 'Network error',
        },
      }; */
      if (response.status === ApiStatuses.SUCCESS) {
        onSuccess(response);
      } else if (response.status === ApiStatuses.FAILURE) {
        onError(response);
      }
    }, 500);
    return null;
  };

  const del = (originalRow) => {
    dispatch({
      type: VAR_DELETE,
      payload: {
        type: VarTypes.BUILD,
        id: originalRow.id,
      },
    });
    const onError = (response) => {
      setSnackbarErrorMsg(`Couldn't delete, ${response.error.reason}`);
      // revert to original on error
      dispatch({
        type: VAR_NEW,
        payload: {
          type: VarTypes.BUILD,
          value: originalRow,
        },
      });
    };
    setTimeout(() => {
      /* const response = {
        status: ApiStatuses.FAILURE,
        error: {
          reason: 'Network error',
        },
      }; */
      const response = {
        status: ApiStatuses.SUCCESS,
      };
      if (response.status === ApiStatuses.FAILURE) {
        onError(response);
      }
    }, 500);
  };

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
            !row.canExpand ? <Actions row={row} onDelete={del} /> : null,
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