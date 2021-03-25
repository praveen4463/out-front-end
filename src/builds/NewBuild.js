import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import InfoIcon from '@material-ui/icons/Info';
import MenuItem from '@material-ui/core/MenuItem';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {makeStyles} from '@material-ui/core/styles';
import FormHelperText from '@material-ui/core/FormHelperText';
import clsx from 'clsx';
import intersection from 'lodash-es/intersection';
import {useQuery, useQueryClient} from 'react-query';
import axios from 'axios';
import PropTypes from 'prop-types';
import {useLocation, useHistory} from 'react-router-dom';
import TooltipCustom from '../TooltipCustom';
import TestSelect from '../components/TestSelect';
import {
  handleApiError,
  getNumberParamFromUrl,
  getLocation,
  addInSearchQuery,
  getParseEndpoint,
  updateBuildConfigSelectedVersions,
  getNewBuildWithoutSessionEndpoint,
} from '../common';
import {
  BuildConfigLabels,
  BuildConfigFields,
  BuildConfigInfo,
  BuildConfigKeys,
  QueryKeys,
  SearchKeys,
  PageUrl,
  BuildSourceType,
  Timeouts,
  SnackbarType,
  SnackbarVerPos,
  SnackbarHorPos,
} from '../Constants';
import resolutions from '../config/desktopResolution.json';
import timezones from '../config/timezones.json';
import SelectBuildVars from '../components/SelectBuildVars';
import StyledSelect from '../components/StyledSelect';
import StyledSwitch from '../components/StyledSwitch';
import {BuildsSnackbarContext, HomeLinearProgressContext} from '../contexts';
import {
  buildCapabilitiesFetch,
  buildVarsFetch,
  filesWithTestsFetch,
} from '../api/fetches';
import {
  BuildConfig,
  FilesWithTestsApiConfig,
  SnackbarAlertProps,
} from '../model';
import Loader from '../components/Loader';
import {getOrderedVersionsFromFiles} from '../reducers/common';
import {newSessionInBackground} from '../buildsCommon';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    height: '100%',
  },
  mainContent: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.background.contrastText,
  },
  testSelect: {
    maxHeight: 500,
    minHeight: 20,
    padding: 12,
    boxShadow: theme.shadows[1],
    backgroundColor: theme.palette.background.paperContrast,
    overflow: 'auto',
  },
  infoLabel: {
    marginLeft: '4px',
    fontSize: '1rem',
    color: theme.palette.background.contrastText,
    cursor: 'pointer',
  },
  notesIcon: {
    marginRight: '4px',
    fontSize: '1rem',
    color: theme.palette.background.contrastText,
  },
  label: {
    fontWeight: 600,
  },
  labelPadding: {
    paddingBottom: theme.spacing(1),
  },
  accordion: {
    backgroundColor: theme.palette.background.paperContrast,
  },
  accordionRunnerPrefs: {
    flexDirection: 'column',
  },
  text: {
    fontSize: '0.875rem',
    color: theme.palette.background.contrastText,
  },
  error: {
    border: `1px solid ${theme.palette.error.main}`,
  },
  textField: {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    fontSize: '1rem',
  },
  selectBuildVars: {
    backgroundColor: theme.palette.background.paperContrast,
  },
  buttonSubmit: {
    paddingLeft: theme.spacing(6),
    paddingRight: theme.spacing(6),
  },
}));

const ElementRow = ({children}) => {
  return (
    <Box display="flex" flexDirection="column" pb={2}>
      {children}
    </Box>
  );
};

ElementRow.propTypes = {
  children: PropTypes.node.isRequired,
};

const ValidatedFields = {
  BCAPS: 'BCAPS',
  TESTS: 'TESTS',
};

const initialError = {
  [ValidatedFields.BCAPS]: null,
  [ValidatedFields.TESTS]: null,
};

const filesWithTestsConfig = new FilesWithTestsApiConfig(true, true);

const NewBuild = () => {
  const [parsing, setParsing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [buildConfig, setBuildConfig] = useState(new BuildConfig());
  const [error, setError] = useState(initialError);
  const [lastParseFailureVersionIds, setLastParseFailureVersionIds] = useState(
    []
  );
  const location = useLocation();
  const history = useHistory();
  const setProgressAtTopBar = useContext(HomeLinearProgressContext);
  const queryClient = useQueryClient();
  const projectId = useMemo(
    () => getNumberParamFromUrl(SearchKeys.PROJECT_QS, location.search),
    [location.search]
  );
  const [setSnackbarAlertProps, setSnackbarAlertError] = useContext(
    BuildsSnackbarContext
  );

  const {
    data: buildCaps,
    isLoading: buildCapsLoading,
    error: buildCapsError,
  } = useQuery(QueryKeys.BUILD_CAPABILITIES, buildCapabilitiesFetch);

  const filesQueryKey = useMemo(
    () => [QueryKeys.FILES_WITH_TESTS, projectId, filesWithTestsConfig],
    [projectId]
  );

  const {data: files, isLoading: filesLoading, error: filesError} = useQuery(
    filesQueryKey,
    filesWithTestsFetch
  );

  const {
    data: buildVars,
    isLoading: buildVarsLoading,
    error: buildVarsError,
  } = useQuery([QueryKeys.BUILD_VARS, projectId], buildVarsFetch);

  const locationInState =
    location.state && location.state.location ? location.state.location : null;
  const classes = useStyles();
  useEffect(() => {
    if (buildCapsError) {
      handleApiError(
        buildCapsError,
        setSnackbarAlertError,
        "Couldn't get build capabilities"
      );
    }
  }, [buildCapsError, setSnackbarAlertError]);

  useEffect(() => {
    if (filesError) {
      handleApiError(filesError, setSnackbarAlertError, "Couldn't get files");
    }
  }, [filesError, setSnackbarAlertError]);

  useEffect(() => {
    if (buildVarsError) {
      handleApiError(
        buildVarsError,
        setSnackbarAlertError,
        "Couldn't get build variables"
      );
    }
  }, [buildVarsError, setSnackbarAlertError]);

  // using an effect so that we don't invoke it too often.
  useEffect(() => {
    setProgressAtTopBar(submitted || parsing);
    return () => setProgressAtTopBar(false);
  }, [submitted, parsing, setProgressAtTopBar]);

  const validateOnRun = () => {
    const errors = {};
    if (!buildConfig[BuildConfigFields.BCAP]) {
      errors[ValidatedFields.BCAPS] = 'Build Capability is required';
    }
    const selectedVersions = buildConfig[BuildConfigFields.SV];
    if (!selectedVersions.size) {
      errors[ValidatedFields.TESTS] = 'Some test(s) must be selected';
    }
    return errors;
  };

  const setTestsError = useCallback((value) => {
    setError((er) => ({...er, [ValidatedFields.TESTS]: value}));
  }, []);

  const resetErrorOnChange = (validatedField) => {
    if (error[validatedField]) {
      setError({...error, [validatedField]: null});
    }
  };

  const setLastParseResultsToFile = useCallback(
    (vIds) => {
      queryClient.setQueryData(filesQueryKey, (old) => {
        const clone = {
          ...old,
          entities: {
            versions: {...old.entities.versions},
            tests: {...old.entities.tests},
            files: {...old.entities.files},
          },
        };
        const et = clone.entities;
        // while cloning, also reset errorInExp status before setting fresh from
        // incoming data.
        Object.keys(et.versions).forEach((k) => {
          et.versions[k] = {...et.versions[k], showAsErrorInExplorer: false};
        });
        Object.keys(et.tests).forEach((k) => {
          et.tests[k] = {...et.tests[k], showAsErrorInExplorer: false};
        });
        Object.keys(et.files).forEach((k) => {
          et.files[k] = {...et.files[k], showAsErrorInExplorer: false};
        });
        // cloning done, now mutate
        vIds.forEach((versionId) => {
          const version = et.versions[versionId];
          version.showAsErrorInExplorer = true;
          const test = et.tests[version.testId];
          test.showAsErrorInExplorer = true;
          const file = et.files[test.fileId];
          file.showAsErrorInExplorer = true;
        });
        clone.lastParseResultApplied = true;
        return clone;
      });
    },
    [filesQueryKey, queryClient]
  );

  // when files data changes, apply last parse result to files so that user knows
  // what all files failed parsing and could fix them. After fixing user submits
  // again which parses files again.
  useEffect(() => {
    // lastParseResultApplied property allows us to prevent re-running this effect.
    // When we apply last parse result, data changes leading to re-run. This prop
    // checks whether we already applied that. It also prevents running this effect
    // when lastParse versions changes as after version changes, this prop would
    // already be set in files data.
    if (
      !files ||
      !lastParseFailureVersionIds.length ||
      files.lastParseResultApplied
    ) {
      return;
    }
    setLastParseResultsToFile(lastParseFailureVersionIds);
  }, [files, lastParseFailureVersionIds, setLastParseResultsToFile]);

  const handleTestSelectionChange = (itemType, itemId, isSelected) => {
    const clonedSelectedVersions = new Set(buildConfig[BuildConfigFields.SV]);
    updateBuildConfigSelectedVersions(
      clonedSelectedVersions,
      files,
      itemType,
      itemId,
      isSelected
    );
    setBuildConfig((b) => ({
      ...b,
      [BuildConfigFields.SV]: clonedSelectedVersions,
    }));
    resetErrorOnChange(ValidatedFields.TESTS);
  };

  const handleBuildVarSelect = (buildVar) => {
    const clonedSelectedBuildVars = {
      ...buildConfig[BuildConfigFields.SBVIPK],
      [buildVar.key]: buildVar.id,
    };
    setBuildConfig((b) => ({
      ...b,
      [BuildConfigFields.SBVIPK]: clonedSelectedBuildVars,
    }));
  };

  const handleChange = (e) => {
    const el = e.target;
    const {name, type} = el;
    let value;
    switch (type) {
      case 'checkbox':
        value = el.checked;
        break;
      default:
        value = el.value;
        break;
    }
    setBuildConfig((b) => ({
      ...b,
      [name]: value,
    }));
    if (name === BuildConfigFields.BCAP) {
      resetErrorOnChange(ValidatedFields.BCAPS);
    }
  };

  const handleRun = async () => {
    const errors = validateOnRun();
    if (Object.keys(errors).length > 0) {
      setError({...error, ...errors});
      return;
    }
    // parse all selected versions, and every time user has submitted page. Store
    // parse results in state.
    // If query data changes due to may be user refocusing window, we should apply
    // last parse results in it.
    setParsing(true);
    try {
      const {data} = await axios.get(
        getParseEndpoint(
          Array.from(buildConfig[BuildConfigFields.SV]).join(',')
        )
      );
      if (data.length) {
        // we've parse errors in some versions
        const parseFailedVersionIds = data.map((p) => p.versionId);
        // set results to files data first and then update session so that before
        // the effect that listens for files and lastParseResult changes run, we've
        // set results to file so that it doesn't run.
        setLastParseResultsToFile(parseFailedVersionIds);
        setLastParseFailureVersionIds(parseFailedVersionIds);
        setTestsError(
          "Can't start build, there are parse errors in some of selected file(s) (marked as red)."
        );
        return;
      }
    } catch (ex) {
      handleApiError(ex, setSnackbarAlertError, 'Error while parsing test(s)');
    } finally {
      setParsing(false);
    }
    const orderedVersionIds = intersection(
      getOrderedVersionsFromFiles(files),
      Array.from(buildConfig[BuildConfigFields.SV])
    );
    // check whether the selected tests actually in files now, and show error if
    // none are there possibly because user deleted those tests in between.
    if (!orderedVersionIds.length) {
      setTestsError('Some test(s) must be selected');
    }
    setSubmitted(true);
    try {
      const {data: newRunBuildId} = await axios.post(
        getNewBuildWithoutSessionEndpoint(projectId),
        {
          buildName: buildConfig[BuildConfigFields.NAME],
          buildCapabilityId: buildConfig[BuildConfigFields.BCAP],
          displayResolution: buildConfig[BuildConfigFields.DR],
          timezone: buildConfig[BuildConfigFields.TZ],
          selectedBuildVarIdPerKey: buildConfig[BuildConfigFields.SBVIPK],
          runnerPreferences: {
            abortOnFailure: buildConfig[BuildConfigFields.AOF],
            aetKeepSingleWindow: buildConfig[BuildConfigFields.AKSW],
            aetUpdateUrlBlank: buildConfig[BuildConfigFields.AUUB],
            aetResetTimeouts: buildConfig[BuildConfigFields.ART],
            aetDeleteAllCookies: buildConfig[BuildConfigFields.ADAC],
          },
          buildSourceType: BuildSourceType.NOT_IDE,
          versionIds: orderedVersionIds,
        },
        {
          timeout: Timeouts.API_TIMEOUT_SMALL,
        }
      );
      newSessionInBackground(
        newRunBuildId,
        buildConfig[BuildConfigFields.NAME],
        setSnackbarAlertProps
      );
      // wait for a few seconds before redirecting to running builds to let request
      // make it to api and change db.
      setTimeout(() => {
        setSnackbarAlertProps(
          new SnackbarAlertProps(
            `A new build # ${newRunBuildId} is successfully created and should` +
              " appear in 'Running Builds' shortly.",
            SnackbarType.SUCCESS,
            SnackbarVerPos.TOP,
            SnackbarHorPos.CENTER,
            3000
          )
        );
        history.push(
          getLocation(
            `${PageUrl.BUILDS}${PageUrl.RUNNING_BUILDS}`,
            addInSearchQuery('', SearchKeys.PROJECT_QS, projectId)
          )
        );
      }, 2000);
    } catch (ex) {
      handleApiError(ex, (errorMsg) =>
        setSnackbarAlertProps(
          new SnackbarAlertProps(
            errorMsg,
            SnackbarType.ERROR,
            SnackbarVerPos.TOP,
            SnackbarHorPos.CENTER,
            15000
          )
        )
      );
      setSubmitted(false);
    }
  };

  const handleCancel = () => {
    history.push(
      locationInState ||
        getLocation(
          PageUrl.BUILDS,
          addInSearchQuery('', SearchKeys.PROJECT_QS, projectId)
        )
    );
  };

  const getLabel = (label, forId, noPadding = false) => {
    return (
      <Typography
        variant="body2"
        component="label"
        htmlFor={forId}
        className={clsx(classes.label, !noPadding && classes.labelPadding)}>
        {label}
      </Typography>
    );
  };

  const getInfoLabel = (configKey, forId) => {
    return (
      <Box display="flex" alignItems="center" className={classes.labelPadding}>
        {getLabel(BuildConfigLabels[configKey], forId, true)}
        <TooltipCustom title={BuildConfigInfo[configKey]} placement="right">
          <InfoIcon fontSize="small" className={classes.infoLabel} />
        </TooltipCustom>
      </Box>
    );
  };

  const getNotesLabel = (text) => (
    <Box
      display="flex"
      alignItems="center"
      className={clsx(classes.labelPadding, classes.label)}
      fontSize="body2.fontSize">
      <InfoIcon fontSize="small" className={classes.notesIcon} />
      {text}
    </Box>
  );

  const getSwitch = (
    name,
    isChecked,
    label,
    helpText,
    labelPlacement = 'top'
  ) => (
    <StyledSwitch
      name={name}
      isChecked={isChecked}
      label={label}
      helpText={helpText}
      handleChange={handleChange}
      labelPlacement={labelPlacement}
    />
  );

  const getBuildCapsLabel = () => {
    if (!buildCaps) {
      return 'Loading...';
    }
    if (buildConfig[BuildConfigFields.BCAP]) {
      return '';
    }
    return 'Select build capability';
  };

  const getTimezoneOptions = useMemo(() => {
    return timezones.map((t) => (
      <MenuItem value={t.value} key={t.value}>
        {t.text}
      </MenuItem>
    ));
  }, []);

  return (
    <Box display="flex" flexDirection="column" className={classes.root}>
      <Box pb={2} display="flex" alignItems="center">
        <Typography variant="h4">New Build</Typography>
        <Box flex={1} />
        <Button
          variant="contained"
          color="secondary"
          onClick={handleRun}
          className={classes.buttonSubmit}
          disabled={submitted || parsing}>
          {submitted ? 'Trying to run...' : ''}
          {parsing ? 'Parsing test(s)...' : ''}
          {!submitted && !parsing ? 'Run Build' : ''}
        </Button>
        <Button
          variant="contained"
          style={{marginLeft: '8px'}}
          onClick={handleCancel}
          disabled={submitted || parsing}>
          Cancel
        </Button>
      </Box>
      <Box
        className={classes.mainContent}
        boxShadow={3}
        display="flex"
        flexDirection="column"
        overflow="auto"
        p={4}>
        {buildCapsLoading || filesLoading || buildVarsLoading ? (
          <Box width="100%">
            <Loader rows={4} />
          </Box>
        ) : (
          <>
            <ElementRow>
              {getInfoLabel(BuildConfigKeys.NAME, BuildConfigFields.NAME)}
              <TextField
                name={BuildConfigFields.NAME}
                id={BuildConfigFields.NAME}
                variant="outlined"
                margin="none"
                fullWidth
                InputProps={{
                  classes: {input: classes.textField},
                  inputProps: {tabIndex: '0'},
                }}
                value={buildConfig[BuildConfigFields.NAME] || ''}
                onChange={handleChange}
              />
            </ElementRow>
            <ElementRow>
              {getLabel(BuildConfigLabels.BCAP, BuildConfigFields.BCAP)}
              <StyledSelect
                id={BuildConfigFields.BCAP}
                selected={
                  buildCaps && buildConfig[BuildConfigFields.BCAP]
                    ? `${buildConfig[BuildConfigFields.BCAP]}`
                    : ''
                }
                label={getBuildCapsLabel()}
                onChange={handleChange}
                error={error[ValidatedFields.BCAPS]}
                disabled={!buildCaps}>
                {!buildCaps
                  ? null
                  : buildCaps.map((b) => (
                      <MenuItem value={b.id} key={b.id}>
                        {b.name}
                      </MenuItem>
                    ))}
              </StyledSelect>
            </ElementRow>
            <ElementRow>
              {getInfoLabel(BuildConfigKeys.SV, 'testSelect')}
              {getNotesLabel(
                'Any test having empty code will not be shown below.'
              )}
              <Box
                className={clsx(
                  classes.testSelect,
                  Boolean(error[ValidatedFields.TESTS]) && classes.error
                )}>
                <TestSelect
                  files={files}
                  onItemSelectionChange={handleTestSelectionChange}
                  selectedVersions={buildConfig[BuildConfigFields.SV]}
                  noTestMsg="No test found. Add some test(s) from IDE."
                />
              </Box>
              <FormHelperText error>
                {error[ValidatedFields.TESTS ?? '']}
              </FormHelperText>
            </ElementRow>
            <ElementRow>
              {getInfoLabel(BuildConfigKeys.DR, BuildConfigFields.DR)}
              <StyledSelect
                id={BuildConfigFields.DR}
                selected={buildConfig[BuildConfigFields.DR]}
                onChange={handleChange}>
                {resolutions.map((r) => (
                  <MenuItem value={r} key={r}>
                    {r}
                  </MenuItem>
                ))}
              </StyledSelect>
            </ElementRow>
            <ElementRow>
              {getInfoLabel(BuildConfigKeys.TZ, BuildConfigFields.TZ)}
              <StyledSelect
                id={BuildConfigFields.TZ}
                selected={buildConfig[BuildConfigFields.TZ]}
                onChange={handleChange}>
                {getTimezoneOptions}
              </StyledSelect>
            </ElementRow>
            <ElementRow>
              {getInfoLabel(BuildConfigKeys.SBVIPK, 'selectBuildVars-header')}
              <Box className={classes.selectBuildVars}>
                <SelectBuildVars
                  varBuild={buildVars}
                  selectedBuildVarIdPerKey={
                    buildConfig[BuildConfigFields.SBVIPK]
                  }
                  onSelect={handleBuildVarSelect}
                  accordionClasses={{root: classes.accordion}}
                />
              </Box>
            </ElementRow>
            <ElementRow>
              {getLabel("Runner's Preferences", 'runnerPreferences-header')}
              <Accordion classes={{root: classes.accordion}}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="runnerPreferences-content"
                  id="runnerPreferences-header">
                  <Typography className={classes.text}>
                    Advanced Zylitics Runner Preferences
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.accordionRunnerPrefs}>
                  {getSwitch(
                    BuildConfigFields.AOF,
                    buildConfig[BuildConfigFields.AOF],
                    BuildConfigLabels.AOF,
                    BuildConfigInfo.AOF
                  )}
                  {getSwitch(
                    BuildConfigFields.AKSW,
                    buildConfig[BuildConfigFields.AKSW],
                    BuildConfigLabels.AKSW,
                    BuildConfigInfo.AKSW
                  )}
                  {getSwitch(
                    BuildConfigFields.AUUB,
                    buildConfig[BuildConfigFields.AUUB],
                    BuildConfigLabels.AUUB,
                    BuildConfigInfo.AUUB
                  )}
                  {getSwitch(
                    BuildConfigFields.ART,
                    buildConfig[BuildConfigFields.ART],
                    BuildConfigLabels.ART,
                    BuildConfigInfo.ART
                  )}
                  {getSwitch(
                    BuildConfigFields.ADAC,
                    buildConfig[BuildConfigFields.ADAC],
                    BuildConfigLabels.ADAC,
                    BuildConfigInfo.ADAC
                  )}
                </AccordionDetails>
              </Accordion>
            </ElementRow>
          </>
        )}
      </Box>
    </Box>
  );
};

export default NewBuild;
