import React from 'react';

export const StomachIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M10 18h4"></path>
    <path d="M6 12h12"></path>
    <path d="M12 6c-4.42 0-8 3.58-8 8v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2c0-4.42-3.58-8-8-8Z"></path>
  </svg>
);