import React, {useEffect, useRef} from 'react';
import Box from '@material-ui/core/Box';
import PropTypes from 'prop-types';
import 'codemirror/lib/codemirror.css';
import CodeMirror from 'codemirror';
import 'codemirror/addon/runmode/runmode';
import '../codemirror/material-darker.css';
import '../codemirror/modes/zwl';

// Note that I've not used standalone rather than full codemirror as it will
// be needed for ide and other parts as well, use standalone in docs or other sites.
const CodeViewer = ({rawCode}) => {
  const outputRef = useRef(null);

  useEffect(() => {
    CodeMirror.runMode(rawCode, 'zwl', outputRef.current);
  }, [rawCode]);

  return (
    <Box display="flex" flex={1} height="100%">
      <pre
        id="output"
        className="CodeMirror cm-s-material-darker"
        ref={outputRef}
      />
    </Box>
  );
};

CodeViewer.propTypes = {
  rawCode: PropTypes.string.isRequired,
};

export default CodeViewer;
