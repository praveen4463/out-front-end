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
import {Platforms} from '../../../Constants';

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

  return (
    <Container>
      <Box display="flex" flexDirection="column">
        <Box pb={2}>
          <Typography variant="subtitle1">
            Configure dry run properties you want to use in all future dry runs
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" pb={2}>
          <Typography variant="body2" className={classes.label}>
            Platform
          </Typography>
          <FormControl variant="filled" className={classes.formControl}>
            <InputLabel id="platformSelectLabel">
              {dryConfig.platform ? '' : 'Select a platform'}
            </InputLabel>
            <Select
              labelId="platformSelectLabel"
              id="platformSelect"
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
          <Typography variant="body2" className={classes.label}>
            Browser
          </Typography>
          <BrowserSelect
            platform={dryConfig.platform}
            onChange={handleBrowserChange}
            selectedBrowser={dryConfig.browser}
          />
        </Box>
        <Box display="flex" flexDirection="column" pb={2}>
          <Typography variant="body2" className={classes.label}>
            Build Variables
          </Typography>
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
