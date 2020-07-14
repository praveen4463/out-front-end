import React, {useState, useEffect} from 'react';
import {ThemeProvider} from '@material-ui/styles';
import TopNavigation from './TopNavigation';
import ProjectSelector from './ProjectSelector';
import Content from './Content';
import darkTheme from './Themes';
import sampleFiles from './Explorer/sample';
import './ide.css';

const Ide = () => {
  // May also be null when there is no incoming project found on load, for
  // example user visits IDE without selecting any project/file/test.
  const [selectedProject, setSelectedProject] = useState(1);
  const [files, setFiles] = useState(null);

  const changeProjectHandler = (value) => {
    // alert before project is switched, and notify user that will reset
    // IDE to it's original state.
    setSelectedProject(value);
  };

  useEffect(() => {
    // call db and get files per the query string, validate them using a
    // json-schema before any use:
    // 1. if testId, get all tests from corresponding file.
    // 2. if fileId, get all tests from file.
    // 3. when just projectId, do nothing.
    if (sampleFiles !== null && sampleFiles.length !== 0) {
      setFiles(sampleFiles); // Fill some sample data for now
    }
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          margin: 0,
        }}>
        <div style={{display: 'flex', flex: '1 1 auto'}}>
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'fixed',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}>
            <TopNavigation
              projectSelector={
                <ProjectSelector
                  selectedProject={selectedProject}
                  changeProjectHandler={changeProjectHandler}
                />
              }
            />
            <Content files={files} />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default Ide;
