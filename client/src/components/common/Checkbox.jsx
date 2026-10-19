import React from 'react';
import {
  Checkbox as HeroUICheckbox,
  CheckboxGroup as HeroUICheckboxGroup,
} from '@heroui/react';

/**
 * Standardized Checkbox component built with HeroUI.
 * Matches the official typography and styling of Radio controls:
 * - Label: text-sm font-semibold text-slate-900
 * - Description: text-xs text-slate-500 font-normal mt-0.5
 * - Interactive tile: rounded-2xl with subtle hover transition
 */
export function Checkbox({
  children,
  description,
  value,
  color = 'primary',
  size = 'md',
  radius = 'md',
  className = '',
  classNames = {},
  ...props
}) {
  return (
    <HeroUICheckbox
      value={value}
      color={color}
      size={size}
      radius={radius}
      className={`max-w-full m-0 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer ${className}`.trim()}
      classNames={{
        base: 'max-w-full m-0 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer',
        label: 'text-sm font-semibold text-slate-900',
        description: 'text-xs text-slate-500 font-normal mt-0.5',
        wrapper: 'rounded-lg',
        ...classNames,
      }}
      {...props}
    >
      <div>
        <span className="text-sm font-semibold text-slate-900 leading-none">
          {children}
        </span>
        {description && (
          <p className="text-xs text-slate-500 font-normal mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </HeroUICheckbox>
  );
}

export function CheckboxGroup({
  label,
  description,
  children,
  color = 'primary',
  className = '',
  classNames = {},
  ...props
}) {
  return (
    <HeroUICheckboxGroup
      label={label}
      description={description}
      color={color}
      className={className}
      classNames={{
        label: 'text-xs font-semibold text-slate-700 mb-2',
        description: 'text-xs text-slate-400 mt-1',
        ...classNames,
      }}
      {...props}
    >
      {children}
    </HeroUICheckboxGroup>
  );
}
