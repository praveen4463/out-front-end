import React, {useState, useEffect, useRef} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import Box from '@material-ui/core/Box';
import {InputBase} from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import Tooltip from '../TooltipCustom';

// ==============================GLOBALS========================================

const maxTextLength = 100;
const testDetailType = {
  name: 'testName',
  version: 'testVersion',
};

// ==============================STYLES=========================================

const useStyles = makeStyles((theme) => ({
  text: {
    fontWeight: 400,
    fontSize: '0.8125rem',
    lineHeight: 1,
    opacity: theme.textOpacity.highEmphasis,
  },
  input: {
    padding: theme.spacing(1),
  },
  addIconFont: {
    fontSize: '1rem',
  },
}));

// ==============================FORM-TEXT-INPUT================================

// uncontrolled component because we don't want to keep a state.
const FormTextInput = (props) => {
  const {
    // eslint-disable-next-line no-unused-vars
    dbId,
    // eslint-disable-next-line no-unused-vars
    type,
    defaultValue,
    postSubmitCallback,
    classes,
  } = props;
  const txInputRef = useRef(null);

  // text in text input should be selected on render
  useEffect(() => {
    txInputRef.current.focus();
    txInputRef.current.select();
  });

  function submit(e) {
    const {value} = txInputRef.current;
    if (!value.trim()) {
      postSubmitCallback(type, defaultValue);
    }
    if (value.length > maxTextLength) {
      postSubmitCallback(
        type,
        defaultValue,
        "Test or Version name can't be that long."
      );
    }
    // send to db async but don't wait for it to complete, if some error occurs,
    // retry, and report it. If still fails, call the callback with the
    // original value so that an error could be shown to user that the update
    // was failed and revert the name to original (provided in the callback).
    // Errors should be shown in form of snackbar over the name fields.

    // call callback to show user updated name without waiting for
    // network requst to complete as no user action depends on the new name.
    postSubmitCallback(type, value);
    e.preventDefault();
  }

  return (
    <Box display="flex" alignItems="center">
      <form noValidate autoComplete="off" onSubmit={submit}>
        <InputBase
          classes={{
            input: `${classes.text} ${classes.input}`,
          }}
          defaultValue={defaultValue}
          inputProps={{'aria-label': 'naked'}}
          inputRef={txInputRef}
          id="txTestDetail"
          onBlur="this.form.submit()"
        />
      </form>
    </Box>
  );
};

FormTextInput.propTypes = {
  dbId: PropTypes.number.isRequired,
  type: PropTypes.oneOf(
    Object.keys(testDetailType).map((k) => testDetailType[k])
  ).isRequired,
  defaultValue: PropTypes.string.isRequired,
  postSubmitCallback: PropTypes.func.isRequired,
  classes: PropTypes.shape({
    text: PropTypes.object,
    input: PropTypes.object,
  }).isRequired,
};

// ==============================TEST-VERSION-MANAGER===========================

// We're keeping the parent of this component the single source of truth for
// testVersionDetail's ids'. So, when this is mounted, the requested testId,
// testVersionId are fetched from db by parent, whenever a new version is
// created from here, parent's handler is called who will create new version,
// sets it into it's state and re-render this component with new version id/name
const TestVersionManager = (props) => {
  const {testVersionDetail, newVersionHandler} = props;
  const [testName, setTestName] = useState(testVersionDetail.testName);
  const [testVersion, setTestVersion] = useState(testVersionDetail.testVersion);
  const [editModeForType, setEditModeForType] = useState(null);
  const [error, setError] = useState(null);
  const classes = useStyles();

  const postSubmitCallback = (type, value, errorMsg) => {
    setEditModeForType(null);
    if (type === testDetailType.name) {
      setTestName(value);
    } else {
      setTestVersion(value);
    }
    if (errorMsg) {
      setError(errorMsg);
    }
  };

  const clickTestName = (type) => {
    setEditModeForType(type);
  };

  const handleErrorClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setError(null);
  };

  if (editModeForType) {
    let dbId;
    let defaultValue;
    if (editModeForType === testDetailType.name) {
      dbId = testVersionDetail.testId;
      defaultValue = testVersionDetail.testName;
    } else {
      dbId = testVersionDetail.testVersionId;
      defaultValue = testVersionDetail.testVersion;
    }
    return (
      <FormTextInput
        dbId={dbId}
        type={editModeForType}
        defaultValue={defaultValue}
        classes={classes}
        postSubmitCallback={postSubmitCallback}
      />
    );
  }
  return (
    <>
      {/* !! We will show auto saved messages in the message bar below the app
          bar in form of SnackBar. */}
      <Tooltip title="Test Name, Click To Rename">
        <Box display="flex" alignItems="center" className={classes.text}>
          <Box
            component="span"
            px={1}
            onClick={() => clickTestName(testDetailType.name)}>
            {testName}
          </Box>
          {/* slash is inside here so that it doesn't require a separate box
              to be into center. */}
          <Box component="span">/</Box>
        </Box>
      </Tooltip>
      <Tooltip title="Test Version, Click To Rename">
        <Box display="flex" alignItems="center" className={classes.text}>
          <Box
            component="span"
            pl={1}
            onClick={() => clickTestName(testDetailType.version)}>
            {testVersion}
          </Box>
        </Box>
      </Tooltip>
      <Tooltip title="Create & Switch to New Version">
        <IconButton
          aria-label="Create & Switch to New Version"
          onClick={newVersionHandler}>
          <AddCircleIcon
            color="secondary"
            classes={{root: classes.addIconFont}}
          />
        </IconButton>
      </Tooltip>
      <Snackbar
        anchorOrigin={{vertical: 'top', horizontal: 'center'}}
        open={Boolean(error)}
        autoHideDuration={4000}
        onClose={handleErrorClose}>
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={handleErrorClose}
          severity="error">
          {error}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

TestVersionManager.propTypes = {
  testVersionDetail: PropTypes.exact({
    testId: PropTypes.number,
    testVersionId: PropTypes.number,
    testName: PropTypes.string,
    testVersion: PropTypes.string,
  }).isRequired,
  newVersionHandler: PropTypes.func.isRequired,
};

// ===============================EXPORT========================================

export default TestVersionManager;
