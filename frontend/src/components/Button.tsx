import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  iconButton?: boolean;
  iconPrimary?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    iconButton = false,
    iconPrimary = false,
    loading = false,
    fullWidth = false,
    children,
    icon,
    className = '',
    disabled,
    ...props
  }, ref) => {
    const classes = [
      'btn',
      `btn-${variant}`,
      size && `btn-${size}`,
      iconButton && 'btn-icon',
      iconButton && iconPrimary && 'btn-icon-primary',
      loading && 'btn-loading',
      fullWidth && 'btn-full',
      className
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {icon && <span className="btn-icon-slot">{icon}</span>}
        {children && !iconButton && <span className="btn-text">{children}</span>}
        {!icon && !children && iconButton && null}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
