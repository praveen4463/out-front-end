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
import Tab from './model';

const useStyle = makeStyles((theme) => ({
  root: {
    color: theme.palette.text.primary,
    userSelect: 'none',
  },
  temporaryTab: {
    fontStyle: 'italic',
  },
  tabText: {
    opacity: theme.textOpacity.mediumEmphasis,
    '&:hover': {
      opacity: theme.textOpacity.highEmphasis,
    },
  },
  tabTextSelected: {
    opacity: theme.textOpacity.highEmphasis,
  },
  closeIconSize: {
    fontSize: '0.9rem',
  },
  closeIcon: {
    marginLeft: theme.spacing(0.5),
  },
}));

const TabContent = React.memo(({tab, versionName, testName, fileName}) => {
  const dispatch = useContext(IdeDispatchContext);
  const classes = useStyle();

  const closeHandler = (e) => {
    e.stopPropagation();
    dispatch({type: EDR_CLOSE_TAB, payload: {versionId: tab.versionId}});
  };

  const dblClickHandler = (e) => {
    e.stopPropagation();
    if (!tab.temporary) {
      return;
    }
    dispatch({type: EDR_DBL_CLICK_TAB, payload: {versionId: tab.versionId}});
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
      onDoubleClick={dblClickHandler}
      className={clsx(
        classes.root,
        tab.selected ? classes.tabTextSelected : classes.tabText
      )}
      data-testid="tabContainer">
      <Box flex={1} title={getTabTitle()} data-testid="tab">
        <Typography
          variant="caption"
          className={clsx(tab.temporary && classes.temporaryTab)}>
          {getTabText()}
        </Typography>
      </Box>
      <CloseIcon
        fontSize="small"
        classes={{fontSizeSmall: classes.closeIconSize}}
        className={classes.closeIcon}
        onClick={closeHandler}
        titleAccess="Close"
        data-testid="closeIcon"
      />
    </Box>
  );
});

TabContent.propTypes = {
  tab: PropTypes.instanceOf(Tab).isRequired,
  versionName: PropTypes.string.isRequired,
  testName: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired,
};

export default TabContent;
