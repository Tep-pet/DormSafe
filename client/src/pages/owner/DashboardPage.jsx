import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OwnerLayout } from '../../components/layout/OwnerLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Loader } from '../../components/common/Loader';
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

  if (loading) return <OwnerLayout title="Owner Dashboard"><Loader /></OwnerLayout>;

  return (
    <OwnerLayout
      title="Owner Dashboard"
      subtitle="Occupancy overview and revenue summary (proposal §3.4.2)"
    >
      <div className="mb-6 flex justify-end">
        <Link to="/owner/add-property">
          <Button>Add Property</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Properties" value={stats?.propertyCount ?? 0} />
        <StatsCard label="Occupied" value={stats?.occupiedRooms ?? 0} variant="occupied" subtext="rooms filled" />
        <StatsCard label="Vacant" value={stats?.vacantRooms ?? 0} variant="vacant" subtext="rooms available" />
        <StatsCard
          label="Recorded Revenue"
          value={formatPrice(stats?.monthlyRevenue ?? 0)}
          variant="revenue"
          subtext="paid logs this period"
        />
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="font-semibold">Potential from vacant rooms</h2>
        <p className="mt-1 text-2xl font-bold text-ateneo-blue">
          {formatPrice(stats?.potentialRevenue ?? 0)}/mo
        </p>
      </div>
    </OwnerLayout>
  );
}
