import { Chip } from '@heroui/react';

/**
 * Status Badge / Chip component built with HeroUI.
 * Displays semantic status (verified, pending, occupied, vacant).
 */
const COLOR_MAP = {
  verified: 'success',
  vacant: 'success',
  pending: 'warning',
  occupied: 'danger',
  danger: 'danger',
  primary: 'primary',
  default: 'default',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  startContent,
  endContent,
  ...props
}) {
  const color = COLOR_MAP[variant] || 'default';

  return (
    <Chip
      size={size}
      color={color}
      variant="flat"
      radius="full"
      startContent={startContent}
      endContent={endContent}
      className={`font-semibold capitalize tracking-wide text-xs ${className}`.trim()}
      {...props}
    >
      {children}
    </Chip>
  );
}
