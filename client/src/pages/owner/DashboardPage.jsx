import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody } from '@heroui/react';
import { Building2, Users, BedDouble, CreditCard, Plus, TrendingUp } from 'lucide-react';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useOwnerProperty } from '../../context/OwnerPropertyContext';
import { propertyService } from '../../services/propertyService';
import { formatPrice } from '../../utils/formatPrice';

export function DashboardPage() {
  const { accessToken } = useAuth();
  const { filterPropertyId } = useOwnerProperty();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    propertyService
      .getDashboardStats(accessToken, filterPropertyId)
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken, filterPropertyId]);

  if (loading) {
    return (
      <OwnerLayout title="Owner Dashboard" subtitle="Occupancy overview, live metrics, and revenue summary">
        <PageSkeleton variant="dashboard" count={4} />
      </OwnerLayout>
    );
  }

  const occupied = stats?.occupiedRooms ?? 0;
  const vacant = stats?.vacantRooms ?? 0;
  const totalRooms = occupied + vacant;
  const occupancyRate = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

  return (
    <OwnerLayout
      title="Owner Dashboard"
      subtitle="Occupancy overview, live metrics, and revenue summary"
    >
      <div className="mb-6 flex justify-end">
        <Link to="/owner/add-property">
          <Button variant="primary" startContent={<Plus size={16} strokeWidth={2.5} />}>
            Add New Property
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Total Properties"
          value={stats?.propertyCount ?? 0}
          icon={<Building2 size={16} strokeWidth={2} />}
          variant="default"
          subtext="active listings"
        />

        <StatsCard
          label="Occupied Rooms"
          value={occupied}
          icon={<Users size={16} strokeWidth={2} />}
          variant="occupied"
          trend={`${occupancyRate}% filled`}
          subtext={`out of ${totalRooms} total rooms`}
          progress={occupancyRate}
        />

        <StatsCard
          label="Vacant Rooms"
          value={vacant}
          icon={<BedDouble size={16} strokeWidth={2} />}
          variant="vacant"
          trend={`${100 - occupancyRate}% ready`}
          subtext="available for rent"
          progress={100 - occupancyRate}
        />

        <StatsCard
          label="Recorded Revenue"
          value={formatPrice(stats?.monthlyRevenue ?? 0)}
          icon={<CreditCard size={16} strokeWidth={2} />}
          variant="revenue"
          trend="Verified"
          subtext="paid logs this period"
        />
      </div>

      <Card
        shadow="sm"
        className="mt-6 rounded-2xl border border-gray-100 bg-linear-to-r from-blue-50/70 to-indigo-50/50 p-1"
      >
        <CardBody className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-ateneo-blue">
              <TrendingUp size={20} strokeWidth={2} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ateneo-blue">
                Revenue Opportunity
              </span>
              <h3 className="text-base font-bold text-gray-900 mt-0.5">
                Potential monthly income from vacant rooms
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Filling remaining vacant units will maximize your recurring monthly revenue.
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-3xl font-extrabold text-ateneo-blue tracking-tight">
              +{formatPrice(stats?.potentialRevenue ?? 0)}
            </span>
            <span className="text-xs text-gray-500 font-semibold block">/ month</span>
          </div>
        </CardBody>
      </Card>
    </OwnerLayout>
  );
}
