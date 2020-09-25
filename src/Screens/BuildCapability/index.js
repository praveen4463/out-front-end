import React, {useState, useEffect} from 'react';
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
import {random, pull} from 'lodash-es';
import PropTypes from 'prop-types';
import NewCaps from './NewCaps';
import useSnackbarTypeError from '../../hooks/useSnackbarTypeError';
import useConfirmationDialog from '../../hooks/useConfirmationDialog';
import TooltipCustom from '../../TooltipCustom';
import {
  ApiStatuses,
  Browsers,
  Platforms,
  Os,
  BuildCapsLabels,
  BuildCapsFields,
} from '../../Constants';
import {BuildCapabilities} from '../../model';
import {
  getOsDisplayName,
  getBrowserDisplayName,
  getBrowserIcon,
  getOsIcon,
  getSortedNames,
} from '../../common';

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
  button: {
    textTransform: 'unset',
    fontWeight: 400,
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
  return <Box className={classes.viewRow}>{children}</Box>;
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

const Actions = React.memo(
  ({dCap, onDelete, onEdit, editingDisabled, deleteDisabled}) => {
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

    const handleEdit = () => {
      onEdit(dCap);
    };

    return (
      <>
        <div>
          <TooltipCustom title="Edit Capability">
            <IconButton
              aria-label="Edit Capability"
              onClick={handleEdit}
              disabled={editingDisabled}
              className={classes.linkButton}>
              <EditIcon fontSize="small" />
            </IconButton>
          </TooltipCustom>
          <TooltipCustom title="Delete Capability">
            <IconButton
              aria-label="Delete Capability"
              onClick={handleDelete}
              className={classes.linkButton}
              disabled={deleteDisabled}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </TooltipCustom>
        </div>
        {deleteDialog}
      </>
    );
  }
);

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

const BuildCapability = ({optIECleanSessionOnSave}) => {
  // shape of caps is {DATA: {id: BuildCapsState, id: BuildCapsState, ....}, SORTED_IDS: [id2, id4, id1, id3, ....]}
  // !! remember that object keys are always converted to string, beware before using.
  const [caps, setCaps] = useState(null);
  const dCaps = caps ? caps[DATA] : null;
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [createNew, setCreateNew] = useState(false);
  const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
  const classes = useStyles();
  const summary = useSummaryStyles();

  const fetchAndSetBuildCaps = (dCap, afterSet, afterErrorShow) => {
    const modifyCaps = (response, errorMsg) => {
      setCaps((c) => ({
        [DATA]: {
          ...c[DATA],
          [dCap.id]: new BuildCapsState(
            dCap.id,
            dCap.name,
            response.data || null,
            response.error ? errorMsg : null
          ),
        },
        [SORTED_IDS]: c[SORTED_IDS],
      }));
    };
    const onSuccess = (response) => {
      modifyCaps(response);
      if (afterSet) {
        afterSet();
      }
    };
    const onError = (response) => {
      const error = `Couldn't get details, ${response.error.reason}`;
      modifyCaps(response, error);
      setSnackbarErrorMsg(error);
      if (afterErrorShow) {
        afterErrorShow();
      }
    };

    if (dCap.fullBuildCaps) {
      throw new Error('Nothing to fetch, full capability already there');
    }
    setTimeout(() => {
      const response = {
        status: ApiStatuses.SUCCESS,
        data: new BuildCapabilities(
          dCap.id,
          dCap.name,
          random(1, 10) > 5 ? Os.WIN10.VALUE : Os.WIN8_1.VALUE,
          random(1, 10) > 5 ? Browsers.CHROME.VALUE : Browsers.FIREFOX.VALUE,
          random(70, 85),
          Platforms.WINDOWS,
          false,
          random(30000, 60000),
          random(100000, 200000),
          random(30000, 60000)
        ),
      };
      if (response.status === ApiStatuses.SUCCESS) {
        onSuccess(response);
      } else {
        onError(response);
      }
    }, 500);
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

  const addBuildCaps = (buildCaps) => {
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
      if (!dCaps[id] || buildCaps[BuildCapsFields.NAME] !== dCaps[id].name) {
        if (!dCaps[id]) {
          sortedIds = [...c[SORTED_IDS], id];
        }
        sortedIds = getSortedNames(sortedIds, newData);
      }
      return {
        [DATA]: newData,
        [SORTED_IDS]: sortedIds,
      };
    });
  };

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

    const onError = (response) => {
      setSnackbarErrorMsg(
        `Couldn't delete capability ${dCap.name}, ${response.error.reason}`
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
          [SORTED_IDS]: getSortedNames([...c[SORTED_IDS], dCap.id], newData),
        };
      });
    };
    setTimeout(() => {
      /* const response = {
        status: ApiStatuses.SUCCESS,
      }; */
      const response = {
        status: ApiStatuses.FAILURE,
        error: {
          reason: 'Network error',
        },
      };
      if (response.status === ApiStatuses.FAILURE) {
        onError(response);
      }
    }, 500);
  };

  const resetEditOrNew = () => {
    if (editing) {
      setEditing(null);
    } else if (createNew) {
      setCreateNew(false);
    }
  };

  // TODO: currently i am not checking whether a change was made as part of edit
  // before sending api request, check this and skip api request, better is to
  // not allow submit if there was no change.
  const onSave = (buildCaps) => {
    addBuildCaps(buildCaps); // works for both edit or new
    resetEditOrNew();
  };

  const onCancel = () => {
    resetEditOrNew();
  };

  const handleChange = (panelId) => (event, isExpanded) => {
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

    // first check whether last api call returned error, if so show that rather than stale data
    if (dCap.lastFetchError) {
      return (
        <Typography variant="body2" color="error">
          {dCap.lastFetchError}
        </Typography>
      );
    }

    // if no error, check if we've data, we won't have any data if this is the first load
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
                alt={fullCaps[BuildCapsFields.BBN]}
              />
              <Value style={{marginLeft: '4px'}}>
                {`${getBrowserDisplayName(fullCaps[BuildCapsFields.BN])} ${
                  fullCaps[BuildCapsFields.BV]
                }`}
              </Value>
            </Box>
          </ViewRow>
          {getViewRow(BuildCapsLabels.AIC, fullCaps[BuildCapsFields.AIC], true)}
          {getViewRow(BuildCapsLabels.CVL, fullCaps[BuildCapsFields.CVL], true)}
          {getViewRow(BuildCapsLabels.CSL, fullCaps[BuildCapsFields.CSL], true)}
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
          {getViewRow(BuildCapsLabels.FLL, fullCaps[BuildCapsFields.FLL])}
          {getViewRow(BuildCapsLabels.IELL, fullCaps[BuildCapsFields.IELL])}
          {getViewRow(BuildCapsLabels.SM, fullCaps[BuildCapsFields.SM], true)}
          {getViewRow(BuildCapsLabels.ST, fullCaps[BuildCapsFields.ST])}
          {getViewRow(BuildCapsLabels.PLT, fullCaps[BuildCapsFields.PLT])}
          {getViewRow(BuildCapsLabels.EAT, fullCaps[BuildCapsFields.EAT])}
          {getViewRow(BuildCapsLabels.SFI, fullCaps[BuildCapsFields.SFI], true)}
          {getViewRow(BuildCapsLabels.UPB, fullCaps[BuildCapsFields.UPB])}
          {getViewRow(BuildCapsLabels.IEESB, fullCaps[BuildCapsFields.IEESB])}
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
        </Box>
      );
    }

    // This is the first expand for this capability, load from api
    fetchAndSetBuildCaps(dCap);

    // render a loader while data is being fetched
    return (
      <Box display="flex" flexDirection="column">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => (
          <Skeleton variant="text" width="40%" height={15} key={k} />
        ))}
      </Box>
    );
  };

  useEffect(() => {
    setIsLoading(true);

    const onSuccess = (response) => {
      const {data} = response;
      const o = {};
      const ids = [];
      data.forEach((d) => {
        o[d.id] = new BuildCapsState(d.id, d.name);
        ids.push(d.id); // preventing Object.keys later as it will return string ids
      });
      if (Object.keys(o).length) {
        setCaps({[DATA]: o, [SORTED_IDS]: getSortedNames(ids, o)});
      }
    };
    const onError = (response) => {
      setSnackbarErrorMsg(
        `Couldn't get existing build capabilities, ${response.error.reason}`
      );
    };
    setTimeout(() => {
      setIsLoading(false);
      const response = {
        status: ApiStatuses.SUCCESS,
        data: [
          {id: 1, name: 'chrome85_win10_debug'},
          {id: 2, name: 'firefox85_win8.1_debug'},
          {id: 3, name: 'ie11_win10'},
        ],
      };
      if (response.status === ApiStatuses.SUCCESS) {
        onSuccess(response);
      } else if (response === ApiStatuses.FAILURE) {
        onError(response);
      }
    }, 1000);
  }, [setSnackbarErrorMsg]);

  const addButton = (
    <Box display="flex" justifyContent="flex-end" mb={3}>
      <Button
        variant="contained"
        color="secondary"
        className={classes.button}
        onClick={handleNew}
        disabled={isLoading}>
        Add New Build Capability
      </Button>
    </Box>
  );

  if (isLoading) {
    return (
      <>
        <Box width="100%" display="flex" flexDirection="column">
          {addButton}
          <Box display="flex" flexDirection="column" alignItems="center">
            {[1, 2, 3, 4].map((k) => (
              <Skeleton variant="text" width="50%" height={20} key={k} />
            ))}
          </Box>
        </Box>
        {snackbarTypeError}
      </>
    );
  }

  return (
    <>
      {addButton}
      <Box display="flex" flexDirection="column" overflow="auto">
        {createNew && (
          <NewCaps
            initialCaps={null}
            onSave={onSave}
            onCancel={onCancel}
            optIECleanSessionOnSave={optIECleanSessionOnSave}
          />
        )}
        {dCaps ? (
          caps[SORTED_IDS].map((k) =>
            editing === dCaps[k].id && dCaps[k].fullBuildCaps ? (
              <NewCaps
                initialCaps={dCaps[k].fullBuildCaps}
                onSave={onSave}
                onCancel={onCancel}
              />
            ) : (
              <Accordion
                TransitionProps={{unmountOnExit: true}}
                expanded={expanded === dCaps[k].id} // use object's prop id rather than string key 'k'
                onChange={handleChange(dCaps[k].id)}
                key={dCaps[k].id}>
                <AccordionSummary
                  aria-controls={`${dCaps[k].id}-content`}
                  id={`${dCaps[k].id}-header`}
                  classes={{
                    root: summary.root,
                    expanded: summary.expanded,
                    content: summary.content,
                  }}>
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
                      editingDisabled={editing || createNew}
                      deleteDisabled={editing === dCaps[k].id}
                    />
                  </Box>
                  {/* When edit is requested but full data is not available, show a loader
                  until we fetch it, once done, state will change and edit accordion appear
                  replacing this one */}
                  {editing === dCaps[k].id && !dCaps[k].fullBuildCaps && (
                    <Box position="absolute" bottom={0} left={0} width="100%">
                      <LinearProgress color="secondary" />
                    </Box>
                  )}
                </AccordionSummary>
                <AccordionDetails classes={{root: classes.capsDetail}}>
                  {expanded === dCaps[k].id && createBuildCapsData()}
                </AccordionDetails>
              </Accordion>
            )
          )
        ) : (
          <Typography
            variant="body1"
            style={{textAlign: 'center', marginTop: '20px'}}>
            Nothing to show yet, add a new capability
          </Typography>
        )}
      </Box>
      {snackbarTypeError}
    </>
  );
};

BuildCapability.propTypes = {
  optIECleanSessionOnSave: PropTypes.bool,
};

BuildCapability.defaultProps = {
  optIECleanSessionOnSave: false,
};

export default BuildCapability;
