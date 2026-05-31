import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[96vw]'
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        <div className={`
          relative w-full ${sizes[size]} bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-2xl shadow-xl
          transform transition-all animate-fadeIn
        `}>
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-slate-100 truncate">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
            </button>
          </div>
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
