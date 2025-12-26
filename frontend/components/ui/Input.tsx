// Text Input Component
// Location: frontend/components/ui/Input.tsx

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, fullWidth = true, className = '', ...props }, ref) => {
    const baseClasses = 'px-4 py-3 rounded-xl border transition-all outline-none';
    const stateClasses = error
      ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-200'
      : 'border-neutral-200 focus:border-[#ccf32f] focus:ring-2 focus:ring-[#ccf32f]/20';
    const disabledClasses = props.disabled ? 'bg-neutral-50 cursor-not-allowed opacity-60' : 'bg-white';
    const widthClasses = fullWidth ? 'w-full' : '';

    return (
      <div className={`${fullWidth ? 'w-full' : ''} space-y-1`}>
        {label && (
          <label className="block text-sm font-medium text-neutral-700">
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`
              ${baseClasses}
              ${stateClasses}
              ${disabledClasses}
              ${widthClasses}
              ${icon ? 'pl-10' : ''}
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <p className="text-sm text-rose-600">{error}</p>
        )}

        {helperText && !error && (
          <p className="text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
