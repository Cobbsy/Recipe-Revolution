import React from 'react';

export const WandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M15 4V2" />
    <path d="M15 16v-2" />
    <path d="M12.34 10.66 10 13l-1.06-1.06a2 2 0 0 0-2.83 0L4 14" />
    <path d="m14 4 3 3" />
    <path d="M3 21 9 15" />
    <path d="M12 3h.01" />
    <path d="M21 12v.01" />
    <path d="M12 21h.01" />
    <path d="M3 12h.01" />
    <path d="m21 3-3 3" />
    <path d="M21 15h-2" />
    <path d="M9 3v2" />
  </svg>
);