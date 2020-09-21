import React, {useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import InputBase from '@material-ui/core/InputBase';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import Box from '@material-ui/core/Box';
import Portal from '@material-ui/core/Portal';
import validator from './treeItemValidator';
import ColoredItemIcon from '../../components/ColoredItemIcon';
import {ExplorerItemType, ExplorerEditOperationType} from '../Constants';

const useStyles = makeStyles((theme) => ({
  text: {
    fontFamily: theme.typography.caption.fontFamily,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.caption.fontWeight,
    lineHeight: theme.typography.caption.lineHeight,
    letterSpacing: theme.typography.caption.letterSpacing,
  },
}));

// if we keep it inside component, this will change on every render, making a
// new function every time thus the input invokes it on every render too. If
// it was inside component, should have use useCallback to remember.
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
  operationType,
  onCommit,
  onCancel,
  onHovering,
  onHoveringCancel,
  errorContainerRef,
}) => {
  const [error, setError] = useState(null);
  const [value, setValue] = useState(defaultName);
  const classes = useStyles();

  const onChangeHandler = (e) => {
    setValue(e.target.value);
  };

  const commitHandler = () => {
    const name = value.trim();
    if (name === defaultName || name.length === 0) {
      onCancel();
      return;
    }
    // if this is a rename and renamed value as just different case, allow the
    // renaming here itself.
    if (
      operationType === ExplorerEditOperationType.RENAME &&
      name.toLowerCase() === defaultName.toLowerCase()
    ) {
      onCommit(name, itemType);
      return;
    }
    const errorMsg = validator(name, existingNames, itemType, operationType);
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
    <>
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
          value={value}
          fullWidth
          inputProps={{'aria-label': 'naked'}}
          id="input-tree-edit"
          className={classes.text}
          autoFocus
          autoComplete="off"
        />
      </Box>
      {error !== null && (
        <Portal container={errorContainerRef.current}>
          <Typography
            variant="caption"
            color="error"
            display="block"
            data-testid="explorerError">
            {error}
          </Typography>
        </Portal>
      )}
    </>
  );
};

TreeItemEditor.propTypes = {
  defaultName: PropTypes.string.isRequired,
  existingNames: PropTypes.arrayOf(PropTypes.string),
  itemType: PropTypes.oneOf(Object.keys(ExplorerItemType)).isRequired,
  operationType: PropTypes.oneOf(Object.keys(ExplorerEditOperationType))
    .isRequired,
  onCommit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  errorContainerRef: PropTypes.exact({
    current: PropTypes.any,
  }).isRequired,
  onHovering: PropTypes.func,
  onHoveringCancel: PropTypes.func,
};

TreeItemEditor.defaultProps = {
  existingNames: null,
  onHovering: () => null,
  onHoveringCancel: () => null,
};

export default TreeItemEditor;
