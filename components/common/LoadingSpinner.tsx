
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string; // Tailwind color class e.g. 'text-blue-500'
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'text-hnai-teal-500', text }) => {
  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = 'w-6 h-6 border-2';
      break;
    case 'md':
      sizeClasses = 'w-8 h-8 border-[3px]';
      break;
    case 'lg':
      sizeClasses = 'w-12 h-12 border-4';
      break;
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={`animate-spin rounded-full border-solid border-current border-r-transparent ${sizeClasses} ${color}`}
        role="status"
        aria-label="loading"
      />
      {text && <p className="text-sm text-slate-600 dark:text-slate-400">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
    