import React from 'react';
import Box from '@material-ui/core/Box';
import {makeStyles} from '@material-ui/styles';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import FileIcon from '@material-ui/icons/InsertDriveFile';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
// import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import Tooltip from '../../TooltipCustom';

const useStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
    height: '100%',
  },
  iconButton: {
    padding: theme.spacing(1),
  },
  icon: {
    fontSize: '1rem',
    opacity: theme.textOpacity.highEmphasis,
  },
  fileCaption: {
    paddingLeft: theme.spacing(1),
  },
}));

// take props with current state and functions to send updates to state,
// handlers for starting the build. On re-render, always create using the
// state.
const Explorer = () => {
  const classes = useStyles();

  return (
    <Box px={0.5} className={classes.root}>
      <Box display="flex" alignItems="center">
        <Typography variant="caption" className={classes.fileCaption}>
          Files
        </Typography>
        <Box flex={1} />
        <Tooltip title="New File">
          <IconButton aria-label="New File" className={classes.iconButton}>
            <FileIcon className={classes.icon} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Load Existing File(s)">
          <IconButton
            aria-label="Load Existing File(s)"
            className={classes.iconButton}>
            <AddCircleOutlineIcon className={classes.icon} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box>
        <TreeView>
          <TreeItem
            nodeId="1"
            label={<Typography variant="caption">Action Tests</Typography>}
          />
          <TreeItem
            nodeId="2"
            label={<Typography variant="caption">Until Tests</Typography>}>
            <TreeItem
              nodeId="4"
              label={
                <Typography variant="caption">
                  Test should wait until page loaded
                </Typography>
              }
            />
            <TreeItem
              nodeId="5"
              label={
                <Typography variant="caption">
                  Test should check all checkboxes are disabled
                </Typography>
              }
            />
            <TreeItem
              nodeId="6"
              label={
                <Typography variant="caption">
                  Test all input boxes are enabled
                </Typography>
              }
            />
            <div className="MuiTreeItem-content">
              <div className="MuiTreeItem-iconContainer" />
              <div className="MuiTreeItem-label">
                <input value="Test all are empty" readOnly />
              </div>
            </div>
          </TreeItem>
          <TreeItem
            nodeId="3"
            label={<Typography variant="caption">UI Tests</Typography>}
          />
        </TreeView>
      </Box>
    </Box>
  );
};

export default Explorer;
