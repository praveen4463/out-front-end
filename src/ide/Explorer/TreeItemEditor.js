import React, {useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import InputBase from '@material-ui/core/InputBase';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import validator from './treeItemValidator';
import ColoredItemIcon from './ColoredItemIcon';

const useStyles = makeStyles((theme) => ({
  text: {
    fontFamily: theme.typography.caption.fontFamily,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.caption.fontWeight,
    lineHeight: theme.typography.caption.lineHeight,
    letterSpacing: theme.typography.caption.letterSpacing,
  },
}));

const selectOnMount = (input) => {
  if (input !== null) {
    input.select();
  }
};

/*
  Hovering and Cancel Hovering are used here as callback so that when used with
  tree items that use hovering to change state and show action items, can
  correctly show/hide them when mouse is moved in/out during an editing. If we
  don't track hovering during editing, if user pull mouse out and clicks
  elsewhere, hovering state remains in tree item causing the action items to
  stay there even though the mouse was moved out.
  When used in other components that don't have to track hovering, these can
  be ignored.
*/
const TreeItemEditor = ({
  defaultName,
  existingNames,
  itemType,
  onCommit,
  onCancel,
  onHovering,
  onHoveringCancel,
}) => {
  const [error, setError] = useState(null);
  const [value, setValue] = useState(defaultName);
  const classes = useStyles();

  const onChangeHandler = (e) => {
    setValue(e.target.value);
  };

  const commitHandler = () => {
    const name = value.trim();
    if (value === defaultName || name.length === 0) {
      onCancel();
      return;
    }
    const errorMsg = validator(name, existingNames, itemType);
    if (errorMsg !== null) {
      setError(errorMsg);
      return;
    }
    onCommit(name, itemType);
  };

  const keyUpHandler = (e) => {
    if (e.key === 'Enter') {
      commitHandler();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const blurHandler = () => {
    if (error !== null) {
      onCancel();
      return;
    }
    commitHandler();
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      flex={1}
      onMouseEnter={onHovering}
      onMouseLeave={onHoveringCancel}>
      <ColoredItemIcon itemType={itemType} />
      <InputBase
        onBlur={blurHandler}
        onChange={onChangeHandler}
        onKeyUp={keyUpHandler}
        inputRef={selectOnMount}
        defaultValue={value}
        fullWidth
        inputProps={{'aria-label': 'naked'}}
        id="input-tree-edit"
        className={classes.text}
        autoFocus
      />
      {error !== null && (
        <Typography variant="caption" color="error" display="block">
          {error}
        </Typography>
      )}
    </Box>
  );
};

TreeItemEditor.propTypes = {
  defaultName: PropTypes.string.isRequired,
  existingNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  itemType: PropTypes.string.isRequired,
  onCommit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onHovering: PropTypes.func,
  onHoveringCancel: PropTypes.func,
};

TreeItemEditor.defaultProps = {
  onHovering: () => null,
  onHoveringCancel: () => null,
};

export default TreeItemEditor;
