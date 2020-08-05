import React, {useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import {truncate} from 'lodash-es';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import clsx from 'clsx';
import {IdeDispatchContext} from '../Contexts';
import {EDR_CLOSE_TAB, EDR_DBL_CLICK_TAB} from '../actionTypes';

const useStyle = makeStyles((theme) => ({
  temporaryTab: {
    fontStyle: 'italic',
  },
  tabText: {
    userSelect: 'none',
    color: theme.palette.text.primary,
    opacity: theme.textOpacity.mediumEmphasis,
  },
  closeIconSize: {
    fontSize: '1rem',
  },
  closeIcon: {
    marginLeft: theme.spacing(0.5),
    opacity: 0,
    '&:hover': {
      opacity: theme.textOpacity.highEmphasis,
    },
  },
}));

const TabContent = React.memo(
  ({versionId, versionName, temporary, testName, fileName}) => {
    const dispatch = useContext(IdeDispatchContext);
    const classes = useStyle();

    const closeHandler = () => {
      dispatch({type: EDR_CLOSE_TAB, payload: {versionId}});
    };

    const dblClickHandler = () => {
      if (!temporary) {
        return;
      }
      dispatch({type: EDR_DBL_CLICK_TAB, payload: {versionId}});
    };

    const getTabText = () => {
      const maxTestText = 25;
      const maxVersionText = 6;
      const testText = truncate(testName, {
        length: maxTestText,
        omission: '..',
      });
      const versionText = truncate(versionName, {
        length: maxVersionText,
        omission: '..',
      });
      return `${testText}/${versionText}`;
    };

    const getTabTitle = () => {
      return `${fileName}/${testName}/${versionName}`;
    };

    return (
      <Box
        display="flex"
        alignItems="center"
        px={0.5}
        onDoubleClick={dblClickHandler}
        title={getTabTitle()}>
        <Box flex={1}>
          <Typography
            variant="caption"
            className={clsx(
              temporary && classes.temporaryTab,
              classes.tabText
            )}>
            {getTabText()}
          </Typography>
        </Box>
        <CloseIcon
          fontSize="small"
          classes={{fontSizeSmall: classes.closeIconSize}}
          className={classes.closeIcon}
          onClick={closeHandler}
          title="Close"
        />
      </Box>
    );
  }
);

TabContent.propTypes = {
  versionId: PropTypes.number.isRequired,
  versionName: PropTypes.string.isRequired,
  temporary: PropTypes.bool.isRequired,
  testName: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
};

export default TabContent;
