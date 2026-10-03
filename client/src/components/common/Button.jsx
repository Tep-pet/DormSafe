import { Button as HeroUIButton } from '@heroui/react';

/**
 * Semantic Button component built with HeroUI.
 * Follows HeroUI v3 Design Principle 1: Semantic Intent Over Visual Style.
 *
 * @param {'primary' | 'secondary' | 'outline' | 'bordered' | 'tertiary' | 'ghost' | 'light' | 'danger' | 'danger-outline' | 'success'} variant - Semantic action hierarchy
 * @param {'sm' | 'md' | 'lg'} size - Component sizing
 */
export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  radius = 'full',
  className = '',
  disabled = false,
  isDisabled = false,
  isLoading = false,
  onClick,
  onPress,
  startContent,
  endContent,
  ...props
}) {
  const isButtonDisabled = disabled || isDisabled;

  // Map semantic variants to HeroUI color & variant
  const getVariantProps = () => {
    switch (variant) {
      case 'primary':
        return {
          color: 'primary',
          variant: 'solid',
        };
      case 'secondary':
        return {
          color: 'primary',
          variant: 'bordered',
        };
      case 'outline':
      case 'bordered':
        return {
          color: 'default',
          variant: 'bordered',
        };
      case 'tertiary':
      case 'ghost':
      case 'light':
        return {
          color: 'default',
          variant: 'light',
        };
      case 'danger':
        return {
          color: 'danger',
          variant: 'flat',
        };
      case 'danger-outline':
        return {
          color: 'danger',
          variant: 'bordered',
        };
      case 'success':
        return {
          color: 'success',
          variant: 'flat',
        };
      default:
        return {
          color: 'primary',
          variant: 'solid',
        };
    }
  };

  const { color, variant: herouiVariant } = getVariantProps();

  return (
    <HeroUIButton
      type={type}
      color={color}
      variant={herouiVariant}
      size={size}
      radius={radius}
      isDisabled={isButtonDisabled}
      isLoading={isLoading}
      onPress={onPress || onClick}
      startContent={startContent}
      endContent={endContent}
      className={`font-semibold shadow-xs transition-transform active:scale-95 ${className}`.trim()}
      {...props}
    >
      {children}
    </HeroUIButton>
  );
}
