import React, {useState, useCallback} from 'react';
import IconButton from '@material-ui/core/IconButton';
import HelpOutlineOutlinedIcon from '@material-ui/icons/HelpOutlineOutlined';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {makeStyles} from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';
import Slide from '@material-ui/core/Slide';
import Tooltip from './TooltipCustom';
import Issue from './components/Issue';
import KeyShortcuts from './KeyShortcuts';
import Application from './config/application';

const useStyles = makeStyles((theme) => ({
  helpIcon: {
    color: theme.palette.background.contrastText,
    opacity: theme.textOpacity.highEmphasis,
  },
  root: {
    height: '90%',
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
    color: theme.palette.background.contrastText,
    opacity: theme.textOpacity.highEmphasis,
  },
}));

const DEFAULT_WIDTH_DIALOG = 'lg';

const MenuItems = {
  ISSUE: 'ISSUE',
  KEY_SCUTS: 'KEY_SCUTS',
};

function HelpMenuState(
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

const HelpMenu = () => {
  const [state, setState] = useState(new HelpMenuState());
  const classes = useStyles();

  const openMenu = (event) => {
    setState(
      (s) =>
        new HelpMenuState(
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
        new HelpMenuState(
          null,
          s.dlgOpen,
          s.dlgTitle,
          s.dlgMaxWidth,
          s.menuItem
        )
    );
  };

  const handleClickIssue = useCallback(() => {
    setState(
      new HelpMenuState(
        null,
        true,
        'Feature request or feedback',
        DEFAULT_WIDTH_DIALOG,
        MenuItems.ISSUE
      )
    );
  }, []);

  const handleClickKeyShortcuts = useCallback(() => {
    setState(
      new HelpMenuState(
        null,
        true,
        'Keyboard shortcuts',
        'sm',
        MenuItems.KEY_SCUTS
      )
    );
  }, []);

  const closeDialog = () => {
    setState(new HelpMenuState());
  };

  const getItemComponent = () => {
    switch (state.menuItem) {
      case MenuItems.ISSUE:
        return <Issue />;
      case MenuItems.KEY_SCUTS:
        return <KeyShortcuts />;
      default:
        return null;
    }
  };
  return (
    <>
      <Tooltip title="Help & Resources">
        <IconButton
          classes={{root: classes.helpIcon}}
          aria-controls="helpMenu"
          aria-haspopup="true"
          aria-label="help menu"
          onClick={openMenu}>
          <HelpOutlineOutlinedIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="helpMenu"
        anchorEl={state.anchorEl}
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
        <MenuItem
          component="a"
          href={Application.COMMUNITY_ZYLITICS_URL}
          rel="noopener"
          target="_blank"
          aria-label="Documentation">
          Ask questions, report and discuss issues with community
        </MenuItem>
        <MenuItem onClick={handleClickIssue}>
          Feature request or feedback
        </MenuItem>
        <MenuItem onClick={handleClickKeyShortcuts}>
          Keyboard shortcuts
        </MenuItem>
        <MenuItem
          component="a"
          href={Application.DOCS_ZYLITICS_URL}
          rel="noopener"
          target="_blank"
          aria-label="Documentation">
          Documentation
        </MenuItem>
        <MenuItem
          component="a"
          href={`mailto:${Application.SUPPORT_EMAIL}`}
          aria-label="Email Us">
          {`Email Us (${Application.SUPPORT_EMAIL})`}
        </MenuItem>
        <MenuItem
          component="a"
          href={Application.ABOUT_ZYLITICS_URL}
          rel="noopener"
          target="_blank"
          aria-label="About">
          About
        </MenuItem>
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

export default HelpMenu;
