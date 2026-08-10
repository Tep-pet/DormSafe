import { formatWalkingTime } from '../../utils/formatDistance';

export function WalkingTimeBadge({ minutes }) {
  if (minutes == null) return null;
  return (
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">
      🚶 {formatWalkingTime(minutes)}
    </span>
  );
}
