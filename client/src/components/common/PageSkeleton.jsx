import { Card, CardBody, CardFooter } from '@heroui/react';

/**
 * Universal Dynamic Shimmering Page Skeleton Loader.
 * Single component system with smooth linear wave animations.
 *
 * @param {'dashboard' | 'grid' | 'table' | 'detail' | 'form' | 'kpi'} [variant='dashboard'] - Layout archetype
 * @param {number} [count=4] - Item count for grids or KPI lists
 * @param {number} [rows=5] - Row count for tables
 * @param {number} [cols=5] - Column count for tables
 * @param {string} [className=''] - Optional container class overrides
 */
export function PageSkeleton({
  variant = 'dashboard',
  count = 4,
  rows = 5,
  cols = 5,
  className = '',
}) {
  switch (variant) {
    case 'dashboard':
      return <DashboardSkeleton count={count} className={className} />;
    case 'grid':
    case 'cards':
      return <GridSkeleton count={count} className={className} />;
    case 'table':
      return <TableSkeleton rows={rows} cols={cols} className={className} />;
    case 'detail':
      return <DetailSkeleton className={className} />;
    case 'form':
      return <FormSkeleton className={className} />;
    case 'kpi':
      return <KPISkeleton count={count} className={className} />;
    default:
      return <DashboardSkeleton count={count} className={className} />;
  }
}

/** Shimmering pulse block primitive */
function Shimmer({ className = '' }) {
  return (
    <div
      className={`animate-shimmer-wave bg-gray-200/80 rounded-lg ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// 1. KPI Card Skeletons
// ---------------------------------------------------------------------------
function KPISkeleton({ count = 4, className = '' }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-${Math.min(count, 4)} ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          shadow="sm"
          className="rounded-2xl border border-slate-200/90 bg-white"
        >
          <CardBody className="p-3.5 sm:p-4 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between gap-2">
              <Shimmer className="h-3 w-24 rounded-md" />
              <Shimmer className="h-7 w-7 rounded-lg" />
            </div>
            <div className="flex items-baseline justify-between gap-2 pt-0.5">
              <Shimmer className="h-6 w-16 rounded-lg" />
              <Shimmer className="h-3.5 w-20 rounded-md" />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Dashboard Archetype Skeleton
// ---------------------------------------------------------------------------
function DashboardSkeleton({ count = 4, className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top action button placeholder */}
      <div className="flex justify-end">
        <Shimmer className="h-9 w-36 rounded-xl" />
      </div>

      {/* KPI Cards Row */}
      <KPISkeleton count={count} />

      {/* Banner / Secondary Card */}
      <Card shadow="sm" className="rounded-2xl border border-gray-100 bg-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Shimmer className="h-3.5 w-32 rounded-md" />
            <Shimmer className="h-5 w-64 rounded-lg" />
            <Shimmer className="h-3 w-48 rounded-md" />
          </div>
          <Shimmer className="h-10 w-32 rounded-xl" />
        </div>
      </Card>

      {/* Secondary Table / Grid Preview */}
      <Card shadow="sm" className="rounded-2xl border border-gray-100 bg-white p-6">
        <Shimmer className="h-5 w-40 rounded-lg mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <Shimmer className="h-4 w-4 rounded-full" />
                <Shimmer className="h-4 w-48 rounded-md" />
              </div>
              <Shimmer className="h-4 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Grid / Listings Search Skeleton
// ---------------------------------------------------------------------------
function GridSkeleton({ count = 6, className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filter Bar */}
      <Card shadow="sm" className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Shimmer className="h-3 w-20 rounded-md" />
              <Shimmer className="h-9 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </Card>

      {/* Cards Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <Card
            key={i}
            shadow="sm"
            className="w-full rounded-2xl border border-gray-200 bg-white overflow-hidden"
          >
            {/* Image Placeholder */}
            <Shimmer className="h-48 w-full rounded-none" />

            <CardBody className="p-4 pb-2 space-y-2">
              <Shimmer className="h-5 w-3/4 rounded-lg" />
              <Shimmer className="h-3.5 w-full rounded-md" />
            </CardBody>

            <CardFooter className="flex items-center justify-between p-4 pt-2 border-t border-gray-100">
              <div className="space-y-1">
                <Shimmer className="h-2.5 w-16 rounded-md" />
                <Shimmer className="h-4 w-24 rounded-lg" />
              </div>
              <Shimmer className="h-6 w-20 rounded-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Table Archetype Skeleton
// ---------------------------------------------------------------------------
function TableSkeleton({ rows = 5, cols = 5, className = '' }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <Card shadow="sm" className="rounded-2xl border border-gray-100 bg-white overflow-hidden p-0">
        {/* Table Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-6 py-4">
          <Shimmer className="h-4 w-32 rounded-md" />
          <Shimmer className="h-8 w-24 rounded-xl" />
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/40 px-6 py-3">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="col-span-2">
              <Shimmer className="h-3 w-16 rounded-md" />
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="grid grid-cols-12 items-center gap-4 px-6 py-4">
              <div className="col-span-3">
                <Shimmer className="h-4 w-3/4 rounded-md" />
              </div>
              <div className="col-span-3">
                <Shimmer className="h-4 w-2/3 rounded-md" />
              </div>
              <div className="col-span-2">
                <Shimmer className="h-4 w-16 rounded-md" />
              </div>
              <div className="col-span-2">
                <Shimmer className="h-5 w-16 rounded-full" />
              </div>
              <div className="col-span-2 flex justify-end">
                <Shimmer className="h-7 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Property Detail Archetype Skeleton
// ---------------------------------------------------------------------------
function DetailSkeleton({ className = '' }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Shimmer className="h-7 w-64 rounded-xl" />
          <Shimmer className="h-4 w-96 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-9 w-24 rounded-xl" />
          <Shimmer className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      {/* Main Grid: Left Gallery/Info, Right Inquiry Card */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Image Hero + Rooms */}
        <div className="space-y-6 lg:col-span-2">
          <Card shadow="sm" className="rounded-2xl border border-gray-200 overflow-hidden">
            <Shimmer className="h-80 w-full rounded-none" />
          </Card>

          <Card shadow="sm" className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <Shimmer className="h-5 w-32 rounded-lg" />
            <Shimmer className="h-4 w-full rounded-md" />
            <Shimmer className="h-4 w-5/6 rounded-md" />
            <Shimmer className="h-4 w-4/6 rounded-md" />
          </Card>
        </div>

        {/* Right 1 Col: Contact / Inquiry Card + Map */}
        <div className="space-y-6">
          <Card shadow="sm" className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <Shimmer className="h-5 w-28 rounded-lg" />
            <Shimmer className="h-4 w-full rounded-md" />
            <Shimmer className="h-4 w-3/4 rounded-md" />
            <Shimmer className="h-10 w-full rounded-xl mt-4" />
          </Card>

          <Card shadow="sm" className="rounded-2xl border border-gray-200 overflow-hidden">
            <Shimmer className="h-48 w-full rounded-none" />
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. Form Archetype Skeleton
// ---------------------------------------------------------------------------
function FormSkeleton({ className = '' }) {
  return (
    <Card shadow="sm" className={`max-w-xl mx-auto rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 ${className}`}>
      <div className="space-y-5">
        <Shimmer className="h-6 w-40 rounded-lg mb-2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Shimmer className="h-3 w-24 rounded-md" />
            <Shimmer className="h-10 w-full rounded-xl" />
          </div>
        ))}
        <Shimmer className="h-10 w-full rounded-xl mt-6" />
      </div>
    </Card>
  );
}

// Attach subcomponents for compound usage: <PageSkeleton.KPI count={4} />
PageSkeleton.KPI = KPISkeleton;
PageSkeleton.Grid = GridSkeleton;
PageSkeleton.Table = TableSkeleton;
PageSkeleton.Detail = DetailSkeleton;
PageSkeleton.Form = FormSkeleton;
PageSkeleton.Dashboard = DashboardSkeleton;
PageSkeleton.Shimmer = Shimmer;
