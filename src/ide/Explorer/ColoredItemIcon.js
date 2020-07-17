import React from 'react';
import {makeStyles} from '@material-ui/styles';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import TestIcon from '@material-ui/icons/Title';
import ZwlFileIcon from '../zwlFileIcon';
import VersionIcon from '../newVersionIcon';
import ExplorerItemType from '../Constants';

const useStyle = makeStyles(() => ({
  icon: {
    fontSize: '1rem',
  },
  zwlFileColoredIcon: {
    backgroundColor: '#e2cdfd',
  },
  testColoredIcon: {
    backgroundColor: '#f1e05a',
  },
  versionColoredIcon: {
    backgroundColor: '#89e051',
  },
}));

const ColoredItemIcon = React.memo(({itemType}) => {
  const classes = useStyle();

  let icon;
  switch (itemType) {
    case ExplorerItemType.FILE:
      icon = (
        <ZwlFileIcon
          className={clsx(classes.icon, classes.zwlFileColoredIcon)}
        />
      );
      break;
    case ExplorerItemType.TEST:
      icon = (
        <TestIcon className={clsx(classes.icon, classes.testColoredIcon)} />
      );
      break;
    case ExplorerItemType.VERSION:
      icon = (
        <VersionIcon
          className={clsx(classes.icon, classes.versionColoredIcon)}
        />
      );
      break;
    default:
      throw new Error(`Can't find icon for ${itemType}`);
  }
  return icon;
});

ColoredItemIcon.propTypes = {
  itemType: PropTypes.string.isRequired,
};
