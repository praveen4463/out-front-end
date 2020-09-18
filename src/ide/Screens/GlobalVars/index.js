/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React, {useContext, useMemo, useState} from 'react';
import {random} from 'lodash-es';
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
import TableToolbar from '../components/TableToolbar';
import {IdeDispatchContext, IdeVarsContext} from '../../Contexts';
import useSnackbarTypeError from '../../../hooks/useSnackbarTypeError';
import useConfirmationDialog from '../../../hooks/useConfirmationDialog';
import {ApiStatuses, VarTypes, ErrorType} from '../../../Constants';
import {VAR_NEW, VAR_EDIT, VAR_DELETE} from '../../actionTypes';
import {GlobalVars as GlobalVariables} from '../../../variables/model';
import normalizeString from '../../../utils';

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
  const classes = useStyle();

  const deleteAcceptHandler = () => {
    onDelete(original);
  };

  const [setShowDeleteDialog, deleteDialog] = useConfirmationDialog(
    deleteAcceptHandler,
    'Delete',
    `Are you sure you want to delete variable ${original.key}?`,
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
};

Actions.propTypes = {
  row: PropTypes.shape({
    original: PropTypes.shape({
      id: PropTypes.number,
    }),
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

const GlobalVars = () => {
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

    const onError = (response) => {
      setSnackbarErrorMsg(`Couldn't update, ${response.error.reason}`);
      // revert to original on error
      dispatch({
        type: VAR_EDIT,
        payload: {type: VarTypes.GLOBAL, value: originalRow},
      });
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

  const add = (globalVar) => {
    const normalized = {...globalVar};
    normalized.key = normalizeString(normalized.key);
    normalized.value = normalizeString(normalized.value);
    // check whether this is a duplicate
    if (
      vars.global &&
      vars.global.result.some(
        (id) => vars.global.entities.globalVars[id].key === normalized.key
      )
    ) {
      return {
        error: true,
        errorType: ErrorType.GLOBAL_VAR_DUPE_ERROR,
      };
    }
    const onSuccess = (response) => {
      dispatch({
        type: VAR_NEW,
        payload: {
          type: VarTypes.GLOBAL,
          value: new GlobalVariables(
            response.data.id,
            normalized.key,
            normalized.value
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
      if (response.status === ApiStatuses.FAILURE) {
        onError(response);
      }
      if (response.status === ApiStatuses.SUCCESS) {
        onSuccess(response);
      }
    }, 500);
    return null;
  };

  const del = (originalRow) => {
    dispatch({
      type: VAR_DELETE,
      payload: {
        type: VarTypes.GLOBAL,
        id: originalRow.id,
      },
    });
    const onError = (response) => {
      setSnackbarErrorMsg(`Couldn't delete, ${response.error.reason}`);
      // revert to original on error
      dispatch({
        type: VAR_NEW,
        payload: {
          type: VarTypes.GLOBAL,
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
          Cell: ({row}) =>
            !row.canExpand ? <Actions row={row} onDelete={del} /> : null,
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
