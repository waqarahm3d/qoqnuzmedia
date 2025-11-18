import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  ...props
}: ButtonProps) => {
  const baseStyles = 'rounded-full font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  const variants = {
    primary: 'bg-primary hover:bg-[#ff5c2e] text-black hover:scale-105',
    secondary: 'bg-white/10 hover:bg-white/20 text-white',
    ghost: 'bg-transparent hover:bg-white/10 text-white',
    icon: 'bg-transparent hover:bg-white/10 text-white rounded-full p-2',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const sizeClass = variant === 'icon' ? '' : sizes[size];

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizeClass} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
