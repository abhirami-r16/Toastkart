import React from 'react';

export default function ToastKartSquareLogo({ className = "", style = {}, width = 200, height = 200, ...rest }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox={rest.viewBox || "0 0 200 200"}
      width={width} 
      height={height} 
      className={className}
      style={style}
      {...rest}
    >
      {/* Outer Circle */}
      <circle cx="100" cy="100" r="95" fill="none" stroke="#FF5722" strokeWidth="6" />
      
      <g transform="translate(0, -15)">
        {/* Cart Body */}
        <path 
          d="M35 55 L55 55 L75 110 L145 110 L155 70 L70 70" 
          fill="none" 
          stroke="#FF5722" 
          strokeWidth="14" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Wheels */}
        <circle cx="85" cy="135" r="11" fill="#1C2841" />
        <circle cx="135" cy="135" r="11" fill="#1C2841" />
      </g>
      
      {/* Text "ToastKart" */}
      <text x="100" y="160" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="34" textAnchor="middle" letterSpacing="-0.5">
        <tspan fill="#1C2841">Toast</tspan>
        <tspan fill="#FF5722">Kart</tspan>
      </text>
    </svg>
  );
}
