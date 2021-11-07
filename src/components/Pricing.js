import React from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import {makeStyles, useTheme} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import CheckIcon from '@material-ui/icons/Check';
import InfoIcon from '@material-ui/icons/Info';
import Fade from '@material-ui/core/Fade';
import Tooltip from '@material-ui/core/Tooltip';
import PropTypes from 'prop-types';
import {FeaturesDesc, Plan} from '../Constants';

const useStyles = makeStyles((theme) => ({
  mWidth: {
    maxWidth: '1280px',
  },
  root: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    backgroundColor: theme.palette.background.default,
  },
  lightText: {
    color: `rgba(0, 0, 0, 0.7)`,
  },
  mediumText: {
    color: `rgba(0, 0, 0, 0.8)`,
  },
  bgOffWhite: {
    backgroundColor: '#f8f6f0',
    color: '#212121',
  },
  link: {
    color: theme.palette.secondary.main,
  },
  infoLabel: {
    marginLeft: '4px',
    fontSize: '0.7rem',
    color: theme.palette.text.light,
    cursor: 'pointer',
  },
  tooltip: {
    fontSize: '0.875rem',
  },
}));

const Pricing = ({onSelect}) => {
  const classes = useStyles();
  const theme = useTheme();

  const planSelect = (plan) => {
    onSelect(plan);
  };

  const getTextChecked = (text, featuresDesc) => (
    <Box display="flex" alignItems="center" py={0.5}>
      <CheckIcon
        style={{marginRight: theme.spacing(1), fontSize: '0.875rem'}}
      />
      {text}
      {featuresDesc ? (
        <Tooltip
          placement="right"
          title={featuresDesc}
          TransitionComponent={Fade}
          classes={{tooltip: classes.tooltip}}>
          <InfoIcon fontSize="small" className={classes.infoLabel} />
        </Tooltip>
      ) : null}
    </Box>
  );

  return (
    <main className={classes.root}>
      <Box component="section" width="100%">
        <Box className={classes.mWidth} pt={5} pb={3} px={2} mx="auto">
          <Box className={classes.lightText}>
            <Typography variant="h4" style={{fontWeight: 700}}>
              Please select a plan to continue
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box component="section" width="100%">
        <Box className={classes.mWidth} py={6} px={2} mx="auto">
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={4} lg>
              <Typography variant="h5" style={{fontWeight: 700}}>
                Free
              </Typography>
              <Box py={1} />
              <Typography variant="h4" style={{fontWeight: 700}}>
                $0
              </Typography>
              <Typography variant="caption" className={classes.lightText}>
                free forever
                <br />
                no credit card ever needed
              </Typography>
              <Box py={1} />
              <Button
                onClick={() => planSelect(Plan.FREE)}
                variant="outlined"
                color="primary"
                tabIndex="0">
                Get started
              </Button>
              <Box py={1} />
              <Box
                fontSize="body2.fontSize"
                color="text.secondary"
                fontWeight={500}>
                <span>Anyone can start automating for free.</span>
                <Box py={1} />
                <span style={{fontWeight: 600}}>Free for personal use</span>
                {getTextChecked('Unlimited projects', FeaturesDesc.PROJECTS)}
                {getTextChecked(
                  'Unlimited files and tests',
                  FeaturesDesc.FILES_TESTS
                )}
                {getTextChecked('1 team member')}
                {getTextChecked('50 build minutes', FeaturesDesc.BUILD_MIN)}
                {getTextChecked('1 parallel build', FeaturesDesc.PARALLEL)}
                {getTextChecked('Community support')}
                {getTextChecked(
                  'Last 30 builds history',
                  FeaturesDesc.BUILD_HISTORY
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg>
              <Typography variant="h5" style={{fontWeight: 700}}>
                Starter
              </Typography>
              <Box py={1} />
              <Typography variant="h4" style={{fontWeight: 700}}>
                $59
              </Typography>
              <Typography variant="caption" className={classes.lightText}>
                per month, billed annually
                <br />
                or $79 month-to-month
              </Typography>
              <Box py={1} />
              <Button
                onClick={() => planSelect(Plan.SB_TRIAL)}
                variant="outlined"
                color="primary"
                tabIndex="0">
                Start 14 days free trial
              </Button>
              <Box py={1} />
              <Box
                fontSize="body2.fontSize"
                color="text.secondary"
                fontWeight={500}>
                <span>Email support and more build minutes.</span>
                <Box py={1} />
                <span style={{fontWeight: 600}}>Everything in free, plus</span>
                {getTextChecked('10 team members')}
                {getTextChecked(
                  'Basic user management',
                  FeaturesDesc.BASIC_MANAGEMENT
                )}
                {getTextChecked('480 build minutes', FeaturesDesc.BUILD_MIN)}
                {getTextChecked('Priority email support')}
                {getTextChecked(
                  '30 days builds history',
                  FeaturesDesc.BUILD_HISTORY
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg>
              <Typography variant="h5" style={{fontWeight: 700}}>
                Pro
              </Typography>
              <Box py={1} />
              <Typography variant="h4" style={{fontWeight: 700}}>
                $159
              </Typography>
              <Typography variant="caption" className={classes.lightText}>
                per month, billed annually
                <br />
                or $199 month-to-month
              </Typography>
              <Box py={1} />
              <Button
                onClick={() => planSelect(Plan.BUSINESS_TRIAL)}
                variant="outlined"
                color="primary"
                tabIndex="0">
                Start 14 days free trial
              </Button>
              <Box py={1} />
              <Box
                fontSize="body2.fontSize"
                color="text.secondary"
                fontWeight={500}>
                <span>Priority support and more parallel.</span>
                <Box py={1} />
                <span style={{fontWeight: 600}}>
                  Everything in starter, plus
                </span>
                {getTextChecked('1200 build minutes', FeaturesDesc.BUILD_MIN)}
                {getTextChecked('2 parallel builds', FeaturesDesc.PARALLEL)}
                {getTextChecked('Priority support')}
                {getTextChecked('Unlimited team members')}
                {getTextChecked(
                  'Advanced permissions',
                  FeaturesDesc.ADVANCED_MANAGEMENT
                )}
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4} lg>
              <Typography variant="h5" style={{fontWeight: 700}}>
                QA specialist
              </Typography>
              <Box py={1} />
              <Typography variant="h4" style={{fontWeight: 700}}>
                $1590
              </Typography>
              <Typography variant="caption" className={classes.lightText}>
                per month, billed annually
                <br />
                or $1990 month-to-month
              </Typography>
              <Box py={1} />
              <Button
                onClick={() => planSelect(Plan.SB_TRIAL_PLUS_QA)}
                variant="contained"
                color="primary"
                tabIndex="0">
                Start 14 days free trial
              </Button>
              <Box py={1} />
              <Box
                fontSize="body2.fontSize"
                color="text.secondary"
                fontWeight={500}>
                <span>Unlimited testing by a QA specialist.</span>
                <Box py={1} />
                <span style={{fontWeight: 600}}>
                  Everything in starter, plus
                </span>
                {getTextChecked('Unlimited test writing service')}
                {getTextChecked('Premium support and team training')}
                {getTextChecked('1:1 help getting started')}
                {getTextChecked('Dedicated customer success manager')}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </main>
  );
};

Pricing.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

export default Pricing;
