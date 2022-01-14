import React, {useState, useCallback} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import InfoIcon from '@material-ui/icons/Info';
import LinearProgress from '@material-ui/core/LinearProgress';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import axios from 'axios';
import useSnackbarTypeError from '../../hooks/useSnackbarTypeError';
import TooltipCustom from '../../TooltipCustom';
import BrowserSelect from '../../components/BrowserSelect';
import OsSelect from '../../components/OsSelect';
import {
  Browsers,
  BuildCapsLabels,
  BuildCapsFields,
  MaxLengths,
  BuildCapsTimeouts,
  BuildCapsInfo,
  BuildCapsKeys,
  IELogLevel,
  FirefoxLogLevel,
  PromptBehavior,
  IEScrollBehavior,
  Endpoints,
} from '../../Constants';
import Browser, {BuildCapabilities} from '../../model';
import {getPlatformByOs, handleApiError} from '../../common';
import {equalIgnoreCase} from '../../utils';
import MobileDeviceSelect from '../../components/MobileDeviceSelect';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    color: theme.palette.background.contrastText,
  },
  capTitle: {
    color: theme.palette.background.contrastText,
  },
  button: {
    marginLeft: theme.spacing(1),
  },
  buttonSave: {
    padding: `0px ${theme.spacing(6)}px`,
  },
  capsDetail: {
    flexDirection: 'column',
  },
  formControl: {
    width: '25%',
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
  accordionElements: {
    backgroundColor: theme.palette.background.paperContrast,
  },
  list: {
    minHeight: theme.spacing(8),
  },
  label: {
    color: theme.palette.text.secondary,
  },
  labelPadding: {
    paddingBottom: theme.spacing(1),
  },
  iconFilled: {
    right: '14px',
  },
  infoLabel: {
    marginLeft: '4px',
    fontSize: '1rem',
    color: theme.palette.background.contrastText,
    cursor: 'pointer',
  },
  numberTextField: {
    width: '20%',
  },
  textField: {
    width: '60%',
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

const ValidatedFields = {
  NAME: 'NAME',
  OS: 'OS',
  BRW: 'BRW',
};

const initialError = {
  [ValidatedFields.NAME]: null,
  [ValidatedFields.OS]: null,
  [ValidatedFields.BRW]: null,
};

const NewCaps = React.memo(
  ({initialCaps, existingNames, onSave, onCancel, optIECleanSessionOnSave}) => {
    const [caps, setCaps] = useState(() =>
      initialCaps === null ? new BuildCapabilities() : initialCaps
    );
    const [error, setError] = useState(initialError);
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [setSnackbarErrorMsg, snackbarTypeError] = useSnackbarTypeError();
    const classes = useStyles();
    const summary = useSummaryStyles();

    const handleAccordionChange = (e, isExpanded) => {
      setExpanded(isExpanded);
    };

    const validateOnSubmit = () => {
      const errors = {};
      const name = caps[BuildCapsFields.NAME]
        ? caps[BuildCapsFields.NAME].trim()
        : '';
      const len = name.length;
      if (len === 0) {
        errors[ValidatedFields.NAME] = `${BuildCapsLabels.NAME} is required`;
      } else if (len > MaxLengths.BUILD_CAPS_NAME) {
        // although db can store unlimited length name for build caps but I'm keeping
        // this check to have readable names from user.
        errors[
          ValidatedFields.NAME
        ] = `${BuildCapsLabels.NAME} can't be more than ${MaxLengths.BUILD_CAPS_NAME} characters`;
      } else if (existingNames.some((n) => equalIgnoreCase(n, name))) {
        errors[
          ValidatedFields.NAME
        ] = `A capability of the same name already exists`;
      }
      if (!caps[BuildCapsFields.OS]) {
        errors[ValidatedFields.OS] = `${BuildCapsLabels.OS} is required`;
      }
      if (!caps[BuildCapsFields.BN]) {
        errors[ValidatedFields.BRW] = `${BuildCapsLabels.BRW} is required`;
      }
      return errors;
    };

    const resetErrorOnChange = (validatedField) => {
      if (error[validatedField]) {
        setError({...error, [validatedField]: null});
      }
    };

    const setToCaps = (field, value) => {
      setCaps((c) => ({...c, [field]: value}));
    };

    const handleOsChange = (os) => {
      setCaps((c) => ({
        ...c,
        [BuildCapsFields.OS]: os,
        [BuildCapsFields.PN]: getPlatformByOs(os),
      }));
      resetErrorOnChange(ValidatedFields.OS);
    };

    const handleBrowserChange = (browser) => {
      setCaps((c) => ({
        ...c,
        [BuildCapsFields.BN]: browser.name,
        [BuildCapsFields.BV]: browser.version,
      }));
      resetErrorOnChange(ValidatedFields.BRW);
    };

    const handleMEChange = (md) => {
      setCaps((c) => ({
        ...c,
        [BuildCapsFields.MD]: md,
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
      setToCaps(name, value);
      if (name === BuildCapsFields.NAME) {
        resetErrorOnChange(ValidatedFields.NAME);
      }
    };

    // timeouts in buildCaps are always numeric, but data from textfield even if
    // number type is string. If user changed def timeout, we get string data,
    // if we try converting that to Number onChange, empty values become 0, not
    // allowing user to fully empty the box before typing new, thus Number conversion
    // is not done from onChange and string value is kept in timeout field. If user
    // keep fields empty, just send default value, entering anything else than empty
    // that is not number is not possible. So every time user change fields, we get
    // a string value.
    const normalizeTimeouts = (value, defaultValue) => {
      let timeout = value;
      if (typeof timeout === 'string') {
        if (timeout.length === 0) {
          return defaultValue;
        }
        timeout = Number(timeout);
      }
      if (Number.isNaN(timeout) || timeout < 0) {
        return defaultValue;
      }
      if (!Number.isFinite(timeout) || timeout > Number.MAX_SAFE_INTEGER) {
        return MaxLengths.BUILD_CAPS_TIMEOUT;
      }
      return timeout;
    };

    const handleSave = (e) => {
      e.stopPropagation();
      if (!expanded) {
        setExpanded(true);
      }
      const errors = validateOnSubmit();
      if (Object.keys(errors).length > 0) {
        setError({...error, ...errors});
        return;
      }
      setSaving(true);
      // for now even if it's edit, send the whole build caps object.
      // TODO: later track for changes and send changed fields only.
      const clone = {...caps}; // don't mutate the state, if an error occurs it will
      // continue to be used. There is no nested object inside caps.
      clone[BuildCapsFields.NAME] = clone[BuildCapsFields.NAME].trim(); // no need to escape
      // backslashes, quotes etc, JSON.stringify will do that.
      clone[BuildCapsFields.ST] = normalizeTimeouts(
        clone[BuildCapsFields.ST],
        BuildCapsTimeouts.ST
      );
      clone[BuildCapsFields.PLT] = normalizeTimeouts(
        clone[BuildCapsFields.PLT],
        BuildCapsTimeouts.PLT
      );
      clone[BuildCapsFields.EAT] = normalizeTimeouts(
        clone[BuildCapsFields.EAT],
        BuildCapsTimeouts.EAT
      );
      if (!clone[BuildCapsFields.ID] && optIECleanSessionOnSave) {
        clone[BuildCapsFields.IEDESC] = true;
      }

      if (clone[BuildCapsFields.ID] && initialCaps) {
        // when updating, make sure when no data is changed, we don't post to api
        // make sure the comparison of all keys happen after normalizing timeouts,
        // trimming free input fields, so that even if user added some whitespaces,
        // we don't consider it a change. Also suppose user changes timeout field,
        // and revert. This change will cause 'caps' to have that timeout field as
        // 'string' type. When we compare below, string won't match to number and even
        // tho the value is same we will consider it a change that will fail at api
        // because api checks that update operation should actually update one row.
        // Thus compare only after converting number fields to number.
        let hasChanged = false;
        const keys = Object.keys(initialCaps);
        for (let i = 0; i < keys.length; i += 1) {
          const key = keys[i];
          if (initialCaps[key] !== clone[key]) {
            hasChanged = true;
            break;
          }
        }
        if (!hasChanged) {
          onCancel();
          return;
        }
      }

      async function saveBuildCapability() {
        try {
          const {data} = await axios.post(Endpoints.BUILD_CAPABILITIES, clone);
          // data is id
          clone[BuildCapsFields.ID] = data;
          onSave(clone);
        } catch (ex) {
          setSaving(false);
          handleApiError(ex, setSnackbarErrorMsg, "Couldn't save");
        }
      }

      saveBuildCapability();
    };

    const handleCancel = (e) => {
      e.stopPropagation();
      onCancel();
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

    const getInfoLabel = (capsKey, forId, noPadding = false) => {
      return (
        <Box
          display="flex"
          alignItems="center"
          className={clsx(!noPadding && classes.labelPadding)}>
          {getLabel(BuildCapsLabels[capsKey], forId, true)}
          {BuildCapsInfo[capsKey] && (
            <TooltipCustom title={BuildCapsInfo[capsKey]} placement="right">
              <InfoIcon fontSize="small" className={classes.infoLabel} />
            </TooltipCustom>
          )}
        </Box>
      );
    };

    // select with no default option like 'Select a ...'
    const getSelectNoLabel = (field, optionsObj) => {
      return (
        <FormControl variant="filled" className={classes.formControl}>
          <Select
            id={field}
            name={field}
            value={caps[field] ?? ''}
            disabled={saving}
            onChange={handleChange}
            classes={{
              root: classes.input,
              filled: classes.filled,
              iconFilled: classes.iconFilled,
            }}
            MenuProps={{classes: {list: classes.list}}}
            IconComponent={ExpandMoreIcon}
            disableUnderline>
            {Object.keys(optionsObj).map((k) => (
              <MenuItem value={optionsObj[k]} key={k}>
                {optionsObj[k]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    };

    const getCheckbox = (field) => {
      // using a container div so that checkbox don't stretch to fit available
      // flexbox width, not using checkbox with label because it's easy to have
      // both of them separate, also gives more control to put something after label.
      return (
        <div>
          <Checkbox
            style={{padding: '0px'}}
            onChange={handleChange}
            checked={caps[field]}
            name={field}
            id={field}
            disabled={saving}
          />
        </div>
      );
    };

    const getNumericBox = (field) => {
      return (
        <TextField
          type="number"
          size="small"
          value={caps[field] ?? ''}
          name={field}
          id={field}
          onChange={handleChange}
          margin="none"
          disabled={saving}
          inputProps={{tabIndex: '0'}}
          className={classes.numberTextField}
        />
      );
    };

    const getBrowser = useCallback(() => {
      const bName = caps[BuildCapsFields.BN];
      const bVersion = caps[BuildCapsFields.BV];
      if (bName && bVersion) {
        return new Browser(bName, bVersion);
      }
      return null;
    }, [caps]);

    const focusOnMount = useCallback((input) => {
      if (input !== null) {
        input.focus();
      }
    }, []);

    return (
      <>
        <div className={classes.root}>
          <Accordion expanded={expanded} onChange={handleAccordionChange}>
            <AccordionSummary
              aria-controls="edit-save-content"
              id="edit-save-header"
              classes={{
                root: summary.root,
                expanded: summary.expanded,
                content: summary.content,
              }}>
              <Typography className={classes.capTitle}>
                {caps[BuildCapsFields.ID]
                  ? `Edit Capability ${initialCaps[BuildCapsFields.NAME]}`
                  : 'Add New Capability'}
              </Typography>
              <Box flex={1} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="secondary"
                  className={clsx(classes.button, classes.buttonSave)}
                  disabled={saving}
                  onClick={handleSave}>
                  Save
                </Button>
                <Button
                  variant="contained"
                  className={classes.button}
                  disabled={saving}
                  onClick={handleCancel}>
                  Cancel
                </Button>
              </Box>
              {saving && (
                <Box position="absolute" bottom={0} left={0} width="100%">
                  <LinearProgress color="secondary" />
                </Box>
              )}
            </AccordionSummary>
            <AccordionDetails classes={{root: classes.capsDetail}}>
              <Box display="flex" flexDirection="column" overflow="auto">
                <ElementRow>
                  {/* text fields have their own padding, so no extra */}
                  {getLabel(BuildCapsLabels.NAME, BuildCapsFields.NAME, true)}
                  <TextField
                    value={caps[BuildCapsFields.NAME] ?? ''}
                    name={BuildCapsFields.NAME}
                    id={BuildCapsFields.NAME}
                    onChange={handleChange}
                    error={Boolean(error[ValidatedFields.NAME])}
                    helperText={error[ValidatedFields.NAME] ?? ''}
                    margin="none"
                    disabled={saving}
                    inputProps={{tabIndex: '0'}}
                    inputRef={focusOnMount}
                    className={classes.textField}
                  />
                </ElementRow>
                <ElementRow>
                  {getLabel(BuildCapsLabels.OS, 'osSelect-header')}
                  <OsSelect
                    onChange={handleOsChange}
                    selectedOs={caps[BuildCapsFields.OS]}
                    error={error[ValidatedFields.OS]}
                    disabled={saving}
                    accordionClasses={{root: classes.accordionElements}}
                  />
                </ElementRow>
                <ElementRow>
                  {getLabel(BuildCapsLabels.BRW, 'browserSelect-header')}
                  <BrowserSelect
                    platform={caps[BuildCapsFields.PN]}
                    onChange={handleBrowserChange}
                    selectedBrowser={getBrowser()}
                    error={error[ValidatedFields.BRW]}
                    disabled={saving}
                    accordionClasses={{root: classes.accordionElements}}
                  />
                </ElementRow>
                <ElementRow>
                  {getLabel(BuildCapsLabels.ME, 'md-header')}
                  <MobileDeviceSelect
                    onChange={handleMEChange}
                    selectedMobileDevice={
                      caps[BuildCapsFields.BN] === Browsers.CHROME.VALUE
                        ? caps[BuildCapsFields.MD]
                        : null
                    }
                    disabled={
                      saving ||
                      caps[BuildCapsFields.BN] !== Browsers.CHROME.VALUE
                    }
                    accordionClasses={{root: classes.accordionElements}}
                  />
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.AIC, BuildCapsFields.AIC)}
                  {getCheckbox(BuildCapsFields.AIC)}
                </ElementRow>
                {caps[BuildCapsFields.BN] === Browsers.CHROME.VALUE && (
                  <>
                    <ElementRow>
                      {getInfoLabel(BuildCapsKeys.CVL, BuildCapsFields.CVL)}
                      {getCheckbox(BuildCapsFields.CVL)}
                    </ElementRow>
                    <ElementRow>
                      {getInfoLabel(BuildCapsKeys.CSL, BuildCapsFields.CSL)}
                      {getCheckbox(BuildCapsFields.CSL)}
                    </ElementRow>
                    <ElementRow>
                      {getInfoLabel(BuildCapsKeys.CENL, BuildCapsFields.CENL)}
                      {getCheckbox(BuildCapsFields.CENL)}
                    </ElementRow>
                    <ElementRow>
                      {getInfoLabel(BuildCapsKeys.CEPL, BuildCapsFields.CEPL)}
                      {getCheckbox(BuildCapsFields.CEPL)}
                    </ElementRow>
                  </>
                )}
                {caps[BuildCapsFields.BN] === Browsers.FIREFOX.VALUE && (
                  <ElementRow>
                    {getInfoLabel(BuildCapsKeys.FLL, BuildCapsFields.FLL)}
                    {getSelectNoLabel(BuildCapsFields.FLL, FirefoxLogLevel)}
                  </ElementRow>
                )}
                {caps[BuildCapsFields.BN] === Browsers.IE.VALUE && (
                  <ElementRow>
                    {getInfoLabel(BuildCapsKeys.IELL, BuildCapsFields.IELL)}
                    {getSelectNoLabel(BuildCapsFields.IELL, IELogLevel)}
                  </ElementRow>
                )}
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.SM, BuildCapsFields.SM)}
                  {getCheckbox(BuildCapsFields.SM)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.ST, BuildCapsFields.ST, true)}
                  {getNumericBox(BuildCapsFields.ST)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.PLT, BuildCapsFields.PLT, true)}
                  {getNumericBox(BuildCapsFields.PLT)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.EAT, BuildCapsFields.EAT, true)}
                  {getNumericBox(BuildCapsFields.EAT)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.SFI, BuildCapsFields.SFI)}
                  {getCheckbox(BuildCapsFields.SFI)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.UPB, BuildCapsFields.UPB)}
                  {getSelectNoLabel(BuildCapsFields.UPB, PromptBehavior)}
                </ElementRow>
                {caps[BuildCapsFields.BN] === Browsers.IE.VALUE && (
                  <>
                    <ElementRow>
                      {getInfoLabel(BuildCapsKeys.IEESB, BuildCapsFields.IEESB)}
                      {getSelectNoLabel(
                        BuildCapsFields.IEESB,
                        IEScrollBehavior
                      )}
                    </ElementRow>
                    <ElementRow>
                      {getInfoLabel(BuildCapsKeys.IEEPH, BuildCapsFields.IEEPH)}
                      {getCheckbox(BuildCapsFields.IEEPH)}
                    </ElementRow>
                    <ElementRow>
                      {getInfoLabel(BuildCapsKeys.IERWF, BuildCapsFields.IERWF)}
                      {getCheckbox(BuildCapsFields.IERWF)}
                    </ElementRow>
                    <ElementRow>
                      {getInfoLabel(BuildCapsKeys.IEDNE, BuildCapsFields.IEDNE)}
                      {getCheckbox(BuildCapsFields.IEDNE)}
                    </ElementRow>
                  </>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        </div>
        {snackbarTypeError}
      </>
    );
  }
);

NewCaps.propTypes = {
  initialCaps: PropTypes.shape({
    id: PropTypes.number,
    os: PropTypes.string,
    browserName: PropTypes.string,
  }),
  existingNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  optIECleanSessionOnSave: PropTypes.bool,
};

NewCaps.defaultProps = {
  initialCaps: null,
  optIECleanSessionOnSave: false,
};

export default NewCaps;
