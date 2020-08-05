import React from 'react';
import PropTypes from 'prop-types';
import {makeStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

const useStyle = makeStyles((theme) => ({
  root: {
    color: theme.palette.background.contrastText,
  },
}));

const TabPanel = React.memo(({version, testName, fileName}) => {
  const classes = useStyle();

  return (
    <Box
      display="flex"
      flexDirection="column"
      id={`scrollable-auto-tabpanel-${version.id}`}
      aria-labelledby={`scrollable-auto-tab-${version.id}`}
      className={classes.root}>
      <Typography variant="caption">
        {`${fileName} > ${testName} > ${version.name}`}
      </Typography>
      <Typography variant="body1">{version.code}</Typography>
    </Box>
  );
});

TabPanel.propTypes = {
  version: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    testId: PropTypes.number,
    code: PropTypes.string,
    isCurrent: PropTypes.bool,
    hasError: PropTypes.bool,
    errorMsg: PropTypes.string,
  }).isRequired,
  testName: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
};

export default TabPanel;
