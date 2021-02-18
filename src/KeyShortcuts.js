import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';

const Key = withStyles((theme) => ({
  root: {
    fontFamily: "'Fira Mono', 'Courier New', Courier, monospace",
    fontSize: theme.typography.pxToRem(12.6),
    color: theme.palette.background.contrastText,
    backgroundColor: theme.palette.background.contrastTextBackground,
    borderRadius: '0.2rem',
    padding: '0.2rem 0.4rem',
  },
}))(Typography);

const Label = withStyles((theme) => ({
  root: {
    fontSize: theme.typography.pxToRem(14),
    color: theme.palette.background.contrastText,
    marginLeft: theme.spacing(1),
  },
}))(Typography);

const Row = ({children}) => {
  return (
    <Box display="flex" alignItems="center" pb={1}>
      {children}
    </Box>
  );
};

Row.propTypes = {
  children: PropTypes.node.isRequired,
};

const KeyShortcuts = () => {
  return (
    <Box display="flex" flexDirection="column">
      <Typography variant="body1" style={{fontWeight: 600}}>
        IDE only:
      </Typography>
      <Box display="flex" flexDirection="column" pl={1} pt={1}>
        <Row>
          <Key>b</Key>
          <Label>Run a build</Label>
        </Row>
        <Row>
          <Key>p</Key>
          <Label>Parse all files</Label>
        </Row>
        <Row>
          <Key>d</Key>
          <Label>Dry run all files</Label>
        </Row>
        <Row>
          <Key>ctrl c</Key>
          <Label>Stop a run</Label>
        </Row>
        <Row>
          <Key>shift a</Key>
          <Label>Manage build capabilities</Label>
        </Row>
        <Row>
          <Key>shift c</Key>
          <Label>Edit build config</Label>
        </Row>
        <Row>
          <Key>shift d</Key>
          <Label>Edit dry run config</Label>
        </Row>
        <Row>
          <Key>shift g</Key>
          <Label>Manage global variables</Label>
        </Row>
        <Row>
          <Key>shift b</Key>
          <Label>Manage build variables</Label>
        </Row>
      </Box>
    </Box>
  );
};

export default KeyShortcuts;
