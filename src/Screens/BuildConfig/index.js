import React, {useContext, useState, useEffect, useMemo} from 'react';
import Container from '@material-ui/core/Container';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import InputLabel from '@material-ui/core/InputLabel';
import InfoIcon from '@material-ui/icons/Info';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {makeStyles} from '@material-ui/core/styles';
import FormHelperText from '@material-ui/core/FormHelperText';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import TooltipCustom from '../../TooltipCustom';
import TestSelect from '../../components/TestSelect';
import {
  CONFIG_BUILD_UPDATE_SELECTED_VERSIONS,
  CONFIG_BUILD_ADD_BUILD_VAR,
  CONFIG_BUILD_UPDATE_BY_PROP,
  BUILD_START_RUN,
  BUILD_CANCEL_RUN,
} from '../../actions/actionTypes';
import {getContextObjShape} from '../../common';
import useSnackbarTypeError from '../../hooks/useSnackbarTypeError';
import {
  ApiStatuses,
  BuildConfigLabels,
  BuildConfigFields,
  BuildConfigInfo,
  BuildConfigKeys,
} from '../../Constants';
import resolutions from '../../config/desktopResolution.json';
import timezones from '../../config/timezones.json';
import SelectBuildVars from '../../components/SelectBuildVars';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    color: theme.palette.background.contrastText,
    height: '100%',
  },
  formControl: {
    width: '50%',
  },
  testSelect: {
    maxHeight: 500,
    minHeight: 20,
    padding: 12,
    boxShadow: theme.shadows[1],
    backgroundColor: theme.palette.background.paper,
    overflow: 'auto',
  },
  filledNoPad: {
    backgroundColor: theme.palette.background.paperContrast,
    '&:focus': {
      backgroundColor: theme.palette.background.paperContrast,
    },
    boxShadow: theme.shadows[1],
  },
  filled: {
    backgroundColor: theme.palette.background.paperContrast,
    padding: '15px 12px 14px',
    '&:focus': {
      backgroundColor: theme.palette.background.paperContrast,
    },
    boxShadow: theme.shadows[1],
  },
  input: {
    backgroundColor: theme.palette.background.paperContrast,
    fontSize: '0.875rem',
    color: theme.palette.background.contrastText,
  },
  iconFilled: {
    right: '14px',
  },
  list: {
    minHeight: theme.spacing(8),
  },
  infoLabel: {
    marginLeft: '4px',
    fontSize: '1rem',
    color: theme.palette.background.contrastText,
    cursor: 'pointer',
  },
  label: {
    color: theme.palette.text.secondary,
  },
  labelPadding: {
    paddingBottom: theme.spacing(1),
  },
  switchLabel: {
    color: theme.palette.text.secondary,
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
  switchFormControlTop: {
    marginLeft: 0,
    alignItems: 'flex-start',
  },
  switchLabelTop: {
    marginLeft: `-${theme.spacing(1.1)}px`,
  },
  switch: {
    marginLeft: 0,
  },
  accordionDetail: {
    flexDirection: 'column',
  },
  text: {
    fontSize: '0.875rem',
    color: theme.palette.background.contrastText,
  },
  selectError: {
    marginLeft: 0,
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

const StyledSelect = ({
  id,
  selected,
  label,
  onChange,
  disabled,
  error,
  children,
}) => {
  const classes = useStyles();

  return (
    <FormControl
      variant="filled"
      className={classes.formControl}
      error={Boolean(error)}>
      {label ? (
        <InputLabel id={`label-${id}`} classes={{root: classes.input}}>
          {label}
        </InputLabel>
      ) : null}
      <Select
        labelId={label ? `label-${id}` : ''}
        id={id}
        name={id}
        value={selected ?? ''}
        onChange={onChange}
        classes={{
          root: classes.input,
          filled: label ? classes.filledNoPad : classes.filled,
          iconFilled: classes.iconFilled,
        }}
        className={clsx(Boolean(error) && classes.error)}
        MenuProps={{classes: {list: classes.list}}}
        IconComponent={ExpandMoreIcon}
        disabled={disabled}
        disableUnderline>
        {children}
      </Select>
      <FormHelperText className={classes.selectError}>{error}</FormHelperText>
    </FormControl>
  );
};

StyledSelect.propTypes = {
  id: PropTypes.string.isRequired,
  selected: PropTypes.string.isRequired,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  children: PropTypes.node,
};

StyledSelect.defaultProps = {
  label: null,
  error: null,
  disabled: false,
  children: null,
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
  const [buildCaps, setBuildCaps] = useState(null);
  const [error, setError] = useState(initialError);
  const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
  const classes = useStyles();

  // It should be fine to load build caps every time config is opened, it is
  // expected our data library caches query results.
  useEffect(() => {
    const onSuccess = (response) => {
      setBuildCaps(response.data);
    };
    const onError = (response) => {
      setSnackbarErrorMsg(
        `Couldn't get existing build capabilities, ${response.error.reason}`
      );
    };
    setTimeout(() => {
      // api returns sorted data by name
      const response = {
        status: ApiStatuses.SUCCESS,
        data: [
          {id: 1, name: 'chrome85_win10_debug'},
          {id: 2, name: 'firefox85_win8_1_debug'},
          {id: 3, name: 'IE11_win10'},
        ],
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
  }, [setSnackbarErrorMsg]);

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
      const versionIds = Array.from(buildConfig[BuildConfigFields.SV]);
      if (
        versionIds.some((v) => {
          const version = files.entities.versions[v];
          return version.lastParseRun && version.lastParseRun.error;
        })
      ) {
        errors[ValidatedFields.TESTS] =
          "Can't start build, there are parse errors in some of selected test(s)";
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

  const getSwitch = (
    name,
    isChecked,
    label,
    helpText,
    labelPlacement = 'top'
  ) => {
    return (
      <FormControlLabel
        classes={{labelPlacementTop: classes.switchFormControlTop}}
        control={
          <Switch
            checked={isChecked}
            onChange={handleChange}
            name={name}
            classes={{
              root:
                labelPlacement === 'top'
                  ? classes.switchLabelTop
                  : classes.switch,
            }}
          />
        }
        labelPlacement={labelPlacement}
        label={
          <Box display="flex" alignItems="center">
            <Typography
              variant="body2"
              component="span"
              className={classes.switchLabel}>
              {label}
            </Typography>
            <TooltipCustom title={helpText} placement="right">
              <InfoIcon fontSize="small" className={classes.infoLabel} />
            </TooltipCustom>
          </Box>
        }
      />
    );
  };

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
            {!(
              build.createNew &&
              build.versionIds &&
              build.versionIds.length
            ) && (
              <ElementRow>
                {getInfoLabel(BuildConfigKeys.SV, 'testSelect')}
                <Box
                  className={clsx(
                    classes.testSelect,
                    Boolean(error[ValidatedFields.TESTS]) && classes.error
                  )}>
                  <TestSelect
                    files={files}
                    onItemSelectionChange={handleTestSelectionChange}
                    selectedVersions={buildConfig[BuildConfigFields.SV]}
                    noTestMsg="No test found, add/load some test(s) from explorer."
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
                    Advanced Zylitics Runner Preferences
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
