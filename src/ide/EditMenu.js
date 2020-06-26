import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import PropTypes from 'prop-types';
import Tooltip from '../TooltipCustom';

const EditMenu = (props) => {
  const {editIconClasses} = props;
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title="Edit Configs & Variables E">
        <IconButton
          aria-controls="editMenu"
          aria-haspopup="true"
          aria-label="edit menu"
          onClick={handleClick}>
          <EditIcon
            color="primary"
            fontSize="small"
            classes={editIconClasses}
          />
        </IconButton>
      </Tooltip>
      <Menu
        id="editMenu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}>
        <MenuItem onClick={handleClose}>Build Config</MenuItem>
        <MenuItem onClick={handleClose}>Dry Run Config</MenuItem>
        <Divider variant="middle" component="li" />
        <MenuItem onClick={handleClose}>Global Variables</MenuItem>
        <MenuItem onClick={handleClose}>Build Variables</MenuItem>
      </Menu>
    </>
  );
};

EditMenu.propTypes = {
  editIconClasses: PropTypes.shape({
    fontSizeSmall: PropTypes.string,
  }).isRequired,
};

export default EditMenu;
