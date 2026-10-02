import { Button as HeroUIButton } from '@heroui/react';

/**
 * Semantic Button component built with HeroUI.
 * Follows HeroUI v3 Design Principle 1: Semantic Intent Over Visual Style.
 *
 * @param {'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger'} variant - Semantic action hierarchy
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
      case 'tertiary':
      case 'ghost':
        return {
          color: 'default',
          variant: 'light',
        };
      case 'danger':
        return {
          color: 'danger',
          variant: 'flat',
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
