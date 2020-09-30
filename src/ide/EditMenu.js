import React, {useState, useEffect} from 'react';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import PropTypes from 'prop-types';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Slide from '@material-ui/core/Slide';
import Tooltip from '../TooltipCustom';
import BuildConfig from '../Screens/BuildConfig';
import DryConfig from './Screens/DryConfig';
import GlobalVars from './Screens/GlobalVars';
import BuildVars from './Screens/BuildVars';
import BuildCapability from '../Screens/BuildCapability';
import {
  IdeDispatchContext,
  IdeBuildContext,
  IdeBuildConfigContext,
  IdeFilesContext,
  IdeVarsContext,
} from './Contexts';

const DEFAULT_WIDTH_DIALOG = 'lg';

const MenuItems = {
  BUILD_CAPS: 'BUILD_CAPS',
  BUILD_CONFIG: 'BUILD_CONFIG',
  DRY_CONFIG: 'DRY_CONFIG',
  GLOBAL_VAR: 'GLOBAL_VAR',
  BUILD_VAR: 'BUILD_VAR',
};

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.paperOnDefault,
    height: '90%',
    color: theme.palette.background.contrastText,
  },
  dlgTitle: {
    margin: 0,
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.border.light}`,
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
}));

function EditMenuState(
  anchorEl = null,
  dlgOpen = false,
  dlgTitle = '',
  dlgMaxWidth = DEFAULT_WIDTH_DIALOG,
  menuItem = null
) {
  this.anchorEl = anchorEl;
  this.dlgOpen = dlgOpen;
  this.dlgTitle = dlgTitle;
  this.dlgMaxWidth = dlgMaxWidth;
  this.menuItem = menuItem;
}

const Transition = React.forwardRef(function Transition(props, ref) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Slide direction="down" ref={ref} {...props} />;
});

const EditMenu = ({editIconClasses, openBuildConfig}) => {
  const [state, setState] = useState(new EditMenuState());
  const classes = useStyles();

  const openMenu = (event) => {
    setState(
      (s) =>
        new EditMenuState(
          event.currentTarget,
          s.dlgOpen,
          s.dlgTitle,
          s.dlgMaxWidth,
          s.menuItem
        )
    );
  };

  const closeMenu = () => {
    setState(
      (s) =>
        new EditMenuState(
          null,
          s.dlgOpen,
          s.dlgTitle,
          s.dlgMaxWidth,
          s.menuItem
        )
    );
  };

  const handleClickBuildCaps = () => {
    setState(
      new EditMenuState(
        null,
        true,
        'Build Capabilities',
        DEFAULT_WIDTH_DIALOG,
        MenuItems.BUILD_CAPS
      )
    );
  };

  const handleClickBuildConfig = () => {
    setState(
      new EditMenuState(
        null,
        true,
        'Build Configuration',
        DEFAULT_WIDTH_DIALOG,
        MenuItems.BUILD_CONFIG
      )
    );
  };

  const handleClickDryConfig = () => {
    setState(
      new EditMenuState(
        null,
        true,
        'Dry Run Configuration',
        DEFAULT_WIDTH_DIALOG,
        MenuItems.DRY_CONFIG
      )
    );
  };

  const handleClickGlobalVarEdit = () => {
    setState(
      new EditMenuState(
        null,
        true,
        'Global Variables',
        DEFAULT_WIDTH_DIALOG,
        MenuItems.GLOBAL_VAR
      )
    );
  };

  const handleClickBuildVarEdit = () => {
    setState(
      new EditMenuState(
        null,
        true,
        'Build Variables',
        DEFAULT_WIDTH_DIALOG,
        MenuItems.BUILD_VAR
      )
    );
  };

  const closeDialog = () => {
    setState(new EditMenuState());
  };

  const getItemComponent = () => {
    switch (state.menuItem) {
      case MenuItems.BUILD_CAPS:
        return (
          <BuildCapability
            optIECleanSessionOnSave
            dispatchContext={IdeDispatchContext}
          />
        );
      case MenuItems.BUILD_CONFIG:
        return (
          <BuildConfig
            closeDialog={closeDialog}
            dispatchContext={IdeDispatchContext}
            filesContext={IdeFilesContext}
            buildContext={IdeBuildContext}
            buildConfigContext={IdeBuildConfigContext}
            varsContext={IdeVarsContext}
          />
        );
      case MenuItems.DRY_CONFIG:
        return <DryConfig />;
      case MenuItems.GLOBAL_VAR:
        return <GlobalVars />;
      case MenuItems.BUILD_VAR:
        return <BuildVars />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (openBuildConfig) {
      handleClickBuildConfig();
    }
  }, [openBuildConfig, state.menuItem]);

  return (
    <>
      <Tooltip title="Edit Capabilities, Configs & Variables E">
        <IconButton
          aria-controls="editMenu"
          aria-haspopup="true"
          aria-label="edit menu"
          onClick={openMenu}>
          <EditIcon
            color="primary"
            fontSize="small"
            classes={editIconClasses}
          />
        </IconButton>
      </Tooltip>
      <Menu
        id="editMenu"
        anchorEl={state.anchorEl}
        keepMounted
        open={Boolean(state.anchorEl)}
        onClose={closeMenu}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}>
        <MenuItem onClick={handleClickBuildCaps}>Build Capabilities</MenuItem>
        <Divider variant="middle" component="li" />
        <MenuItem onClick={handleClickBuildConfig}>Build Config</MenuItem>
        <MenuItem onClick={handleClickDryConfig}>Dry Run Config</MenuItem>
        <Divider variant="middle" component="li" />
        <MenuItem onClick={handleClickGlobalVarEdit}>Global Variables</MenuItem>
        <MenuItem onClick={handleClickBuildVarEdit}>Build Variables</MenuItem>
      </Menu>
      <Dialog
        TransitionComponent={Transition}
        onClose={closeDialog}
        fullWidth
        maxWidth={state.dlgMaxWidth}
        open={state.dlgOpen}
        classes={{paper: classes.root}}>
        <DialogTitle
          onClose={closeDialog}
          disableTypography
          className={classes.dlgTitle}>
          <Typography variant="h6">{state.dlgTitle}</Typography>
          <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={closeDialog}>
            <CloseIcon titleAccess="Close" />
          </IconButton>
        </DialogTitle>
        <DialogContent>{getItemComponent()}</DialogContent>
      </Dialog>
    </>
  );
};

EditMenu.propTypes = {
  editIconClasses: PropTypes.shape({
    fontSizeSmall: PropTypes.string,
  }).isRequired,
  openBuildConfig: PropTypes.bool.isRequired,
};

export default EditMenu;
