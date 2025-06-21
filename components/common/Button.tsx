
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  // className?: string; // Removed: Already part of React.ButtonHTMLAttributes
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyle = "font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150";
  
  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-hnai-teal-600 hover:bg-hnai-teal-700 text-white focus:ring-hnai-teal-500';
      break;
    case 'secondary':
      variantStyle = 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100 focus:ring-slate-500';
      break;
    case 'danger':
      variantStyle = 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
      break;
    case 'ghost':
      variantStyle = 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-hnai-teal-600 dark:text-hnai-teal-400 focus:ring-hnai-teal-500';
      break;
  }

  let sizeStyle = '';
  switch (size) {
    case 'sm':
      sizeStyle = 'px-3 py-1.5 text-sm';
      break;
    case 'md':
      sizeStyle = 'px-4 py-2 text-base';
      break;
    case 'lg':
      sizeStyle = 'px-6 py-3 text-lg';
      break;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className} inline-flex items-center justify-center`}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;
