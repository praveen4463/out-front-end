import React from 'react';
import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/styles';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import FileIcon from '@material-ui/icons/InsertDriveFile';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import {ExplorerItemType} from '../Constants';
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
const Explorer = ({files}) => {
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <Box
        display="flex"
        alignItems="center"
        style={{borderBottom: '1px solid #363636'}}>
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
      <Box py={1}>
        <TreeView
          defaultCollapseIcon={<ArrowDropDownIcon />}
          defaultExpandIcon={<ArrowRightIcon />}
          multiSelect>
          {files !== null &&
            files.loadToTree &&
            files.map((f) => (
              <TreeItem
                nodeId={`${ExplorerItemType.FILE}-${f.id}`}
                key={f.id}
                label={<Typography variant="caption">{f.name}</Typography>}>
                {/* onNodeSelect passes nodeId as node parameter, we've
                appeneded type to id because id's are not unique across
                file/test/version and also we need it to know what type of items
                selected */}
                {f.tests !== undefined &&
                  f.tests.length &&
                  f.tests.map((t) => (
                    <TreeItem
                      nodeId={`${ExplorerItemType.TEST}-${t.id}`}
                      key={t.id}
                      label={
                        <Typography variant="caption">{t.name}</Typography>
                      }>
                      {t.versions !== undefined &&
                        t.versions.length &&
                        t.versions.map((v) => (
                          <TreeItem
                            nodeId={`${ExplorerItemType.VERSION}-${v.id}`}
                            key={v.id}
                            label={
                              <Typography variant="caption">
                                {v.name}
                              </Typography>
                            }
                          />
                        ))}
                    </TreeItem>
                  ))}
              </TreeItem>
            ))}
          {/* <div className="MuiTreeItem-content">
              <div className="MuiTreeItem-iconContainer" />
              <div className="MuiTreeItem-label">
                <input value="Test all are empty" readOnly />
              </div>
            </div> */}
        </TreeView>
      </Box>
    </Box>
  );
};

Explorer.propTypes = {
  files: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Explorer;
