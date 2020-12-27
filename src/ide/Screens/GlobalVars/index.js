/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React, {useContext, useMemo, useState, useCallback} from 'react';
import TextField from '@material-ui/core/TextField';
import {makeStyles} from '@material-ui/core/styles';
import MaUTable from '@material-ui/core/Table';
import PropTypes from 'prop-types';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import DeleteIcon from '@material-ui/icons/Delete';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import {useGlobalFilter, useSortBy, useTable} from 'react-table';
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
import {VAR_NEW, VAR_EDIT, VAR_DELETE} from '../../actionTypes';
import {GlobalVars as GlobalVariables} from '../../../variables/model';
import normalizeString, {equalIgnoreCase} from '../../../utils';

const useStyles = makeStyles((theme) => ({
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

  const onChange = (e) => {
    const v = e.target.value;
    setValue(v);
    if (v.trim().length === 0) {
      setError('Value is required');
    } else if (error) {
      setError(null);
    }
  };

  const onBlur = () => {
    if (error) {
      setValue(cell.value);
      setError(null);
      return;
    }
    update(row.original, id, value);
  };

  // If the cell's value (i.e vars state) is changed externally, sync it up with our state
  React.useEffect(() => {
    setValue(cell.value);
  }, [cell.value]);

  if (id === 'key') {
    return value;
  }

  return (
    <TextField
      multiline
      rowsMax={8}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      fullWidth
      error={Boolean(error)}
      helperText={error ?? ''}
      InputProps={{disableUnderline: true}}
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
  const classes = useStyles();

  const deleteAcceptHandler = () => {
    onDelete(originalRow);
  };

  const [setShowDeleteDialog, deleteDialog] = useConfirmationDialog(
    deleteAcceptHandler,
    'Delete',
    `Are you sure you want to delete variable ${originalRow.key}?`,
    'delete-alert-dialog-description'
  );

  const deleteHandler = (e) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <div>
        <IconButton
          onClick={deleteHandler}
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

const GlobalVars = () => {
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
    ],
    []
  );
  const data = useMemo(
    () =>
      vars.global
        ? vars.global.result.map((r) => vars.global.entities.globalVars[r])
        : [],
    [vars.global]
  );

  const update = (originalRow, columnId, value) => {
    const oldValue = originalRow[columnId];
    const v = value.trim();
    if (v.length === 0) {
      return;
    }
    if (oldValue === v) {
      return;
    }

    const normalized = normalizeString(value);
    dispatch({
      type: VAR_EDIT,
      payload: {
        type: VarTypes.GLOBAL,
        value: {...originalRow, [columnId]: normalized},
      },
    });

    async function sendUpdate() {
      try {
        await axios.patch(prepareEndpoint(Endpoints.GLOBAL_VARS, projectId), {
          value: normalized,
          globalVarId: originalRow.id,
        });
      } catch (error) {
        handleApiError(error, setSnackbarErrorMsg, "Couldn't update");
        // revert to original on error
        dispatch({
          type: VAR_EDIT,
          payload: {type: VarTypes.GLOBAL, value: originalRow},
        });
      }
    }

    sendUpdate();
  };

  const add = (globalVar) => {
    const normalized = {...globalVar};
    normalized.key = normalizeString(normalized.key);
    normalized.value = normalizeString(normalized.value);
    // check whether this is a duplicate
    if (
      vars.global &&
      vars.global.result.some((id) =>
        equalIgnoreCase(vars.global.entities.globalVars[id].key, normalized.key)
      )
    ) {
      return {
        error: true,
        errorType: ErrorType.GLOBAL_VAR_DUPE_ERROR,
      };
    }

    async function save() {
      try {
        const response = await axios.post(
          prepareEndpoint(Endpoints.GLOBAL_VARS, projectId),
          normalized
        );
        dispatch({
          type: VAR_NEW,
          payload: {
            type: VarTypes.GLOBAL,
            value: new GlobalVariables(
              response.data,
              normalized.key,
              normalized.value
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
          type: VarTypes.GLOBAL,
          id: originalRow.id,
        },
      });

      async function sendDelete() {
        try {
          await axios.delete(
            prepareEndpoint(Endpoints.GLOBAL_VARS, projectId, originalRow.id)
          );
        } catch (error) {
          handleApiError(error, setSnackbarErrorMsg, "Couldn't delete");
          // revert to original on error
          dispatch({
            type: VAR_NEW,
            payload: {
              type: VarTypes.GLOBAL,
              value: originalRow,
            },
          });
        }
      }
      sendDelete();
    },
    [dispatch, setSnackbarErrorMsg, projectId]
  );

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
    },
    useGlobalFilter,
    useSortBy,
    (hooks) => {
      // first add the column we wish dynamically. Every column requires at least
      // mentioned properties
      hooks.allColumns.push((cols) => [
        {
          id: 'actions',
          Header: '', // don't show a header for action column
          Cell: ({row}) => (
            <Actions
              originalRow={row.original}
              onDelete={del}
              key={row.original.id}
            />
          ),
        },
        ...cols,
      ]);
    }
  );
  return (
    <>
      <TableContainer>
        <TableToolbar
          addHandler={add}
          varType={VarTypes.GLOBAL}
          preGlobalFilteredRows={preGlobalFilteredRows}
          setGlobalFilter={setGlobalFilter}
          globalFilter={globalFilter}
        />
        {rows.length ? (
          <MaUTable {...getTableProps()}>
            <colgroup>
              <col style={{width: '10%'}} />
              <col style={{width: '30%'}} />
              <col style={{width: '60%'}} />
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

export default GlobalVars;
