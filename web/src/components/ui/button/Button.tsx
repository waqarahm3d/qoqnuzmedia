'use client';

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Button Component
 *
 * A professional, accessible button component following the Qoqnuz design system.
 * Supports multiple variants, sizes, and states.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click Me</Button>
 * <Button variant="ghost" size="sm" icon={<PlayIcon />}>Play</Button>
 * ```
 */

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--qz-primary)] text-[var(--qz-primary-fg)] hover:bg-[var(--qz-primary-hover)] active:bg-[var(--qz-primary-active)] hover:scale-105 active:scale-95 shadow-md hover:shadow-lg',
        secondary:
          'bg-[var(--qz-bg-surface)] text-[var(--qz-text-primary)] border border-[var(--qz-border-default)] hover:bg-[var(--qz-bg-surface-hover)] hover:border-[var(--qz-border-strong)]',
        ghost:
          'bg-transparent text-[var(--qz-text-secondary)] hover:bg-[var(--qz-overlay-light)] hover:text-[var(--qz-text-primary)]',
        outline:
          'bg-transparent text-[var(--qz-primary)] border-2 border-[var(--qz-primary)] hover:bg-[var(--qz-primary)] hover:text-[var(--qz-primary-fg)]',
        danger:
          'bg-[var(--qz-error)] text-white hover:opacity-90 active:opacity-80',
        success:
          'bg-[var(--qz-success)] text-white hover:opacity-90 active:opacity-80',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
        xl: 'px-8 py-4 text-xl',
        icon: 'p-2.5',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Content to display inside the button */
  children?: React.ReactNode;
  /** Icon to display before the text */
  icon?: React.ReactNode;
  /** Icon to display after the text */
  iconRight?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      children,
      icon,
      iconRight,
      loading,
      disabled,
      ariaLabel,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, fullWidth, className })}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner size={size === 'sm' ? 'sm' : 'md'} />
            {children && <span className="opacity-70">{children}</span>}
          </>
        ) : (
          <>
            {icon && <span className="inline-flex shrink-0">{icon}</span>}
            {children}
            {iconRight && <span className="inline-flex shrink-0">{iconRight}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Loading Spinner Component
const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export { Button, buttonVariants };
