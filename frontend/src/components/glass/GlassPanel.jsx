import React from 'react';

export const GlassPanel = ({
  as: Tag = 'div',
  variant = 'panel',
  liquid = false,
  className = '',
  children,
  ...props
}) => {
  const classes = [
    variant === 'card' ? 'glass-card' : variant === 'elevated' ? 'glass-panel-elevated' : 'glass-panel',
    liquid ? 'liquid-blob' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
};
