import React, {useContext} from 'react';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import {makeStyles} from '@material-ui/core/styles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import InfoIcon from '@material-ui/icons/Info';
import clsx from 'clsx';
import TooltipCustom from '../../../TooltipCustom';
import {
  IdeDispatchContext,
  IdeDryRunConfigContext,
  IdeVarsContext,
} from '../../Contexts';
import {
  CONFIG_DRY_ADD_BUILD_VAR,
  CONFIG_DRY_UPDATE_BROWSER,
  CONFIG_DRY_UPDATE_PLATFORM,
} from '../../actionTypes';
import SelectBuildVars from '../../../components/SelectBuildVars';
import BrowserSelect from '../../../components/BrowserSelect';
import {
  Platforms,
  BuildConfigLabels,
  BuildConfigInfo,
} from '../../../Constants';

const useStyles = makeStyles((theme) => ({
  formControl: {
    width: '25%',
  },
  filled: {
    backgroundColor: theme.palette.background.paper,
    padding: '15px 12px 14px',
    '&:focus': {
      backgroundColor: theme.palette.background.paper,
    },
    boxShadow: theme.shadows[1],
  },
  input: {
    backgroundColor: theme.palette.background.paper,
    fontSize: '0.875rem',
    color: theme.palette.background.contrastText,
  },
  list: {
    minHeight: theme.spacing(8),
  },
  iconFilled: {
    right: '14px',
  },
  label: {
    color: theme.palette.text.secondary,
  },
  labelPadding: {
    paddingBottom: theme.spacing(1),
  },
  infoLabel: {
    marginLeft: '4px',
    fontSize: '1rem',
    color: theme.palette.background.contrastText,
    cursor: 'pointer',
  },
}));

const DryConfig = () => {
  const dispatch = useContext(IdeDispatchContext);
  const dryConfig = useContext(IdeDryRunConfigContext);
  const {build} = useContext(IdeVarsContext);
  const classes = useStyles();

  const handleBrowserChange = (browser) => {
    dispatch({
      type: CONFIG_DRY_UPDATE_BROWSER,
      payload: {browser},
    });
  };

  const handlePlatformChange = (e) => {
    dispatch({
      type: CONFIG_DRY_UPDATE_PLATFORM,
      payload: {platform: e.target.value},
    });
  };

  const handleBuildVarSelect = (buildVar) => {
    dispatch({
      type: CONFIG_DRY_ADD_BUILD_VAR,
      payload: {buildVar},
    });
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

  const getInfoLabel = (label, info, forId) => {
    return (
      <Box display="flex" alignItems="center" className={classes.labelPadding}>
        {getLabel(label, forId, true)}
        <TooltipCustom title={info} placement="right">
          <InfoIcon fontSize="small" className={classes.infoLabel} />
        </TooltipCustom>
      </Box>
    );
  };

  return (
    <Container>
      <Box display="flex" flexDirection="column">
        <Box display="flex" pb={2} alignItems="center">
          <Typography variant="subtitle1">
            Configure dry run properties you want to use in all future dry runs
          </Typography>
          <TooltipCustom
            title={
              "Dry runs don't run in a browser and lack the ability to resolve" +
              ' variables like browser and platform. To let dry runs work when code' +
              ' uses such variables, we assign them a default value that' +
              ' can be customized per the program flow. Additionally build variables' +
              ' can also be customized.'
            }
            placement="right">
            <InfoIcon fontSize="small" className={classes.infoLabel} />
          </TooltipCustom>
        </Box>
        <Box display="flex" flexDirection="column" pb={2}>
          {getLabel('Platform', 'platform')}
          <FormControl variant="filled" className={classes.formControl}>
            <InputLabel id="platformLabel">
              {dryConfig.platform ? '' : 'Select a platform'}
            </InputLabel>
            <Select
              labelId="platformLabel"
              id="platform"
              value={dryConfig.platform ?? ''}
              onChange={handlePlatformChange}
              classes={{
                root: classes.input,
                filled: classes.filled,
                iconFilled: classes.iconFilled,
              }}
              MenuProps={{classes: {list: classes.list}}}
              IconComponent={ExpandMoreIcon}
              disableUnderline>
              {Object.keys(Platforms).map((p) => (
                <MenuItem value={Platforms[p].VALUE} key={Platforms[p].VALUE}>
                  {Platforms[p].DISPLAY_NAME}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box display="flex" flexDirection="column" pb={2}>
          {getLabel('Browser', 'browserSelect-header')}
          <BrowserSelect
            platform={dryConfig.platform}
            onChange={handleBrowserChange}
            selectedBrowser={dryConfig.browser}
          />
        </Box>
        <Box display="flex" flexDirection="column" pb={2}>
          {getInfoLabel(
            BuildConfigLabels.SBVIPK,
            BuildConfigInfo.SBVIPK,
            'selectBuildVars-header'
          )}
          <SelectBuildVars
            varBuild={build}
            selectedBuildVarIdPerKey={dryConfig.selectedBuildVarIdPerKey}
            onSelect={handleBuildVarSelect}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default DryConfig;
