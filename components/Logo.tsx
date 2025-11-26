
import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Scissors Logo */}
      <defs>
        <linearGradient id="grad-blade" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#d1d5db' }} />
          <stop offset="100%" style={{ stopColor: '#9ca3af' }} />
        </linearGradient>
        <linearGradient id="grad-handle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#10b981' }} />
          <stop offset="100%" style={{ stopColor: '#059669' }} />
        </linearGradient>
        <filter id="drop-shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="2" dy="2" result="offsetblur"/>
          <feFlood floodColor="#000000" floodOpacity="0.3"/>
          <feComposite in2="offsetblur" operator="in"/>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g transform="rotate(-30 50 50)" filter="url(#drop-shadow)">
        {/* Handle 1 */}
        <circle cx="30" cy="30" r="15" fill="url(#grad-handle)" />
        <circle cx="30" cy="30" r="8" fill="#1f2937" />
        
        {/* Blade 1 */}
        <polygon points="42,42 85,85 90,80" fill="url(#grad-blade)" />
        
        {/* Handle 2 */}
        <circle cx="70" cy="30" r="15" fill="url(#grad-handle)" />
        <circle cx="70" cy="30" r="8" fill="#1f2937" />

        {/* Blade 2 */}
        <polygon points="58,42 15,85 10,80" fill="url(#grad-blade)" />

        {/* Pivot */}
        <circle cx="50" cy="50" r="5" fill="#e5e7eb" />
      </g>
    </svg>
  );
};
