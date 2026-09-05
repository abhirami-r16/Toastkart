import React from 'react';

export default function ToastKartLogo({ className = "", style = {}, width = 240, height = 48, ...rest }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox={rest.viewBox || "0 0 600 120"}
      width={width} 
      height={height} 
      className={className}
      style={style}
      {...rest}
    >
      <g transform="translate(10, 5)">
        {/* Cart Body */}
        <path 
          d="M10 20 L30 20 L50 75 L120 75 L130 35 L45 35" 
          fill="none" 
          stroke="#FF5722" 
          strokeWidth="14" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Wheels */}
        <circle cx="60" cy="100" r="11" fill="#1C2841" />
        <circle cx="110" cy="100" r="11" fill="#1C2841" />
      </g>
      
      {/* Text "ToastKart" */}
      <text x="160" y="80" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="72" textAnchor="start" letterSpacing="-1.5">
        <tspan fill="#1C2841">Toast</tspan>
        <tspan fill="#FF5722">Kart</tspan>
      </text>
    </svg>
  );
}
