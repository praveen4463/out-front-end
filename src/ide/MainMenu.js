import React, {useState} from 'react';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import MenuIcon from '@material-ui/icons/Menu';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {makeStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import Slide from '@material-ui/core/Slide';
import {Link as RouterLink, useLocation} from 'react-router-dom';
import Tooltip from '../TooltipCustom';
import TestFileManager from '../Screens/TestFileManager';
import {getLocation} from '../common';
import {PageUrl} from '../Constants';

const useStyles = makeStyles((theme) => ({
  menuIcon: {
    opacity: theme.textOpacity.highEmphasis,
    height: '100%',
  },
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
  linkMenu: {
    padding: 0,
  },
  linkButton: {
    color: theme.palette.background.contrastText,
    textTransform: 'none',
    letterSpacing: 0,
    fontWeight: 400,
    width: '100%',
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(12),
    justifyContent: 'flex-start',
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Slide direction="down" ref={ref} {...props} />;
});

const MainMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [dlgOpen, setDlgOpen] = useState(false);
  const location = useLocation();
  const classes = useStyles();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const closeDlg = () => {
    setDlgOpen(false);
  };
  const handleUploadTestFile = () => {
    setDlgOpen(true);
    handleClose();
  };
  return (
    <>
      <Tooltip title="Menu M">
        <IconButton
          classes={{root: classes.menuIcon}}
          aria-controls="mainMenu"
          aria-haspopup="true"
          aria-label="main menu"
          edge="start"
          onClick={handleClick}>
          {/* Set some opacity on the menu icon */}
          <MenuIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        id="mainMenu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}>
        <MenuItem onClick={handleUploadTestFile}>Upload Test File(s)</MenuItem>
        <MenuItem onClick={handleClose} className={classes.linkMenu}>
          <Button
            component={RouterLink}
            to={getLocation(PageUrl.HOME, location.search)}
            aria-label="Exit IDE"
            className={classes.linkButton}>
            Exit IDE
          </Button>
        </MenuItem>
      </Menu>
      <Dialog
        TransitionComponent={Transition}
        onClose={closeDlg}
        fullWidth
        maxWidth="lg"
        open={dlgOpen}
        classes={{paper: classes.root}}>
        <DialogTitle
          onClose={closeDlg}
          disableTypography
          className={classes.dlgTitle}>
          <Typography variant="h6">Test Files</Typography>
          <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={closeDlg}>
            <CloseIcon titleAccess="Close" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TestFileManager />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MainMenu;
