import React from 'react';

interface WaveformProps {
  className?: string;
  // We remove the 'animated' prop, as it will now be animated by default
}

export default function Waveform({ className = "" }: WaveformProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <svg
        // TWEAK: Hardcode the animation classes directly.
        // We removed the ternary logic.
        className={`w-full h-full waveform-float waveform-pulse`}
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main waveform path */}
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#00d4ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Main waveform */}
        <path
          d="M0,200 Q150,150 300,200 T600,200 T900,200 T1200,200"
          fill="none"
          stroke="url(#waveGradient)"
          strokeWidth="3"
          filter="url(#glow)"
          className="drop-shadow-[0_0_30px_rgba(0,212,255,0.6)] drop-shadow-[0_0_60px_rgba(0,212,255,0.4)] drop-shadow-[0_0_90px_rgba(0,212,255,0.2)]"
        />
        
        {/* Secondary waveform lines */}
        <path
          d="M0,180 Q200,130 400,180 T800,180 T1200,180"
          fill="none"
          stroke="#00d4ff"
          strokeWidth="2"
          opacity="0.6"
          filter="url(#glow)"
          className="drop-shadow-[0_0_20px_rgba(0,212,255,0.3)]"
        />
        
        <path
          d="M0,220 Q250,270 500,220 T1000,220 T1200,220"
          fill="none"
          stroke="#00d4ff"
          strokeWidth="2"
          opacity="0.5"
          filter="url(#glow)"
          className="drop-shadow-[0_0_15px_rgba(0,212,255,0.2)]"
        />
        
        {/* Background signal lines */}
        <path
          d="M0,150 Q300,100 600,150 T1200,150"
          fill="none"
          stroke="#00d4ff"
          strokeWidth="1"
          opacity="0.3"
          filter="url(#glow)"
        />
        
        <path
          d="M0,250 Q350,300 700,250 T1200,250"
          fill="none"
          stroke="#00d4ff"
          strokeWidth="1"
          opacity="0.3"
          filter="url(#glow)"
        />
      </svg>
    </div>
  );
}