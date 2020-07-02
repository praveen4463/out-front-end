import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';
import Fade from '@material-ui/core/Fade';
import PropTypes from 'prop-types';

const TooltipCustom = (props) => {
  const {title, placement, children} = props;
  return (
    <Tooltip
      title={title}
      TransitionComponent={Fade}
      arrow
      placement={placement}>
      {children}
    </Tooltip>
  );
};

TooltipCustom.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  placement: PropTypes.string,
};

TooltipCustom.defaultProps = {
  placement: 'bottom',
};

export default TooltipCustom;
