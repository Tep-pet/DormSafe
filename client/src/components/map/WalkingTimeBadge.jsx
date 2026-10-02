import { Chip } from '@heroui/react';
import { Footprints } from 'lucide-react';
import { formatWalkingTime } from '../../utils/formatDistance';

export function WalkingTimeBadge({ minutes, size = 'sm' }) {
  if (minutes == null) return null;

  const isVeryClose = minutes <= 5;
  const isModerate = minutes <= 15;

  return (
    <Chip
      size={size}
      variant="flat"
      color={isVeryClose ? 'success' : isModerate ? 'primary' : 'warning'}
      radius="full"
      startContent={<Footprints size={12} strokeWidth={2.2} className="mr-0.5" />}
      className="font-bold text-xs shadow-2xs"
    >
      {formatWalkingTime(minutes)}
    </Chip>
  );
}
