import React from 'react';

export const GlassInput = ({ className = '', ...props }) => (
  <input className={`neu-input ${className}`.trim()} {...props} />
);
