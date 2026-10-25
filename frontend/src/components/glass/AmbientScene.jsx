import React from 'react';

export const AmbientScene = () => (
  <div className="ambient-scene" aria-hidden="true">
    <div className="bloom bloom-blue" />
    <div className="bloom bloom-violet" />
    <div className="bloom bloom-rose" />
    <div className="organic organic-1" />
    <div className="organic organic-2" />
    <div className="organic organic-3" />
    <svg className="glass-svg-defs" width="0" height="0">
      <filter id="liquid-refract" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  </div>
);
