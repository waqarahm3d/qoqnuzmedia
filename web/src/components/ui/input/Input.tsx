'use client';

import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Input Component
 *
 * Professional input component with variants and states.
 *
 * @example
 * ```tsx
 * <Input
 *   type="text"
 *   placeholder="Enter text..."
 *   error="This field is required"
 * />
 * ```
 */

const inputVariants = cva(
  'w-full px-4 py-2.5 bg-[var(--qz-bg-surface)] border rounded-lg text-[var(--qz-text-primary)] placeholder:text-[var(--qz-text-tertiary)] transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'border-[var(--qz-border-default)] hover:border-[var(--qz-border-strong)] focus:border-[var(--qz-primary)] focus:ring-2 focus:ring-[var(--qz-primary)]/20',
        error: 'border-[var(--qz-error)] focus:border-[var(--qz-error)] focus:ring-2 focus:ring-[var(--qz-error)]/20',
        success: 'border-[var(--qz-success)] focus:border-[var(--qz-success)] focus:ring-2 focus:ring-[var(--qz-success)]/20',
      },
      size: {
        sm: 'text-sm py-2 px-3',
        md: 'text-base py-2.5 px-4',
        lg: 'text-lg py-3 px-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Label for the input */
  label?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Helper text */
  helperText?: string;
  /** Icon to display before input */
  icon?: React.ReactNode;
  /** Icon to display after input */
  iconRight?: React.ReactNode;
  /** Input wrapper className */
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      label,
      error,
      success,
      helperText,
      icon,
      iconRight,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);
    const hasSuccess = Boolean(success) && !hasError;
    const finalVariant = hasError ? 'error' : hasSuccess ? 'success' : variant;

    return (
      <div className={cn('w-full', wrapperClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-[var(--qz-text-primary)] mb-2"
          >
            {label}
            {props.required && <span className="text-[var(--qz-error)] ml-1">*</span>}
          </label>
        )}

        {/* Input Wrapper */}
        <div className="relative">
          {/* Left Icon */}
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--qz-text-tertiary)]">
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            className={cn(
              inputVariants({ variant: finalVariant, size }),
              icon && 'pl-10',
              iconRight && 'pr-10',
              className
            )}
            {...props}
          />

          {/* Right Icon */}
          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--qz-text-tertiary)]">
              {iconRight}
            </div>
          )}
        </div>

        {/* Helper/Error/Success Text */}
        {(error || success || helperText) && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              hasError && 'text-[var(--qz-error)]',
              hasSuccess && 'text-[var(--qz-success)]',
              !hasError && !hasSuccess && 'text-[var(--qz-text-secondary)]'
            )}
          >
            {error || success || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
