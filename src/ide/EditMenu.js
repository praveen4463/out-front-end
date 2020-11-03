import React, {useState, useEffect, useContext, useCallback} from 'react';
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
import {useHotkeys} from 'react-hotkeys-hook';
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
import {BUILD_CANCEL_RUN} from '../actions/actionTypes';

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
  const dispatch = useContext(IdeDispatchContext);
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

  const handleClickBuildCaps = useCallback(() => {
    setState(
      new EditMenuState(
        null,
        true,
        'Build Capabilities',
        DEFAULT_WIDTH_DIALOG,
        MenuItems.BUILD_CAPS
      )
    );
  }, []);

  const handleClickBuildConfig = useCallback(() => {
    setState(
      new EditMenuState(
        null,
        true,
        'Build Configuration',
        DEFAULT_WIDTH_DIALOG,
        MenuItems.BUILD_CONFIG
      )
    );
  }, []);

  const handleClickDryConfig = useCallback(() => {
    setState(
      new EditMenuState(
        null,
        true,
        'Dry Run Configuration',
        DEFAULT_WIDTH_DIALOG,
        MenuItems.DRY_CONFIG
      )
    );
  }, []);

  const handleClickGlobalVarEdit = useCallback(() => {
    setState(
      new EditMenuState(
        null,
        true,
        'Global Variables',
        DEFAULT_WIDTH_DIALOG,
        MenuItems.GLOBAL_VAR
      )
    );
  }, []);

  const handleClickBuildVarEdit = useCallback(() => {
    setState(
      new EditMenuState(
        null,
        true,
        'Build Variables',
        DEFAULT_WIDTH_DIALOG,
        MenuItems.BUILD_VAR
      )
    );
  }, []);

  useHotkeys('shift+a', handleClickBuildCaps, {}, [handleClickBuildCaps]);
  useHotkeys('shift+c', handleClickBuildConfig, {}, [handleClickBuildConfig]);
  useHotkeys('shift+d', handleClickDryConfig, {}, [handleClickDryConfig]);
  useHotkeys('shift+g', handleClickGlobalVarEdit, {}, [
    handleClickGlobalVarEdit,
  ]);
  useHotkeys('shift+b', handleClickBuildVarEdit, {}, [handleClickBuildVarEdit]);

  const closeDialog = () => {
    setState(new EditMenuState());
  };

  const closeDlgCancelRunBuildConfig = () => {
    dispatch({
      type: BUILD_CANCEL_RUN,
    });
    closeDialog();
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
        // Build config when in IDE context should show only files loaded into
        // tree in TestSelect component. We're giving it context which will give
        // all files, but since TestSelect will filter files having tests, it
        // won't display files not loaded into tree (as they don't have any tests)
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
  }, [openBuildConfig, state.menuItem, handleClickBuildConfig]);

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
        <MenuItem onClick={handleClickBuildCaps}>
          Build Capabilities ⇧A
        </MenuItem>
        <Divider variant="middle" component="li" />
        <MenuItem onClick={handleClickBuildConfig}>Build Config ⇧C</MenuItem>
        <MenuItem onClick={handleClickDryConfig}>Dry Run Config ⇧D</MenuItem>
        <Divider variant="middle" component="li" />
        <MenuItem onClick={handleClickGlobalVarEdit}>
          Global Variables ⇧G
        </MenuItem>
        <MenuItem onClick={handleClickBuildVarEdit}>
          Build Variables ⇧B
        </MenuItem>
      </Menu>
      <Dialog
        TransitionComponent={Transition}
        onClose={
          state.menuItem === MenuItems.BUILD_CONFIG
            ? closeDlgCancelRunBuildConfig
            : closeDialog
        }
        fullWidth
        maxWidth={state.dlgMaxWidth}
        open={state.dlgOpen}
        classes={{paper: classes.root}}>
        <DialogTitle
          onClose={
            state.menuItem === MenuItems.BUILD_CONFIG
              ? closeDlgCancelRunBuildConfig
              : closeDialog
          }
          disableTypography
          className={classes.dlgTitle}>
          <Typography variant="h6">{state.dlgTitle}</Typography>
          <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={
              state.menuItem === MenuItems.BUILD_CONFIG
                ? closeDlgCancelRunBuildConfig
                : closeDialog
            }>
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
