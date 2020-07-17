import React, {useState} from 'react';
import InputBase from '@material-ui/core/InputBase';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import validator from './treeItemValidator';

const selectOnMount = (input) => {
  if (input !== null) {
    input.select();
  }
};

const TreeItemEditor = ({
  defaultName,
  existingNames,
  itemType,
  onCommit,
  onCancel,
}) => {
  const [error, setError] = useState(null);
  const [value, setValue] = useState(defaultName);

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
    if (e.code === 'Enter') {
      commitHandler();
    } else if (e.code === 'Escape') {
      onCancel();
    }
  };

  return (
    <>
      <InputBase
        onBlur={commitHandler}
        onChange={(e) => setValue(e.target.value)}
        onKeyUp={keyUpHandler}
        ref={selectOnMount}
        defaultValue={value}
        style={{textAlign: 'center'}}
        fullWidth
        inputProps={{'aria-label': 'naked'}}
        id="input-tree-edit"
      />
      {error !== null && (
        <Typography variant="caption" color="error" display="block" />
      )}
    </>
  );
};

TreeItemEditor.propTypes = {
  defaultName: PropTypes.string.isRequired,
  existingNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  itemType: PropTypes.string.isRequired,
  onCommit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default TreeItemEditor;
