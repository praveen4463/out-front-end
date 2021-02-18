/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import React, {useState, useContext, useEffect, useMemo} from 'react';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import MaUTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import EditIcon from '@material-ui/icons/EditOutlined';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import {useGlobalFilter, useSortBy, useTable} from 'react-table';
import {pull} from 'lodash-es';
import axios from 'axios';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import {
  Switch,
  Route,
  useRouteMatch,
  useLocation,
  Link as RouterLink,
} from 'react-router-dom';
import {useQuery, useMutation, useQueryClient} from 'react-query';
import GlobalFilter from '../components/GlobalFilter';
import CreateProject from './CreateProject';
import {Endpoints, PageUrl, QueryKeys, SearchKeys} from '../Constants';
import {
  filterSearchQuery,
  getLocation,
  getNewIntlComparer,
  handleApiError,
} from '../common';
import {projectsFetch} from '../api/fetches';
import {ManagementSnackbarContext} from '../contexts';
import ProjectDeleteConfirmation from './ProjectDeleteConfirmation';
import Loader from '../components/Loader';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  content: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
  },
  buttonCreate: {
    padding: `0px ${theme.spacing(6)}px`,
  },
  actionButton: {
    color: theme.palette.background.contrastText,
  },
  noRecordText: {
    marginTop: theme.spacing(4),
  },
}));

const Actions = React.memo(({originalRow, onDelete, editLocation}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const classes = useStyles();

  const deleteAcceptHandler = () => {
    onDelete(originalRow);
  };

  const deleteHandler = (e) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <div>
        <IconButton
          onClick={deleteHandler}
          title="Delete project"
          className={classes.actionButton}
          aria-label="Delete project">
          <DeleteIcon fontSize="small" />
        </IconButton>
        <IconButton
          component={RouterLink}
          to={editLocation}
          title="Edit project"
          className={classes.actionButton}
          aria-label="Edit project">
          <EditIcon fontSize="small" />
        </IconButton>
      </div>
      <ProjectDeleteConfirmation
        show={showDeleteDialog}
        setShow={setShowDeleteDialog}
        onAccept={deleteAcceptHandler}
        projectName={originalRow.name}
      />
    </>
  );
});

Actions.propTypes = {
  originalRow: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }).isRequired,
  editLocation: PropTypes.shape({
    pathname: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

const Default = () => {
  const location = useLocation();
  const {url} = useRouteMatch();
  const queryClient = useQueryClient();
  const {data: projects, error, isLoading} = useQuery(
    QueryKeys.PROJECTS,
    projectsFetch
  );
  const [, setSnackbarAlertError] = useContext(ManagementSnackbarContext);
  const columns = useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
      },
    ],
    []
  );
  const data = useMemo(() => projects || [], [projects]);
  const classes = useStyles();

  useEffect(() => {
    if (error) {
      handleApiError(error, setSnackbarAlertError, 'Projects failed to load');
    }
  }, [error, setSnackbarAlertError]);

  const getSearchLocation = useMemo(
    () => filterSearchQuery(location.search, [SearchKeys.PROJECT_QS]),
    [location.search]
  );

  const deleteProjectMutation = useMutation(
    async (project) => {
      await axios.delete(`${Endpoints.PROJECTS}/${project.id}`);
    },
    {
      onMutate: (project) => {
        queryClient.setQueryData(QueryKeys.PROJECTS, (old) =>
          pull([...old], project)
        );
      },
      onError: (err, project) => {
        handleApiError(err, setSnackbarAlertError, `Couldn't delete project`);
        queryClient.setQueryData(QueryKeys.PROJECTS, (old) =>
          [...old, project].sort((a, b) => getNewIntlComparer()(a.name, b.name))
        );
      },
    }
  );
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
    },
    useGlobalFilter,
    useSortBy,
    (hooks) => {
      // first add the column we wish dynamically. Every column requires at least
      // mentioned properties
      hooks.allColumns.push((cols) => [
        {
          id: 'actions',
          Header: 'Actions',
          Cell: ({row}) => (
            <Actions
              originalRow={row.original}
              onDelete={deleteProjectMutation.mutate}
              editLocation={getLocation(
                `${url}${PageUrl.UPDATE_WITHOUT_PARAM}/${row.original.id}`,
                getSearchLocation,
                {
                  location,
                }
              )}
              key={row.original.id}
            />
          ),
        },
        ...cols,
      ]);
    }
  );
  return (
    <Box display="flex" flexDirection="column" className={classes.root}>
      <Box pb={1}>
        <Typography variant="h5">Projects</Typography>
      </Box>
      <Box pb={4}>
        <Typography variant="body1">
          Organize tests and builds into meaningful categories
        </Typography>
      </Box>
      <Box className={classes.content} p={2} boxShadow={3}>
        {isLoading ? (
          <Box width="100%">
            <Loader rows={4} />
          </Box>
        ) : (
          <TableContainer>
            <Box display="flex">
              <Button
                component={RouterLink}
                to={getLocation(`${url}${PageUrl.CREATE}`, getSearchLocation, {
                  location,
                })}
                aria-label="Create project"
                variant="contained"
                color="secondary"
                className={classes.buttonCreate}>
                Create a project
              </Button>
              <Box flex={1} />
              <GlobalFilter
                preGlobalFilteredRows={preGlobalFilteredRows}
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
            </Box>
            {rows.length ? (
              <MaUTable {...getTableProps()}>
                <colgroup>
                  <col style={{width: '30%'}} />
                  <col style={{width: '70%'}} />
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
                Nothing to show yet, create some projects(s).
              </Typography>
            )}
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

const ManageProjects = () => {
  const {path} = useRouteMatch();

  return (
    <Switch>
      <Route exact path={path}>
        <Default />
      </Route>
      <Route path={`${path}${PageUrl.CREATE}`}>
        <CreateProject />
      </Route>
      <Route path={`${path}${PageUrl.UPDATE}`}>
        <CreateProject />
      </Route>
    </Switch>
  );
};

export default ManageProjects;
