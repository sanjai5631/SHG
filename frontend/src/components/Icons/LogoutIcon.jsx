import React from 'react';

const LogoutIcon = ({ size = 32, color = '#7AC142' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path 
      d="M21 23V25C21 26.1046 20.1046 27 19 27H7C5.89543 27 5 26.1046 5 25V7C5 5.89543 5.89543 5 7 5H19C20.1046 5 21 5.89543 21 7V9" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M27 16L16 16M27 16L23 12M27 16L23 20" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default LogoutIcon;
