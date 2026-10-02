import { Card, CardBody, Chip, Progress } from '@heroui/react';
import {
  BarChart3,
  Lock,
  Sparkles,
  CreditCard,
  Clock,
} from 'lucide-react';

/**
 * Modern Executive Glass KPI Card.
 * Uses clean vector SVG icons from lucide-react.
 * Follows HeroUI v3 Design Principles (No raw emojis).
 *
 * @param {string} label - Metric label (e.g., "Monthly Revenue", "Occupied Rooms")
 * @param {string|number} value - Primary metric value
 * @param {string} [subtext] - Explanatory helper text or breakdown
 * @param {React.ReactNode} [icon] - Lucide icon component
 * @param {string} [trend] - Highlight chip text (e.g., "85% filled", "+12%")
 * @param {'default'|'occupied'|'vacant'|'revenue'|'pending'|'success'|'danger'} [variant='default']
 * @param {number} [progress] - Percentage (0-100) for optional mini progress bar
 */
export function StatsCard({
  label,
  value,
  subtext,
  icon,
  trend,
  variant = 'default',
  progress,
  className = '',
}) {
  const getTheme = () => {
    switch (variant) {
      case 'occupied':
      case 'danger':
        return {
          iconBg: 'bg-red-50 text-red-600',
          chipColor: 'danger',
          borderHover: 'hover:border-red-200',
          progressColor: 'danger',
          DefaultIcon: Lock,
        };
      case 'vacant':
      case 'success':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600',
          chipColor: 'success',
          borderHover: 'hover:border-emerald-200',
          progressColor: 'success',
          DefaultIcon: Sparkles,
        };
      case 'revenue':
        return {
          iconBg: 'bg-blue-50 text-ateneo-blue',
          chipColor: 'primary',
          borderHover: 'hover:border-blue-200',
          progressColor: 'primary',
          DefaultIcon: CreditCard,
        };
      case 'pending':
        return {
          iconBg: 'bg-amber-50 text-amber-600',
          chipColor: 'warning',
          borderHover: 'hover:border-amber-200',
          progressColor: 'warning',
          DefaultIcon: Clock,
        };
      default:
        return {
          iconBg: 'bg-gray-100 text-gray-700',
          chipColor: 'default',
          borderHover: 'hover:border-gray-300',
          progressColor: 'primary',
          DefaultIcon: BarChart3,
        };
    }
  };

  const theme = getTheme();
  const IconComponent = icon || <theme.DefaultIcon size={16} strokeWidth={2} />;

  return (
    <Card
      shadow="sm"
      className={`rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${theme.borderHover} ${className}`}
    >
      <CardBody className="p-3.5 sm:p-4 flex flex-col justify-between gap-2 text-left">
        {/* Header: Label + Compact Icon Pill */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 line-clamp-1">
            {label}
          </span>
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg font-semibold shadow-2xs ${theme.iconBg}`}
          >
            {IconComponent}
          </div>
        </div>

        {/* Bottom Row: Metric Value + Subtext / Trend Chip */}
        <div className="flex items-baseline justify-between gap-2 pt-0.5">
          <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-none">
            {value}
          </p>

          {(subtext || trend) && (
            <div className="flex items-center gap-1.5 text-right">
              {subtext && (
                <span className="text-[11px] font-medium text-slate-400 line-clamp-1">
                  {subtext}
                </span>
              )}
              {trend && (
                <Chip
                  size="sm"
                  variant="flat"
                  color={theme.chipColor}
                  className="text-[10px] font-bold h-5 px-1.5"
                >
                  {trend}
                </Chip>
              )}
            </div>
          )}
        </div>

        {/* Optional Mini Progress Bar */}
        {typeof progress === 'number' && (
          <div className="w-full pt-1">
            <Progress
              size="sm"
              radius="full"
              value={progress}
              color={theme.progressColor}
              aria-label={label}
              className="max-w-full"
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
