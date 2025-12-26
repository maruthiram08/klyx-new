// Select Dropdown Component
// Location: frontend/components/ui/Select.tsx

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, fullWidth = true, className = '', ...props }, ref) => {
    const baseClasses = 'px-4 py-3 rounded-xl border transition-all outline-none appearance-none pr-10';
    const stateClasses = error
      ? 'border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-200'
      : 'border-neutral-200 focus:border-[#ccf32f] focus:ring-2 focus:ring-[#ccf32f]/20';
    const disabledClasses = props.disabled ? 'bg-neutral-50 cursor-not-allowed opacity-60' : 'bg-white cursor-pointer';
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
          <select
            ref={ref}
            className={`
              ${baseClasses}
              ${stateClasses}
              ${disabledClasses}
              ${widthClasses}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
            <ChevronDown size={20} />
          </div>
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

Select.displayName = 'Select';
