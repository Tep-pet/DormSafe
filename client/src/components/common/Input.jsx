import { Input as HeroUIInput, Textarea as HeroUITextarea } from '@heroui/react';

/**
 * Text Input component built with HeroUI.
 * Provides accessible labels, clear validation errors, and clean focus states.
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
          label: 'text-xs font-semibold text-gray-700 mb-1',
          inputWrapper:
            'border-gray-300 hover:border-gray-400 focus-within:!border-ateneo-blue bg-white shadow-xs',
          input: 'text-sm text-gray-900',
        }}
        {...props}
      />
    </div>
  );
}

/**
 * Multi-line Textarea component built with HeroUI.
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
          label: 'text-xs font-semibold text-gray-700 mb-1',
          inputWrapper:
            'border-gray-300 hover:border-gray-400 focus-within:!border-ateneo-blue bg-white shadow-xs',
          input: 'text-sm text-gray-900',
        }}
        {...props}
      />
    </div>
  );
}
