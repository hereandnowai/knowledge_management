
import React, { ReactNode } from 'react';
import { XMarkIcon } from '../../constants';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  let sizeClasses = '';
  switch (size) {
    case 'sm': sizeClasses = 'max-w-sm'; break;
    case 'md': sizeClasses = 'max-w-md'; break;
    case 'lg': sizeClasses = 'max-w-lg'; break;
    case 'xl': sizeClasses = 'max-w-xl'; break;
    case 'full': sizeClasses = 'max-w-full w-full h-full'; break; // Ensure w-full for full size
    default: sizeClasses = 'max-w-md';
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl ${sizeClasses} w-full flex flex-col ${size === 'full' ? 'h-full max-h-full' : 'max-h-[90vh]'}`}>
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto flex-grow"> {/* Added flex-grow */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
