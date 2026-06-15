import React from 'react';

export default function ComicBubbleIcon({ size = 40, color = '#718096' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M40 4H8a4 4 0 0 0-4 4v24a4 4 0 0 0 4 4h8l4 8 4-8h16a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4z"
        fill={color}
        opacity="0.15"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text
        x="24"
        y="24"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize="22"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        ?
      </text>
    </svg>
  );
}
