import React from 'react';

export default function PulsingGlowBackground() {
  return (
    <div
      // This is our global background, matching the footer
      className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-navy-deepest"
      aria-hidden="true"
    >
      {/* Glow 1 (Cyan) - Smaller and uses new "glow-float-1" animation */}
      <div
        className="absolute left-[10%] top-[10%] w-[500px] h-[500px] bg-cyan-electric rounded-full animate-glow-float-1"
        style={{
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.8) 0%, transparent 60%)',
          animationDelay: '0s',
        }}
      />
      
      {/* Glow 2 (Blue) - Smaller and uses new "glow-float-2" animation */}
      <div
        className="absolute right-[-15%] top-[20%] w-[700px] h-[700px] bg-blue-vibrant rounded-full animate-glow-float-2"
        style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.7) 0%, transparent 60%)',
          animationDelay: '-2s',
        }}
      />
      
      {/* Glow 3 (Cyan-Teal) - Smaller and uses new "glow-float-3" animation */}
      <div
        className="absolute left-[-10%] bottom-[-10%] w-[600px] h-[600px] bg-cyan-teal rounded-full animate-glow-float-3"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.7) 0%, transparent 60%)',
          animationDelay: '-4s',
        }}
      />
    </div>
  );
}