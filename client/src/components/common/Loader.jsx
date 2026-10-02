import { Spinner } from '@heroui/react';

/**
 * Loading indicator built with HeroUI Spinner.
 */
export function Loader({ message = 'Loading…', fullScreen = false, size = 'lg', color = 'primary' }) {
  if (fullScreen) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gray-50/80 backdrop-blur-xs">
        <Spinner size={size} color={color} label={message} classNames={{ label: 'text-sm text-gray-600 font-medium' }} />
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center py-12">
      <Spinner size={size} color={color} label={message} classNames={{ label: 'text-sm text-gray-600 font-medium' }} />
    </div>
  );
}
