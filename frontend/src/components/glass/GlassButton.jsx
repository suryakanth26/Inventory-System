import React from 'react';

export const GlassButton = ({
  variant = 'default',
  size = 'md',
  icon = false,
  className = '',
  children,
  ...props
}) => {
  const classes = [
    'neu-button',
    variant === 'primary' ? 'neu-button-primary' : '',
    variant === 'success' ? 'neu-button-success' : '',
    variant === 'danger' ? 'neu-button-danger' : '',
    size === 'sm' ? 'neu-button-sm' : '',
    icon ? 'neu-button-icon' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
