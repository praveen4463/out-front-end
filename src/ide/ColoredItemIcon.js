import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import TestIcon from '@material-ui/icons/Title';
import ZwlFileIcon from './zwlFileIcon';
import VersionIcon from './newVersionIcon';
import {ExplorerItemType} from './Constants';

const useStyle = makeStyles((theme) => ({
  icon: {
    fontSize: '1rem',
    marginRight: theme.spacing(0.5),
    color: '#121212',
  },
  zwlFileColoredIcon: {
    backgroundColor: '#945bde',
  },
  testColoredIcon: {
    backgroundColor: '#eed40b',
  },
  versionColoredIcon: {
    backgroundColor: '#66d31f',
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

export default ColoredItemIcon;
