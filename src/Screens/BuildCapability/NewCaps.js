import React, {useState, useCallback} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Container from '@material-ui/core/Container';
import InfoIcon from '@material-ui/icons/Info';
import LinearProgress from '@material-ui/core/LinearProgress';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import {random} from 'lodash-es';
import PropTypes from 'prop-types';
import useSnackbarTypeError from '../../hooks/useSnackbarTypeError';
import TooltipCustom from '../../TooltipCustom';
import BrowserSelect from '../../components/BrowserSelect';
import OsSelect from '../../components/OsSelect';
import {
  ApiStatuses,
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
} from '../../Constants';
import Browser, {BuildCapabilities} from '../../model';
import {getPlatformByOs} from '../../common';
import normalizeString from '../../utils/index';

const useStyles = makeStyles((theme) => ({
  capTitle: {
    color: theme.palette.background.contrastText,
  },
  button: {
    textTransform: 'unset',
    fontWeight: 400,
  },
  capsDetail: {
    flexDirection: 'column',
  },
  formControl: {
    width: '25%',
  },
  filled: {
    backgroundColor: theme.palette.background.paper,
    padding: '15px 12px 14px',
    '&:focus': {
      backgroundColor: theme.palette.background.paper,
    },
  },
  input: {
    backgroundColor: theme.palette.background.paper,
    fontSize: '0.875rem',
    color: theme.palette.background.contrastText,
  },
  list: {
    minHeight: theme.spacing(8),
  },
  label: {
    paddingBottom: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  iconFilled: {
    right: '14px',
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
  ({initialCaps, onSave, onCancel, optIECleanSessionOnSave}) => {
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
      setExpanded(!isExpanded);
    };

    const validateOnSubmit = () => {
      const errors = {};
      const nameLen = caps[BuildCapsFields.NAME].trim().length;
      if (nameLen === 0) {
        errors[ValidatedFields.NAME] = `${BuildCapsLabels.NAME} is required`;
      } else if (nameLen > MaxLengths.BuildCapsName) {
        errors[
          ValidatedFields.NAME
        ] = `${BuildCapsLabels.NAME} can't be more than ${MaxLengths.BUILD_CAPS_NAME} characters`;
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

    const handleChange = (e) => {
      const el = e.target;
      const {name, type} = el;
      let value;
      switch (type) {
        case 'checkbox':
          value = el.checked;
          break;
        case 'number':
          value = Number(el.value);
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

    const normalizeTimeouts = (value, defaultValue) => {
      let timeout = value;
      if (typeof timeout !== 'number') {
        timeout = Number(timeout);
      }
      if (Number.isNaN(timeout) || timeout < 0) {
        return defaultValue;
      }
      if (!Number.isFinite(timeout) || timeout > Number.MAX_SAFE_INTEGER) {
        return MaxLengths.BuildCapsTimeout;
      }
      return timeout;
    };

    const handleSave = () => {
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
      // continue to be used. There is not nested object inside caps.
      clone[BuildCapsFields.NAME] = normalizeString(
        clone[BuildCapsFields.NAME]
      );
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

      const onSuccess = (response) => {
        if (response.data && response.data.id) {
          clone[BuildCapsFields.ID] = response.data.id;
        }
        onSave(clone);
      };

      const onError = (response) => {
        setSaving(false);
        setSnackbarErrorMsg(`Couldn't save, ${response.error.reason}`);
      };

      // send entire cloned BuildCaps object to api for saving, wait for response
      setTimeout(() => {
        const response = {
          status: ApiStatuses.SUCCESS,
        };
        // if it was an edit, there won't be any data returned from api
        if (!caps[BuildCapsFields.ID]) {
          response.data = {
            id: random(1000, 10000),
          };
        }
        if (response.status === ApiStatuses.SUCCESS) {
          onSuccess(response);
        } else if (response.status === ApiStatuses.FAILURE) {
          onError(response);
        }
      }, 1000);
    };

    const handleCancel = () => {
      onCancel();
    };

    const getLabel = (label) => {
      return (
        <Typography variant="body2" className={classes.label}>
          {label}
        </Typography>
      );
    };

    const getInfoLabel = (capsKey) => {
      return (
        <Box display="flex">
          {getLabel(BuildCapsLabels[capsKey])}
          {BuildCapsInfo[capsKey] && (
            <TooltipCustom title={BuildCapsInfo[capsKey]} placement="right">
              <InfoIcon fontSize="small" />
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
            id={`${field}-select`}
            name={field}
            value={caps[field] || ''}
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
              <MenuItem value={k} key={k}>
                {optionsObj[k]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    };

    const getCheckbox = (field) => {
      return (
        <Checkbox
          style={{padding: '0px'}}
          onChange={handleChange}
          checked={caps[field]}
          name={field}
          disabled={saving}
        />
      );
    };

    const getNumericBox = (field, label) => {
      return (
        <TextField
          type="number"
          label={label}
          fullWidth
          value={caps[field]}
          name={field}
          onChange={handleChange}
          margin="normal"
          disabled={saving}
          inputProps={{tabIndex: '0'}}
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

    return (
      <>
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
                ? `Edit Capability ${caps[BuildCapsFields.NAME]}`
                : 'Add New Capability'}
            </Typography>
            <Box flex={1} display="flex" justifyContent="flex-end">
              <Button
                variant="filled"
                color="secondary"
                className={classes.button}
                disabled={saving}
                onClick={handleSave}>
                Save
              </Button>
              <Button
                variant="filled"
                color="secondary"
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
            <Container>
              <Box display="flex" flexDirection="column">
                <ElementRow>
                  {getLabel(BuildCapsLabels.NAME)}
                  <TextField
                    label="Name"
                    fullWidth
                    value={caps[BuildCapsFields.NAME]}
                    name={BuildCapsFields.NAME}
                    onChange={handleChange}
                    error={Boolean(error[ValidatedFields.NAME])}
                    helperText={error[ValidatedFields.NAME] ?? ''}
                    margin="normal"
                    disabled={saving}
                    inputProps={{tabIndex: '0'}}
                  />
                </ElementRow>
                <ElementRow>
                  {getLabel(BuildCapsLabels.OS)}
                  <OsSelect
                    onChange={handleOsChange}
                    selectedOs={caps[BuildCapsFields.OS]}
                    error={error[ValidatedFields.OS]}
                  />
                </ElementRow>
                <ElementRow>
                  {getLabel(BuildCapsLabels.BRW)}
                  <BrowserSelect
                    platform={caps[BuildCapsFields.PN]}
                    onChange={handleBrowserChange}
                    selectedBrowser={getBrowser()}
                    error={error[ValidatedFields.BRW]}
                  />
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.AIC)}
                  {getCheckbox(BuildCapsFields.AIC)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.CVL)}
                  {getCheckbox(BuildCapsFields.CVL)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.CSL)}
                  {getCheckbox(BuildCapsFields.CSL)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.CENL)}
                  {getCheckbox(BuildCapsFields.CENL)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.CEPL)}
                  {getCheckbox(BuildCapsFields.CEPL)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.FLL)}
                  {getSelectNoLabel(BuildCapsFields.FLL, FirefoxLogLevel)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.IELL)}
                  {getSelectNoLabel(BuildCapsFields.IELL, IELogLevel)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.SM)}
                  {getCheckbox(BuildCapsFields.SM)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.ST)}
                  {getNumericBox(BuildCapsFields.ST, BuildCapsLabels.ST)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.PLT)}
                  {getNumericBox(BuildCapsFields.PLT, BuildCapsLabels.PLT)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.EAT)}
                  {getNumericBox(BuildCapsFields.EAT, BuildCapsLabels.EAT)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.SFI)}
                  {getCheckbox(BuildCapsFields.SFI)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.UPB)}
                  {getSelectNoLabel(BuildCapsFields.UPB, PromptBehavior)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.IEESB)}
                  {getSelectNoLabel(BuildCapsFields.IEESB, IEScrollBehavior)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.IEEPH)}
                  {getCheckbox(BuildCapsFields.IEEPH)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.IERWF)}
                  {getCheckbox(BuildCapsFields.IERWF)}
                </ElementRow>
                <ElementRow>
                  {getInfoLabel(BuildCapsKeys.IEDNE)}
                  {getCheckbox(BuildCapsFields.IEDNE)}
                </ElementRow>
              </Box>
            </Container>
          </AccordionDetails>
        </Accordion>
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
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  optIECleanSessionOnSave: PropTypes.bool,
};

NewCaps.defaultProps = {
  initialCaps: null,
  optIECleanSessionOnSave: false,
};

export default NewCaps;
