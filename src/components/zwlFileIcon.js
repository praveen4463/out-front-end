import React from 'react';
import SvgIcon from '@material-ui/core/SvgIcon';

const ZwlFileIcon = (props) => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <SvgIcon {...props}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none">
      <rect width="24" height="24" fill="#945BDE" />
      <path
        d="M4.33179 16.5779H7.56055V18H2.07959V16.9258L5.18628 12.8242H2.17114V11.396H7.46289V12.4397L4.33179 16.5779ZM14.6587 15.6013L15.5254 11.396H17.2283L15.5437 18H14.0667L12.8154 13.8435L11.5642 18H10.0933L8.40869 11.396H10.1116L10.9722 15.5952L12.1807 11.396H13.4563L14.6587 15.6013ZM20.2188 18H18.4487V8.625H20.2188V18Z"
        fill="black"
      />
    </svg>
  </SvgIcon>
);

export default ZwlFileIcon;
