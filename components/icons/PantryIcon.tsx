import React from 'react';

export const PantryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M3 3h18v4H3zM4 7v14h16V7" />
    <path d="M8 12h2" />
    <path d="M14 12h2" />
    <path d="M4 7l2-3h12l2 3" />
  </svg>
);
