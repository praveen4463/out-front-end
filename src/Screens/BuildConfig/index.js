import React, {useContext, useState, useEffect, useMemo} from 'react';
import Container from '@material-ui/core/Container';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import InfoIcon from '@material-ui/icons/Info';
import MenuItem from '@material-ui/core/MenuItem';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {makeStyles} from '@material-ui/core/styles';
import FormHelperText from '@material-ui/core/FormHelperText';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {useQuery} from 'react-query';
import TooltipCustom from '../../TooltipCustom';
import TestSelect from '../../components/TestSelect';
import {
  CONFIG_BUILD_UPDATE_SELECTED_VERSIONS,
  CONFIG_BUILD_ADD_BUILD_VAR,
  CONFIG_BUILD_UPDATE_BY_PROP,
  BUILD_START_RUN,
  BUILD_CANCEL_RUN,
} from '../../actions/actionTypes';
import {getContextObjShape, handleApiError} from '../../common';
import useSnackbarTypeError from '../../hooks/useSnackbarTypeError';
import {
  BuildConfigLabels,
  BuildConfigFields,
  BuildConfigInfo,
  BuildConfigKeys,
  QueryKeys,
} from '../../Constants';
import resolutions from '../../config/desktopResolution.json';
import timezones from '../../config/timezones.json';
import SelectBuildVars from '../../components/SelectBuildVars';
import StyledSelect from '../../components/StyledSelect';
import StyledSwitch from '../../components/StyledSwitch';
import {buildCapabilitiesFetch} from '../../api/fetches';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    color: theme.palette.background.contrastText,
    height: '100%',
  },
  testSelect: {
    maxHeight: 500,
    minHeight: 20,
    padding: 12,
    boxShadow: theme.shadows[1],
    backgroundColor: theme.palette.background.paper,
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
    color: theme.palette.text.secondary,
  },
  labelPadding: {
    paddingBottom: theme.spacing(1),
  },
  button: {
    marginLeft: theme.spacing(1),
  },
  buttonSave: {
    padding: `0px ${theme.spacing(6)}px`,
  },
  bottomBar: {
    backgroundColor: theme.palette.background.paper,
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
  },
  accordionDetail: {
    flexDirection: 'column',
  },
  text: {
    fontSize: '0.875rem',
    color: theme.palette.background.contrastText,
  },
  error: {
    border: `1px solid ${theme.palette.error.main}`,
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

const BuildConfig = ({
  closeDialog,
  dispatchContext,
  filesContext,
  buildContext,
  buildConfigContext,
  varsContext,
}) => {
  const dispatch = useContext(dispatchContext);
  const files = useContext(filesContext);
  const build = useContext(buildContext);
  const buildConfig = useContext(buildConfigContext);
  const buildVars = useContext(varsContext).build;
  const [error, setError] = useState(initialError);
  const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
  const classes = useStyles();

  const buildCapsQuery = useQuery(
    QueryKeys.BUILD_CAPABILITIES,
    buildCapabilitiesFetch
  );

  const buildCaps = buildCapsQuery.data;

  useEffect(() => {
    if (buildCapsQuery.isError) {
      handleApiError(
        buildCapsQuery.error,
        setSnackbarErrorMsg,
        "Couldn't get existing build capabilities"
      );
    }
  }, [buildCapsQuery.error, buildCapsQuery.isError, setSnackbarErrorMsg]);

  const validateOnRun = () => {
    const errors = {};
    const buildVersionsExist = build.versionIds && build.versionIds.length;
    if (!buildConfig[BuildConfigFields.BCAP]) {
      errors[ValidatedFields.BCAPS] = 'Build Capability is required';
    }
    if (!buildVersionsExist && !buildConfig[BuildConfigFields.SV].size) {
      errors[ValidatedFields.TESTS] = 'Some test(s) must be selected';
    }
    if (!buildVersionsExist && buildConfig[BuildConfigFields.SV].size) {
      // validate all versions parse status, I've chosen not to disabled item
      // selector in TestSelect as I may have to disabled whole files when error
      // is in just a version even if that's not latest.
      // if some version has no parse status, we don't parse that here but later
      // after submission, build run does that and parses all of them and declines
      // if some have error.
      const versionIds = Array.from(buildConfig[BuildConfigFields.SV]);
      if (
        versionIds.some((v) => {
          const version = files.entities.versions[v];
          return version.lastParseRun && version.lastParseRun.error;
        })
      ) {
        errors[ValidatedFields.TESTS] =
          "Can't start build, there are parse errors in some of selected file(s) (marked as red).";
      }
    }
    return errors;
  };

  const resetErrorOnChange = (validatedField) => {
    if (error[validatedField]) {
      setError({...error, [validatedField]: null});
    }
  };

  const handleTestSelectionChange = (itemType, itemId, isSelected) => {
    dispatch({
      type: CONFIG_BUILD_UPDATE_SELECTED_VERSIONS,
      payload: {
        files,
        itemType,
        itemId,
        isSelected,
      },
    });
    resetErrorOnChange(ValidatedFields.TESTS);
  };

  const handleBuildVarSelect = (buildVar) => {
    dispatch({
      type: CONFIG_BUILD_ADD_BUILD_VAR,
      payload: {buildVar},
    });
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
    dispatch({
      type: CONFIG_BUILD_UPDATE_BY_PROP,
      payload: {prop: name, value},
    });
    if (name === BuildConfigFields.BCAP) {
      resetErrorOnChange(ValidatedFields.BCAPS);
    }
  };

  const handleRun = () => {
    const errors = validateOnRun();
    if (Object.keys(errors).length > 0) {
      setError({...error, ...errors});
      return;
    }
    dispatch({
      type: BUILD_START_RUN,
    });
    closeDialog();
  };

  const handleSkip = () => {
    dispatch({
      type: BUILD_CANCEL_RUN,
    });
    closeDialog();
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
      className={classes.labelPadding}
      fontSize="body2.fontSize"
      color="text.secondary">
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
    <>
      <Container className={classes.root}>
        <Box display="flex" flexDirection="column" height="90%" overflow="auto">
          <Box display="flex" pb={2} px={1} alignItems="center">
            <Typography variant="subtitle1">
              Configure build run properties you want to use in all future build
              runs
            </Typography>
            <TooltipCustom
              title={
                'Every build see this configuration to know what is needs to run.' +
                ' By default it is opened on every new build request but you can' +
                ' opt it out to let future builds use previously set values. When' +
                ' opted out, you may still open it to make changes or to opt-in.'
              }
              placement="right">
              <InfoIcon fontSize="small" className={classes.infoLabel} />
            </TooltipCustom>
          </Box>
          <Box display="flex" flexDirection="column" px={1}>
            <ElementRow>
              {getInfoLabel(BuildConfigKeys.BCAP, BuildConfigFields.BCAP)}
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
            {!(
              build.createNew &&
              build.versionIds &&
              build.versionIds.length
            ) && (
              <ElementRow>
                {getInfoLabel(BuildConfigKeys.SV, 'testSelect')}
                {getNotesLabel(
                  'Only file(s) that are loaded into explorer will be shown below.'
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
                    noTestMsg={
                      'No test found. Either add new test from explorer' +
                      " or load existing ones using the '+' icon on top right of explorer"
                    }
                  />
                </Box>
                <FormHelperText error>
                  {error[ValidatedFields.TESTS ?? '']}
                </FormHelperText>
              </ElementRow>
            )}
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
              <SelectBuildVars
                varBuild={buildVars}
                selectedBuildVarIdPerKey={buildConfig[BuildConfigFields.SBVIPK]}
                onSelect={handleBuildVarSelect}
              />
            </ElementRow>
            <ElementRow>
              {getLabel("Runner's Preferences", 'runnerPreferences-header')}
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="runnerPreferences-content"
                  id="runnerPreferences-header">
                  <Typography className={classes.text}>
                    Advanced Outomated Runner Preferences
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.accordionDetail}>
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
          </Box>
        </Box>
        <Box
          display="flex"
          alignItems="center"
          boxShadow={2}
          height={60}
          className={classes.bottomBar}>
          <Box flex={1} pl={2}>
            {getSwitch(
              BuildConfigFields.OLO,
              buildConfig[BuildConfigFields.OLO],
              BuildConfigLabels.OLO,
              BuildConfigInfo.OLO,
              'end'
            )}
          </Box>
          {build.createNew ? (
            <Box display="flex" pr={2}>
              <Button
                variant="contained"
                color="secondary"
                className={clsx(classes.button, classes.buttonSave)}
                onClick={handleRun}>
                Run Build
              </Button>
              <Button
                variant="contained"
                className={classes.button}
                onClick={handleSkip}>
                Skip
              </Button>
            </Box>
          ) : null}
        </Box>
      </Container>
      {snackbarTypeError}
    </>
  );
};

BuildConfig.propTypes = {
  closeDialog: PropTypes.func.isRequired,
  dispatchContext: PropTypes.shape(getContextObjShape()).isRequired,
  filesContext: PropTypes.shape(getContextObjShape()).isRequired,
  buildContext: PropTypes.shape(getContextObjShape()).isRequired,
  buildConfigContext: PropTypes.shape(getContextObjShape()).isRequired,
  varsContext: PropTypes.shape(getContextObjShape()).isRequired,
};

export default BuildConfig;
