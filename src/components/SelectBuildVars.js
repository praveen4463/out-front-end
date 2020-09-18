import React, {useState, useMemo} from 'react';

import {makeStyles} from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Box from '@material-ui/core/Box';
import clsx from 'clsx';
import {truncate, groupBy} from 'lodash-es';
import Button from '@material-ui/core/Button';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    color: theme.palette.background.contrastText,
  },
  text: {
    fontSize: '0.875rem',
    color: theme.palette.background.contrastText,
  },
  description: {
    paddingBottom: theme.spacing(2),
  },
  heading: {
    flexBasis: '33.33%',
    flexShrink: 0,
  },
  secondaryHeading: {
    color: theme.palette.text.secondary,
  },
  primaryMark: {
    color: theme.palette.success.main,
  },
  groupVars: {
    padding: `${theme.spacing(1)}px 0px`,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  groupDetail: {
    display: 'flex',
    flexDirection: 'column',
  },
  detailsRoot: {
    display: 'flex',
    flexDirection: 'column',
  },
  button: {
    fontSize: '0.725rem',
  },
  groupVarsText: {
    marginLeft: theme.spacing(1),
  },
}));

const useKeyGroupSummaryStyles = makeStyles((theme) => ({
  root: {
    '&$expanded': {
      backgroundColor: theme.palette.action.focus,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  expanded: {},
}));

const getFormattedValue = (rawValue) => {
  return truncate(rawValue, {
    length: 250,
  });
};

const SelectBuildVars = React.memo(
  ({varBuild, selectedBuildVarsPerKey, onSelect}) => {
    const {buildVars} = varBuild.entities;
    const groupedData = useMemo(
      () =>
        varBuild === null || !varBuild.result.length
          ? null
          : groupBy(
              varBuild.result.map((b) => buildVars[b]),
              (v) => v.key
            ),
      [varBuild, buildVars]
    );
    const classes = useStyles();
    const keyGroupSummary = useKeyGroupSummaryStyles();
    const [expanded, setExpanded] = useState(false);

    const handleChange = (panel) => (event, isExpanded) => {
      setExpanded(isExpanded ? panel : false);
    };

    const handleClick = (buildVar) => {
      onSelect(buildVar);
    };

    return (
      <div className={classes.root}>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="top-panel-content"
            id="top-panel-header">
            <Typography className={classes.text}>
              Customize Build Variables resolution
            </Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.detailsRoot}>
            {groupedData ? (
              <>
                <Typography className={clsx(classes.text, classes.description)}>
                  Build variables having more than one values can resolve to a
                  desired value per build/dry-run. Following list shows build
                  variables and the value they currently resolve to. To change
                  the resolved value, expand a variable group and select desired
                  value.
                </Typography>
                <Box display="flex" flexDirection="column" overflow="auto">
                  {Object.keys(groupedData).map((key) => {
                    const keyResolveTo = selectedBuildVarsPerKey[key]
                      ? buildVars[selectedBuildVarsPerKey[key]]
                      : groupedData[key].find((buildVar) => buildVar.primary);
                    return (
                      <Accordion
                        expanded={expanded === key}
                        onChange={handleChange(key)}
                        key={keyResolveTo.id}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          aria-controls={`${key}bh-content`}
                          id={`${key}bh-header`}
                          classes={{
                            root: keyGroupSummary.root,
                            expanded: keyGroupSummary.expanded,
                          }}>
                          <Typography
                            className={clsx(classes.heading, classes.text)}>
                            {key}
                          </Typography>
                          <Typography
                            className={clsx(
                              classes.text,
                              classes.secondaryHeading
                            )}>
                            {getFormattedValue(keyResolveTo.value)}{' '}
                            {keyResolveTo.primary ? (
                              <span className={classes.primaryMark}>
                                (primary)
                              </span>
                            ) : null}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails classes={{root: classes.groupDetail}}>
                          {groupedData[key]
                            .filter(
                              (buildVar) => buildVar.id !== keyResolveTo.id
                            )
                            .map((buildVar) => (
                              <Box
                                display="flex"
                                flexDirection="row"
                                alignItems="center"
                                key={buildVar.id}
                                className={classes.groupVars}>
                                <Box pl={3}>
                                  <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => handleClick(buildVar)}
                                    className={classes.button}>
                                    Resolve To This Value
                                  </Button>
                                </Box>
                                <Box
                                  flex={1}
                                  flexWrap="wrap"
                                  textAlign="center">
                                  <Typography
                                    className={clsx(
                                      classes.text,
                                      classes.groupVarsText
                                    )}>
                                    {getFormattedValue(buildVar.value)}{' '}
                                    {buildVar.primary ? (
                                      <span className={classes.primaryMark}>
                                        (primary)
                                      </span>
                                    ) : null}
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              </>
            ) : (
              <Typography variant="body1">
                No Build Variable exists yet, use edit menu to add some.
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      </div>
    );
  }
);

SelectBuildVars.propTypes = {
  varBuild: PropTypes.shape({
    entities: PropTypes.shape({
      buildVars: PropTypes.shape({
        id: PropTypes.number,
      }),
    }),
    result: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
  selectedBuildVarsPerKey: PropTypes.shape({
    key: PropTypes.string,
    id: PropTypes.number,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default SelectBuildVars;
