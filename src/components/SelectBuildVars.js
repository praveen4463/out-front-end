import React, {useState, useMemo} from 'react';

import {makeStyles} from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Box from '@material-ui/core/Box';
import clsx from 'clsx';
import truncate from 'lodash-es/truncate';
import groupBy from 'lodash-es/groupBy';
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
    textTransform: 'unset',
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
  ({varBuild, selectedBuildVarIdPerKey, onSelect, accordionClasses}) => {
    const buildVars = varBuild ? varBuild.entities.buildVars : null;
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
        <Accordion classes={accordionClasses}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="selectBuildVars-content"
            id="selectBuildVars-header">
            <Typography className={classes.text}>
              Customize Build Variables Resolution
            </Typography>
          </AccordionSummary>
          <AccordionDetails className={classes.detailsRoot}>
            {groupedData ? (
              <>
                <Box display="flex" flexDirection="column" overflow="auto">
                  {Object.keys(groupedData).map((key) => {
                    const keyResolveTo = selectedBuildVarIdPerKey[key]
                      ? buildVars[selectedBuildVarIdPerKey[key]]
                      : groupedData[key].find((buildVar) => buildVar.isPrimary);
                    return (
                      <Accordion
                        expanded={expanded === key}
                        onChange={handleChange(key)}
                        key={keyResolveTo.id}
                        data-testid="keyGroup"
                        classes={accordionClasses}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          aria-controls={`${keyResolveTo.id}-content`}
                          id={`${keyResolveTo.id}-header`}
                          classes={{
                            root: keyGroupSummary.root,
                            expanded: keyGroupSummary.expanded,
                          }}
                          data-testid="keyGroupSummary">
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
                            {keyResolveTo.isPrimary ? (
                              <span className={classes.primaryMark}>
                                (primary)
                              </span>
                            ) : null}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails
                          classes={{root: classes.groupDetail}}
                          data-testid="keyGroupDetails">
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
                                className={classes.groupVars}
                                data-testid="keyGroupVars">
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
                                  textAlign="center"
                                  data-testid="varText">
                                  <Typography
                                    className={clsx(
                                      classes.text,
                                      classes.groupVarsText
                                    )}>
                                    {getFormattedValue(buildVar.value)}{' '}
                                    {buildVar.isPrimary ? (
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
              <Typography variant="body2">
                No build variable exists yet, use IDE &gt; Edit Menu to add
                some.
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
  }),
  selectedBuildVarIdPerKey: PropTypes.shape({
    key: PropTypes.string,
    id: PropTypes.number,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  accordionClasses: PropTypes.object,
};

SelectBuildVars.defaultProps = {
  varBuild: null,
  accordionClasses: {},
};

export default SelectBuildVars;
