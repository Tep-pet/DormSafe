import React from 'react';
import { Input as HeroUIInput, Textarea as HeroUITextarea } from '@heroui/react';
import { ChevronDown } from 'lucide-react';

/**
 * Text Input component built with HeroUI.
 * Provides accessible labels, clear validation errors, and clean focus states.
 * Standardized to h-10, rounded-xl, and slate color tokens.
 */
export function Input({
  label,
  id,
  error,
  type = 'text',
  className = '',
  value,
  onChange,
  placeholder,
  required = false,
  isDisabled = false,
  disabled = false,
  ...props
}) {
  return (
    <div className={className}>
      <HeroUIInput
        id={id}
        label={label}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isRequired={required}
        isDisabled={disabled || isDisabled}
        isInvalid={Boolean(error)}
        errorMessage={error}
        variant="bordered"
        radius="lg"
        labelPlacement="outside"
        classNames={{
          label: 'text-xs font-semibold text-slate-700 mb-1',
          inputWrapper:
            'h-10 rounded-xl border border-slate-200/90 hover:border-slate-300 focus-within:!border-ateneo-blue bg-white shadow-2xs transition-colors',
          input: 'text-xs sm:text-sm text-slate-900 placeholder:text-slate-400',
        }}
        {...props}
      />
    </div>
  );
}

/**
 * Multi-line Textarea component built with HeroUI.
 * Standardized to rounded-xl, slate color tokens, and Ateneo Blue focus states.
 */
export function Textarea({
  label,
  id,
  error,
  className = '',
  value,
  onChange,
  placeholder,
  required = false,
  minRows = 3,
  maxRows = 6,
  isDisabled = false,
  disabled = false,
  ...props
}) {
  return (
    <div className={className}>
      <HeroUITextarea
        id={id}
        label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isRequired={required}
        isDisabled={disabled || isDisabled}
        isInvalid={Boolean(error)}
        errorMessage={error}
        minRows={minRows}
        maxRows={maxRows}
        variant="bordered"
        radius="lg"
        labelPlacement="outside"
        classNames={{
          label: 'text-xs font-semibold text-slate-700 mb-1',
          inputWrapper:
            'rounded-xl border border-slate-200/90 hover:border-slate-300 focus-within:!border-ateneo-blue bg-white shadow-2xs transition-colors',
          input: 'text-xs sm:text-sm text-slate-900 placeholder:text-slate-400',
        }}
        {...props}
      />
    </div>
  );
}

/**
 * Standard Select component with consistent DormSafe styling.
 * Matches Input styling: h-10, rounded-xl, slate palette, focus ring, and clean Lucide chevron.
 * Accepts either an `options` prop array ([{ value, label }]) or standard <option> children.
 */
export function Select({
  label,
  id,
  error,
  helperText,
  className = '',
  selectClassName = '',
  value,
  onChange,
  options,
  placeholder,
  required = false,
  isDisabled = false,
  disabled = false,
  children,
  ...props
}) {
  const isOff = disabled || isDisabled;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative w-full">
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={isOff}
          required={required}
          className={`h-10 w-full appearance-none rounded-xl border bg-white pl-3 pr-8 text-xs font-medium text-slate-800 shadow-2xs transition-all cursor-pointer focus:border-ateneo-blue focus:outline-hidden focus:ring-2 focus:ring-ateneo-blue/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50 ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200/90 hover:border-slate-300'
          } ${selectClassName}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
      {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
      {!error && helperText && <span className="text-xs text-slate-500">{helperText}</span>}
    </div>
  );
}
