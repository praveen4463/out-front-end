import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from 'react';
import {withStyles, makeStyles} from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import MuiSkeleton from '@material-ui/lab/Skeleton';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import Button from '@material-ui/core/Button';
import LinearProgress from '@material-ui/core/LinearProgress';
import pull from 'lodash-es/pull';
import PropTypes from 'prop-types';
import axios from 'axios';
import {useQuery} from 'react-query';
import NewCaps from './NewCaps';
import useSnackbarTypeError from '../../hooks/useSnackbarTypeError';
import useConfirmationDialog from '../../hooks/useConfirmationDialog';
import TooltipCustom from '../../TooltipCustom';
import {
  Browsers,
  BuildCapsLabels,
  BuildCapsFields,
  Endpoints,
  QueryKeys,
} from '../../Constants';
import {BuildCapabilities} from '../../model';
import {
  getOsDisplayName,
  getBrowserDisplayName,
  getBrowserIcon,
  getOsIcon,
  getSortedNames,
  getContextObjShape,
  handleApiError,
} from '../../common';
import {CONFIG_BUILD_ON_BUILD_CAPS_DELETE} from '../../actions/actionTypes';

const Skeleton = withStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.contrastText,
    margin: theme.spacing(1),
  },
}))(MuiSkeleton);

const Label = withStyles((theme) => ({
  root: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
}))(Typography);

const Value = withStyles((theme) => ({
  root: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.background.contrastText,
  },
}))(Typography);

const useStyles = makeStyles((theme) => ({
  buildCapLink: {
    color: theme.palette.background.contrastText,
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  linkButton: {
    color: theme.palette.background.contrastText,
    padding: `${theme.spacing(0.5)}px ${theme.spacing(2)}px`,
  },
  capsDetail: {
    flexDirection: 'column',
  },
  viewRow: {
    display: 'flex',
    padding: theme.spacing(1),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

const LabelBox = ({children}) => {
  return (
    <Box flexBasis="40%" flexShrink={0}>
      {children}
    </Box>
  );
};

LabelBox.propTypes = {
  children: PropTypes.node.isRequired,
};

const ViewRow = ({children}) => {
  const classes = useStyles();
  return (
    <Box className={classes.viewRow} data-testid="viewRow">
      {children}
    </Box>
  );
};

ViewRow.propTypes = {
  children: PropTypes.node.isRequired,
};

const useSummaryStyles = makeStyles((theme) => ({
  root: {
    '&$expanded': {
      backgroundColor: theme.palette.action.focus,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  expanded: {},
  content: {
    alignItems: 'center',
  },
}));

const Actions = ({dCap, onDelete, onEdit, editingDisabled, deleteDisabled}) => {
  const classes = useStyles();
  const deleteAcceptHandler = () => {
    onDelete(dCap);
  };

  const [setShowDeleteDialog, deleteDialog] = useConfirmationDialog(
    deleteAcceptHandler,
    'Delete',
    `Are you sure you want to delete capability ${dCap.name}?`,
    'delete-alert-dialog-description'
  );

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(dCap);
  };

  return (
    <>
      <div>
        <TooltipCustom title="Edit Capability">
          <span>
            <IconButton
              aria-label="Edit Capability"
              onClick={handleEdit}
              disabled={editingDisabled}
              className={classes.linkButton}>
              <EditIcon fontSize="small" />
            </IconButton>
          </span>
        </TooltipCustom>
        <TooltipCustom title="Delete Capability">
          <span>
            <IconButton
              aria-label="Delete Capability"
              onClick={handleDelete}
              className={classes.linkButton}
              disabled={deleteDisabled}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </TooltipCustom>
      </div>
      {deleteDialog}
    </>
  );
};

Actions.propTypes = {
  dCap: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  editingDisabled: PropTypes.bool.isRequired,
  deleteDisabled: PropTypes.bool.isRequired,
};

function BuildCapsState(id, name, fullBuildCaps, lastFetchError) {
  this.id = id;
  this.name = name;
  this.fullBuildCaps = fullBuildCaps;
  this.lastFetchError = lastFetchError;
}

const DATA = 'data';
const SORTED_IDS = 'sortedIds';
// TODO: Currently build capability component is not using react-query as
// there will be some amount of work and testing efforts. This needs to use it soon after launch.
const BuildCapability = React.memo(
  ({optIECleanSessionOnSave, dispatchContext}) => {
    const dispatch = useContext(dispatchContext);
    // shape of caps is {DATA: {id: BuildCapsState, id: BuildCapsState, ....}, SORTED_IDS: [id2, id4, id1, id3, ....]}
    // !! remember that object keys are always converted to string, beware before using.
    const [caps, setCaps] = useState(null);
    // console.log('caps', caps);
    const dCaps = caps ? caps[DATA] : null;
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(null);
    const [createNew, setCreateNew] = useState(false);
    const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
    const classes = useStyles();
    const summary = useSummaryStyles();

    const fetchAndSetBuildCaps = (dCap, afterSet, afterErrorShow) => {
      const modifyCaps = (data, errorMsg) => {
        setCaps((c) => ({
          [DATA]: {
            ...c[DATA],
            [dCap.id]: new BuildCapsState(
              dCap.id,
              dCap.name,
              data ?? null, // if data is undefined, make it null
              data ? null : errorMsg
            ),
          },
          [SORTED_IDS]: c[SORTED_IDS],
        }));
      };

      async function fetchBuildCapability() {
        try {
          const {data} = await axios(
            `${Endpoints.BUILD_CAPABILITIES}/${dCap.id}`
          );
          const buildCapability = new BuildCapabilities(
            dCap.id,
            data[BuildCapsFields.NAME],
            data[BuildCapsFields.OS],
            data[BuildCapsFields.BN],
            data[BuildCapsFields.BV],
            data[BuildCapsFields.PN],
            data[BuildCapsFields.AIC],
            data[BuildCapsFields.ST],
            data[BuildCapsFields.PLT],
            data[BuildCapsFields.EAT],
            data[BuildCapsFields.SFI],
            data[BuildCapsFields.UPB],
            data[BuildCapsFields.IEESB],
            data[BuildCapsFields.IEEPH],
            data[BuildCapsFields.IERWF],
            data[BuildCapsFields.IEDNE],
            data[BuildCapsFields.IEDECS],
            data[BuildCapsFields.IELL],
            data[BuildCapsFields.CVL],
            data[BuildCapsFields.CSL],
            data[BuildCapsFields.CENL],
            data[BuildCapsFields.CEPL],
            data[BuildCapsFields.FLL],
            data[BuildCapsFields.SM]
          );
          modifyCaps(buildCapability);
          if (afterSet) {
            afterSet();
          }
        } catch (error) {
          handleApiError(
            error,
            (errorMsg) => {
              setSnackbarErrorMsg(errorMsg);
              modifyCaps(null, errorMsg);
            },
            "Couldn't get details"
          );
          if (afterErrorShow) {
            afterErrorShow();
          }
        }
      }

      if (dCap.fullBuildCaps) {
        throw new Error('Nothing to fetch, full capability already there');
      }

      fetchBuildCapability();
    };

    const handleNew = () => {
      setCreateNew(true);
    };

    const handleEdit = (dCap) => {
      setEditing(dCap.id);
      if (!dCap.fullBuildCaps) {
        fetchAndSetBuildCaps(dCap, undefined, () => setEditing(null));
      }
    };

    const addBuildCaps = useCallback((buildCaps) => {
      const id = buildCaps[BuildCapsFields.ID];
      setCaps((c) => {
        const newData = {
          ...c[DATA],
          [id]: new BuildCapsState(
            id,
            buildCaps[BuildCapsFields.NAME],
            buildCaps,
            null
          ),
        };
        let sortedIds = c[SORTED_IDS];
        // we will change sort order only if this cap doesn't yet exist or there is a name change
        // during edit.
        if (
          !c[DATA][id] ||
          buildCaps[BuildCapsFields.NAME] !== c[DATA][id].name
        ) {
          if (!c[DATA][id]) {
            sortedIds = [...c[SORTED_IDS], id];
          }
          sortedIds = getSortedNames(sortedIds, newData);
        }
        return {
          [DATA]: newData,
          [SORTED_IDS]: sortedIds,
        };
      });
    }, []);

    const handleDelete = (dCap) => {
      setCaps((c) => {
        const cloneCaps = {...c[DATA]};
        delete cloneCaps[dCap.id]; // doesn't delete from caps, just from clone
        const cloneSorted = [...c[SORTED_IDS]];
        pull(cloneSorted, dCap.id);
        return {
          [DATA]: cloneCaps,
          [SORTED_IDS]: cloneSorted,
        };
      });

      async function deleteBuildCapability() {
        try {
          await axios.delete(`${Endpoints.BUILD_CAPABILITIES}/${dCap.id}`);
          dispatch({
            type: CONFIG_BUILD_ON_BUILD_CAPS_DELETE,
            payload: {
              buildCapabilityId: dCap.id,
            },
          });
        } catch (error) {
          handleApiError(
            error,
            setSnackbarErrorMsg,
            `Couldn't delete capability ${dCap.name}`
          );
          // on error, revert the deleted caps
          if (dCap.fullBuildCaps) {
            addBuildCaps(dCap.fullBuildCaps);
            return;
          }
          setCaps((c) => {
            const newData = {
              ...c[DATA],
              [dCap.id]: new BuildCapsState(dCap.id, dCap.name),
            };
            return {
              [DATA]: newData,
              [SORTED_IDS]: getSortedNames(
                [...c[SORTED_IDS], dCap.id],
                newData
              ),
            };
          });
        }
      }

      deleteBuildCapability();
    };

    const resetEditNew = useCallback(() => {
      if (editing) {
        setEditing(null);
      } else if (createNew) {
        setCreateNew(false);
      }
    }, [createNew, editing]);

    const onSave = useCallback(
      (buildCaps) => {
        addBuildCaps(buildCaps); // works for both edit or new
        resetEditNew();
      },
      [addBuildCaps, resetEditNew]
    );

    const onCancel = useCallback(() => {
      resetEditNew();
    }, [resetEditNew]);

    const handleChange = (panelId) => (event, isExpanded) => {
      // if some other panel was expanded and it was in error condition, reset error so that
      // if opened again, we will refetch
      if (expanded) {
        const dCap = dCaps[expanded];
        if (dCap.lastFetchError) {
          setCaps((c) => ({
            [DATA]: {
              ...c[DATA],
              [dCap.id]: new BuildCapsState(dCap.id, dCap.name, null, null),
            },
            [SORTED_IDS]: c[SORTED_IDS],
          }));
        }
      }
      setExpanded(isExpanded ? panelId : false);
    };

    const boolText = (val) => {
      return val ? 'Yes' : 'No';
    };

    const getViewRow = (label, value, isBool = false) => {
      return (
        <ViewRow>
          <LabelBox>
            <Label>{`${label}:`}</Label>
          </LabelBox>
          <Value>{isBool ? boolText(value) : value}</Value>
        </ViewRow>
      );
    };

    const createBuildCapsData = () => {
      if (!expanded) {
        return null;
      }
      const dCap = dCaps[expanded];

      // first check whether last api call returned error, if so show that.
      if (dCap.lastFetchError) {
        return (
          <Typography variant="body2" color="error">
            {dCap.lastFetchError}
          </Typography>
        );
      }

      // if no error, check if we've data
      if (dCap.fullBuildCaps) {
        const fullCaps = dCap.fullBuildCaps;
        return (
          <Box display="flex" flexDirection="column">
            <ViewRow>
              <LabelBox>
                <Label>OS:</Label>
              </LabelBox>
              <Box display="flex" alignItems="center">
                <img
                  src={getOsIcon(fullCaps[BuildCapsFields.OS])}
                  alt={fullCaps[BuildCapsFields.OS]}
                />
                <Value style={{marginLeft: '4px'}}>
                  {getOsDisplayName(fullCaps[BuildCapsFields.OS])}
                </Value>
              </Box>
            </ViewRow>
            <ViewRow>
              <LabelBox>
                <Label>Browser:</Label>
              </LabelBox>
              <Box display="flex" alignItems="center">
                <img
                  src={getBrowserIcon(fullCaps[BuildCapsFields.BN])}
                  alt={fullCaps[BuildCapsFields.BN]}
                />
                <Value style={{marginLeft: '4px'}}>
                  {`${getBrowserDisplayName(fullCaps[BuildCapsFields.BN])} ${
                    fullCaps[BuildCapsFields.BV]
                  }`}
                </Value>
              </Box>
            </ViewRow>
            {getViewRow(
              BuildCapsLabels.AIC,
              fullCaps[BuildCapsFields.AIC],
              true
            )}
            {fullCaps[BuildCapsFields.BN] === Browsers.CHROME.VALUE && (
              <>
                {getViewRow(
                  BuildCapsLabels.CVL,
                  fullCaps[BuildCapsFields.CVL],
                  true
                )}
                {getViewRow(
                  BuildCapsLabels.CSL,
                  fullCaps[BuildCapsFields.CSL],
                  true
                )}
                {getViewRow(
                  BuildCapsLabels.CENL,
                  fullCaps[BuildCapsFields.CENL],
                  true
                )}
                {getViewRow(
                  BuildCapsLabels.CEPL,
                  fullCaps[BuildCapsFields.CEPL],
                  true
                )}
              </>
            )}
            {fullCaps[BuildCapsFields.BN] === Browsers.FIREFOX.VALUE &&
              getViewRow(BuildCapsLabels.FLL, fullCaps[BuildCapsFields.FLL])}
            {fullCaps[BuildCapsFields.BN] === Browsers.IE.VALUE &&
              getViewRow(BuildCapsLabels.IELL, fullCaps[BuildCapsFields.IELL])}
            {getViewRow(BuildCapsLabels.SM, fullCaps[BuildCapsFields.SM], true)}
            {getViewRow(BuildCapsLabels.ST, fullCaps[BuildCapsFields.ST])}
            {getViewRow(BuildCapsLabels.PLT, fullCaps[BuildCapsFields.PLT])}
            {getViewRow(BuildCapsLabels.EAT, fullCaps[BuildCapsFields.EAT])}
            {getViewRow(
              BuildCapsLabels.SFI,
              fullCaps[BuildCapsFields.SFI],
              true
            )}
            {getViewRow(BuildCapsLabels.UPB, fullCaps[BuildCapsFields.UPB])}
            {fullCaps[BuildCapsFields.BN] === Browsers.IE.VALUE && (
              <>
                {getViewRow(
                  BuildCapsLabels.IEESB,
                  fullCaps[BuildCapsFields.IEESB]
                )}
                {getViewRow(
                  BuildCapsLabels.IEEPH,
                  fullCaps[BuildCapsFields.IEEPH],
                  true
                )}
                {getViewRow(
                  BuildCapsLabels.IERWF,
                  fullCaps[BuildCapsFields.IERWF],
                  true
                )}
                {getViewRow(
                  BuildCapsLabels.IEDNE,
                  fullCaps[BuildCapsFields.IEDNE],
                  true
                )}
              </>
            )}
          </Box>
        );
      }

      // load from api
      fetchAndSetBuildCaps(dCap);

      // render a loader while data is being fetched
      return (
        <Box display="flex" flexDirection="column">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => (
            <Skeleton variant="text" width="60%" height={15} key={k} />
          ))}
        </Box>
      );
    };

    const buildCapsQuery = useQuery(QueryKeys.BUILD_CAPABILITIES, async () => {
      const {data} = await axios(Endpoints.BUILD_CAPABILITIES);
      return data;
    });

    useEffect(() => {
      if (!buildCapsQuery.data) {
        return;
      }
      const o = {};
      const ids = [];
      buildCapsQuery.data.forEach((d) => {
        o[d.id] = new BuildCapsState(d.id, d.name);
        ids.push(d.id); // preventing Object.keys later as it will return string ids
      });
      if (Object.keys(o).length) {
        setCaps({[DATA]: o, [SORTED_IDS]: getSortedNames(ids, o)});
      }
    }, [buildCapsQuery.data]);

    useEffect(() => {
      if (buildCapsQuery.isError) {
        handleApiError(
          buildCapsQuery.error,
          setSnackbarErrorMsg,
          "Couldn't get existing build capabilities"
        );
      }
    }, [buildCapsQuery.error, buildCapsQuery.isError, setSnackbarErrorMsg]);

    const getNames = useMemo(() => {
      if (!dCaps) {
        return [];
      }
      return Object.values(dCaps).map((v) => v.name);
    }, [dCaps]);

    return (
      <>
        <Box display="flex" justifyContent="flex-end" mb={3}>
          <Button
            variant="contained"
            color="secondary"
            className={classes.button}
            onClick={handleNew}
            disabled={
              buildCapsQuery.isLoading || createNew || Boolean(editing)
            }>
            Add New Build Capability
          </Button>
        </Box>
        <Box display="flex" flexDirection="column" overflow="auto">
          {createNew && (
            <NewCaps
              initialCaps={null}
              existingNames={getNames}
              onSave={onSave}
              onCancel={onCancel}
              optIECleanSessionOnSave={optIECleanSessionOnSave}
            />
          )}
          {dCaps && caps[SORTED_IDS].length
            ? caps[SORTED_IDS].map((k) =>
                editing === dCaps[k].id && dCaps[k].fullBuildCaps ? (
                  <NewCaps
                    initialCaps={dCaps[k].fullBuildCaps}
                    existingNames={getNames.filter((n) => n !== dCaps[k].name)}
                    onSave={onSave}
                    onCancel={onCancel}
                    key={dCaps[k].id}
                  />
                ) : (
                  <Accordion
                    TransitionProps={{unmountOnExit: true}}
                    expanded={expanded === dCaps[k].id} // use object's prop id rather than string key 'k'
                    onChange={handleChange(dCaps[k].id)}
                    data-testid="capContainer"
                    key={dCaps[k].id}>
                    <AccordionSummary
                      aria-controls={`${dCaps[k].id}-content`}
                      id={`${dCaps[k].id}-header`}
                      classes={{
                        root: summary.root,
                        expanded: summary.expanded,
                        content: summary.content,
                      }}
                      data-testid="capSummary">
                      <Typography
                        className={classes.buildCapLink}
                        title="Click to view details">
                        {dCaps[k].name}
                      </Typography>
                      <Box flex={1} display="flex" justifyContent="flex-end">
                        <Actions
                          dCap={dCaps[k]}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                          editingDisabled={Boolean(editing || createNew)}
                          deleteDisabled={editing === dCaps[k].id}
                          key={dCaps[k].id}
                        />
                      </Box>
                      {/* When edit is requested but full data is not available, show a loader
                  until we fetch it, once done, state will change and edit accordion appear
                  replacing this one */}
                      {editing === dCaps[k].id && !dCaps[k].fullBuildCaps && (
                        <Box
                          position="absolute"
                          bottom={0}
                          left={0}
                          width="100%">
                          <LinearProgress color="secondary" />
                        </Box>
                      )}
                    </AccordionSummary>
                    <AccordionDetails
                      classes={{root: classes.capsDetail}}
                      data-testid="capDetails">
                      {expanded &&
                        expanded === dCaps[k].id &&
                        createBuildCapsData()}
                    </AccordionDetails>
                  </Accordion>
                )
              )
            : null}
          {buildCapsQuery.isLoading ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              width="100%">
              {[1, 2, 3, 4].map((k) => (
                <Skeleton variant="text" width="100%" height={50} key={k} />
              ))}
            </Box>
          ) : null}
          {!buildCapsQuery.isLoading &&
          !createNew &&
          (!dCaps || !caps[SORTED_IDS].length) ? (
            <Typography
              variant="body1"
              style={{textAlign: 'center', marginTop: '20px'}}>
              Nothing to show yet, add a new capability
            </Typography>
          ) : null}
        </Box>
        {snackbarTypeError}
      </>
    );
  }
);

BuildCapability.propTypes = {
  optIECleanSessionOnSave: PropTypes.bool,
  dispatchContext: PropTypes.shape(getContextObjShape()).isRequired,
};

BuildCapability.defaultProps = {
  optIECleanSessionOnSave: false,
};

export default BuildCapability;
