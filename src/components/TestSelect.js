/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/jsx-props-no-spreading */
import React, {useState, useMemo} from 'react';
import PropTypes from 'prop-types';
import SvgIcon from '@material-ui/core/SvgIcon';
import {fade, makeStyles, withStyles} from '@material-ui/core/styles';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import Collapse from '@material-ui/core/Collapse';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Checkbox from '@material-ui/core/Checkbox';
import Chip from '@material-ui/core/Chip';
import {useSpring, animated} from 'react-spring/web.cjs'; // web.cjs is required for IE 11 support
import ColoredItemIcon from './ColoredItemIcon';
import {ExplorerItemType} from '../ide/Constants';

const MinusSquare = (props) => {
  return (
    <SvgIcon fontSize="inherit" style={{width: 14, height: 14}} {...props}>
      <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 11.023h-11.826q-.375 0-.669.281t-.294.682v0q0 .401.294 .682t.669.281h11.826q.375 0 .669-.281t.294-.682v0q0-.401-.294-.682t-.669-.281z" />
    </SvgIcon>
  );
};

const PlusSquare = (props) => {
  return (
    <SvgIcon fontSize="inherit" style={{width: 14, height: 14}} {...props}>
      <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 12.977h-4.923v4.896q0 .401-.281.682t-.682.281v0q-.375 0-.669-.281t-.294-.682v-4.896h-4.923q-.401 0-.682-.294t-.281-.669v0q0-.401.281-.682t.682-.281h4.923v-4.896q0-.401.294-.682t.669-.281v0q.401 0 .682.281t.281.682v4.896h4.923q.401 0 .682.281t.281.682v0q0 .375-.281.669t-.682.294z" />
    </SvgIcon>
  );
};

function CloseSquare(props) {
  return (
    <SvgIcon
      className="close"
      fontSize="inherit"
      style={{width: 14, height: 14}}
      {...props}>
      <path d="M17.485 17.512q-.281.281-.682.281t-.696-.268l-4.12-4.147-4.12 4.147q-.294.268-.696.268t-.682-.281-.281-.682.294-.669l4.12-4.147-4.12-4.147q-.294-.268-.294-.669t.281-.682.682-.281.696 .268l4.12 4.147 4.12-4.147q.294-.268.696-.268t.682.281 .281.669-.294.682l-4.12 4.147 4.12 4.147q.294.268 .294.669t-.281.682zM22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0z" />
    </SvgIcon>
  );
}

const TransitionComponent = (props) => {
  const style = useSpring({
    from: {opacity: 0, transform: 'translate3d(20px,0,0)'},
    to: {
      opacity: props.in ? 1 : 0,
      transform: `translate3d(${props.in ? 0 : 20}px,0,0)`,
    },
  });

  return (
    <animated.div style={style}>
      <Collapse {...props} />
    </animated.div>
  );
};

TransitionComponent.propTypes = {
  /**
   * Show the component; triggers the enter or exit states
   */
  in: PropTypes.bool,
};

TransitionComponent.defaultProps = {
  in: null,
};

const StyledTreeItem = withStyles((theme) => ({
  iconContainer: {
    '& .close': {
      opacity: 0.3,
    },
  },
  group: {
    marginLeft: 7,
    paddingLeft: 18,
    borderLeft: `1px dashed ${fade(theme.palette.text.primary, 0.4)}`,
  },
  root: {
    userSelect: 'none',
    color: 'inherit',
    '&$selected > $content $label, &$selected:focus > $content $label, &$selected:hover > $content $label': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  content: {
    color: 'inherit',
  },
  expanded: {},
  selected: {},
  label: {
    color: 'inherit',
  },
}))((props) => (
  <TreeItem {...props} TransitionComponent={TransitionComponent} />
));

const {FILE, TEST, VERSION} = ExplorerItemType;

const ItemSelector = ({
  itemType,
  itemId,
  onItemSelectionChange,
  isSelected,
}) => {
  const handleChange = (e) => {
    onItemSelectionChange(itemType, itemId, e.target.checked);
  };

  const getTitle = () => {
    switch (itemType) {
      case FILE:
        if (isSelected) {
          return "Click to deselect this file, it's selected test(s) and version(s)";
        }
        return "Click to select this file, all it's test(s) and latest version";
      case TEST:
        if (isSelected) {
          return "Click to deselect this test, it's selected version(s)";
        }
        return "Click to select this test, it's latest version";
      case VERSION:
        if (isSelected) {
          return 'Click to deselect this version';
        }
        return 'Click to select this version';
      default:
        throw new Error(`Couldn't recognize itemType ${itemType}`);
    }
  };

  return (
    <Checkbox
      style={{padding: '0px'}}
      onChange={handleChange}
      checked={isSelected}
      title={getTitle()}
    />
  );
};

ItemSelector.propTypes = {
  itemType: PropTypes.oneOf(Object.values(ExplorerItemType)).isRequired,
  itemId: PropTypes.number.isRequired,
  onItemSelectionChange: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
};

const useStyles = makeStyles((theme) => ({
  root: {
    height: 264,
    flexGrow: 1,
    width: '100%',
  },
  checked: {
    color: theme.palette.secondary.highlight,
  },
  noRecordText: {
    marginTop: theme.spacing(4),
  },
  chip: {
    marginLeft: theme.spacing(0.5),
    fontSize: '0.7rem',
    height: theme.spacing(1.8),
    cursor: 'pointer',
  },
}));

// When loaded from IDE, files will be the files loaded into explorer, when from
// other parts of app, all files will be loaded from api and converted for normalized
// files format.
// files will be filtered to have only files with test(s)
const TestSelect = React.memo(
  ({files, onItemSelectionChange, selectedVersions, noTestMsg}) => {
    const etFiles = files ? files.entities.files : null;
    const classes = useStyles();
    const [expandedNodes, setExpandedNodes] = useState([]);
    const anyTests = useMemo(() => {
      if (!files || !Array.isArray(files.result) || !files.result.length) {
        return false;
      }
      return files.result.some(
        (id) => Array.isArray(etFiles[id].tests) && etFiles[id].tests.length
      );
    }, [etFiles, files]);

    const handleToggle = (e, nodeIds) => {
      if (e.target.getAttribute('type') !== 'checkbox') {
        setExpandedNodes(nodeIds);
      }
    };

    const isSelected = (itemType, itemId) => {
      switch (itemType) {
        case FILE:
          return etFiles[itemId].tests.some((tid) =>
            files.entities.tests[tid].versions.some((vid) =>
              selectedVersions.has(vid)
            )
          );
        case TEST:
          return files.entities.tests[itemId].versions.some((vid) =>
            selectedVersions.has(vid)
          );
        case VERSION:
          return selectedVersions.has(itemId);
        default:
          throw new Error(`Couldn't recognize itemType ${itemType}`);
      }
    };

    return anyTests ? (
      <TreeView
        className={classes.root}
        expanded={expandedNodes}
        onNodeToggle={handleToggle}
        defaultCollapseIcon={<MinusSquare />}
        defaultExpandIcon={<PlusSquare />}
        defaultEndIcon={<CloseSquare />}>
        {files.result
          .filter(
            (fid) =>
              Array.isArray(etFiles[fid].tests) && etFiles[fid].tests.length
          )
          .map((fid) => (
            <StyledTreeItem
              nodeId={`${FILE}-${fid}`}
              key={fid}
              label={
                <Box display="flex" alignItems="center">
                  <ItemSelector
                    itemType={FILE}
                    itemId={fid}
                    onItemSelectionChange={onItemSelectionChange}
                    isSelected={isSelected(FILE, fid)}
                  />
                  <ColoredItemIcon itemType={FILE} />
                  <Typography variant="body2" style={{marginLeft: '4px'}}>
                    {etFiles[fid].name}
                  </Typography>
                </Box>
              }>
              {etFiles[fid].tests.map((tid) => (
                <StyledTreeItem
                  nodeId={`${TEST}-${tid}`}
                  key={tid}
                  label={
                    <Box display="flex" alignItems="center">
                      <ItemSelector
                        itemType={TEST}
                        itemId={tid}
                        onItemSelectionChange={onItemSelectionChange}
                        isSelected={isSelected(TEST, tid)}
                      />
                      <ColoredItemIcon itemType={TEST} />
                      <Typography variant="body2" style={{marginLeft: '4px'}}>
                        {files.entities.tests[tid].name}
                      </Typography>
                    </Box>
                  }>
                  {files.entities.tests[tid].versions.map((vid) => (
                    <StyledTreeItem
                      nodeId={`${VERSION}-${vid}`}
                      key={vid}
                      label={
                        <Box display="flex" alignItems="center">
                          <ItemSelector
                            itemType={VERSION}
                            itemId={vid}
                            onItemSelectionChange={onItemSelectionChange}
                            isSelected={isSelected(VERSION, vid)}
                          />
                          <ColoredItemIcon itemType={VERSION} />
                          <Typography
                            variant="body2"
                            style={{marginLeft: '4px'}}>
                            {files.entities.versions[vid].name}
                          </Typography>
                          {files.entities.versions[vid].isCurrent && (
                            <Chip
                              size="small"
                              label="Latest"
                              className={classes.chip}
                            />
                          )}
                        </Box>
                      }
                    />
                  ))}
                </StyledTreeItem>
              ))}
            </StyledTreeItem>
          ))}
      </TreeView>
    ) : (
      <Typography variant="body2" className={classes.noRecordText}>
        {noTestMsg}
      </Typography>
    );
  }
);

TestSelect.propTypes = {
  files: PropTypes.shape({
    entities: PropTypes.shape({
      versions: PropTypes.shape({
        [PropTypes.string]: PropTypes.shape({
          id: PropTypes.number, // just a single property is ok
        }),
      }),
      tests: PropTypes.shape({
        [PropTypes.string]: PropTypes.shape({
          id: PropTypes.number, // just a single property is ok
        }),
      }),
      files: PropTypes.shape({
        [PropTypes.string]: PropTypes.shape({
          id: PropTypes.number, // just a single property is ok
        }),
      }),
    }),
    result: PropTypes.arrayOf(PropTypes.number),
  }),
  onItemSelectionChange: PropTypes.func.isRequired,
  selectedVersions: PropTypes.instanceOf(Set).isRequired,
  noTestMsg: PropTypes.string.isRequired,
};

TestSelect.defaultProps = {
  files: null,
};

export default TestSelect;
