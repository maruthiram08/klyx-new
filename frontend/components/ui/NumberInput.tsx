// Number/Currency Input Component
// Location: frontend/components/ui/NumberInput.tsx

import React, { useState, useEffect } from 'react';
import { IndianRupee, Percent } from 'lucide-react';
import { Input, InputProps } from './Input';

export interface NumberInputProps extends Omit<InputProps, 'type' | 'value' | 'onChange'> {
  value: number | string;
  onChange: (value: number) => void;
  variant?: 'currency' | 'percentage' | 'number';
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({
    value,
    onChange,
    variant = 'number',
    min,
    max,
    step = 1,
    decimals = 0,
    ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Format number for display when not focused
    useEffect(() => {
      if (!isFocused && value !== '') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(numValue)) {
          if (variant === 'currency') {
            // Format as Indian number system
            setDisplayValue(numValue.toLocaleString('en-IN', {
              maximumFractionDigits: decimals,
              minimumFractionDigits: 0
            }));
          } else if (variant === 'percentage') {
            setDisplayValue(numValue.toFixed(decimals));
          } else {
            setDisplayValue(numValue.toString());
          }
        } else {
          setDisplayValue('');
        }
      }
    }, [value, isFocused, variant, decimals]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Show raw number when focused
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      setDisplayValue(isNaN(numValue) ? '' : numValue.toString());
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty value
      if (inputValue === '') {
        setDisplayValue('');
        onChange(0);
        return;
      }

      // Remove non-numeric characters except decimal point
      const cleaned = inputValue.replace(/[^0-9.]/g, '');

      // Prevent multiple decimal points
      const parts = cleaned.split('.');
      const sanitized = parts.length > 2
        ? parts[0] + '.' + parts.slice(1).join('')
        : cleaned;

      // Parse to number
      const numValue = parseFloat(sanitized);

      if (!isNaN(numValue)) {
        // Apply min/max constraints
        let finalValue = numValue;
        if (min !== undefined && finalValue < min) finalValue = min;
        if (max !== undefined && finalValue > max) finalValue = max;

        setDisplayValue(sanitized);
        onChange(finalValue);
      }
    };

    // Determine icon
    let icon: React.ReactNode = undefined;
    if (variant === 'currency') {
      icon = <IndianRupee size={18} />;
    } else if (variant === 'percentage') {
      icon = <Percent size={18} />;
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        icon={icon}
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';
