import React, {useContext, useState} from 'react';
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
import Slide from '@material-ui/core/Slide';
import Divider from '@material-ui/core/Divider';
import {useLocation, useHistory} from 'react-router-dom';
import axios from 'axios';
import Tooltip from '../TooltipCustom';
import TestFileManager from '../Screens/TestFileManager';
import {
  getDownloadProjectEndpoint,
  getLocation,
  handleApiError,
} from '../common';
import {
  PageUrl,
  SnackbarHorPos,
  SnackbarType,
  SnackbarVerPos,
  Timeouts,
} from '../Constants';
import {AppSnackbarContext} from '../contexts';
import {IdeProjectIdContext} from './Contexts';
import {SnackbarAlertProps} from '../model';

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
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Slide direction="down" ref={ref} {...props} />;
});

const MainMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [dlgOpen, setDlgOpen] = useState(false);
  const projectId = useContext(IdeProjectIdContext);
  const [setSnackbarAlertProps, setSnackbarAlertError] = useContext(
    AppSnackbarContext
  );
  const location = useLocation();
  const history = useHistory();
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
  const handleDownloadProjectCodebase = async () => {
    try {
      const {data} = await axios.get(getDownloadProjectEndpoint(projectId), {
        responseType: 'blob',
        timeout: Timeouts.API_TIMEOUT_LONG,
      });
      setSnackbarAlertProps(
        new SnackbarAlertProps(
          'Your download will begin shortly.',
          SnackbarType.SUCCESS,
          SnackbarVerPos.TOP,
          SnackbarHorPos.CENTER,
          5000
        )
      );
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `codebase-${projectId}.zip`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      handleApiError(
        error,
        setSnackbarAlertError,
        `Couldn't download the codebase`
      );
    }
    handleClose();
  };
  const exit = () => {
    history.push(getLocation(PageUrl.HOME, location.search));
  };
  return (
    <>
      <Tooltip title="Menu">
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
        <Divider />
        <MenuItem onClick={handleDownloadProjectCodebase}>
          Download Codebase
        </MenuItem>
        <Divider />
        <MenuItem onClick={exit}>Exit IDE</MenuItem>
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
