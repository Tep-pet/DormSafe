import { Link, useLocation } from 'react-router-dom';
import { Card, CardBody, CardHeader, Divider } from '@heroui/react';
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Users,
  Inbox,
  CreditCard,
  BarChart3,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatPrice } from '../../utils/formatPrice';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';

export function OwnerListingCard({ property, onToggleAvailability }) {
  const rooms = property.rooms || [];

  return (
    <Card
      shadow="sm"
      className="rounded-2xl border border-gray-200 bg-white p-1 hover:border-gray-300 transition duration-200"
    >
      <CardHeader className="flex flex-wrap items-start justify-between gap-3 p-5 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-gray-900">{property.name}</h3>
            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {PROPERTY_TYPE_LABELS[property.type] || property.type}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 line-clamp-1">{property.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={property.status === 'approved' ? 'verified' : 'pending'}>
            {property.status}
          </Badge>
          {property.status === 'approved' && (
            <Link to={`/owner/listings/${property.id}/edit`}>
              <Button size="sm" variant="secondary" startContent={<Edit3 size={13} />}>
                Edit
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>

      <Divider className="my-1" />

      <CardBody className="p-5 pt-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          Rooms & Units ({rooms.length})
        </h4>
        <ul className="divide-y divide-gray-100">
          {rooms.map((room) => (
            <li key={room.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{room.label || 'Room'}</span>
                <span className="text-xs font-bold text-ateneo-blue bg-blue-50 px-2 py-0.5 rounded-full">
                  {formatPrice(room.price)}/mo
                </span>
                {room.capacity && (
                  <span className="text-[11px] text-gray-400">
                    Cap: {room.capacity}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={room.is_available ? 'vacant' : 'occupied'}>
                  {room.is_available ? 'Vacant' : 'Occupied'}
                </Badge>
                {property.status === 'approved' && onToggleAvailability && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => onToggleAvailability(room.id, !room.is_available)}
                  >
                    Toggle
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

export function OwnerSidebarLinks() {
  const location = useLocation();

  const links = [
    { to: '/owner/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { to: '/owner/listings', label: 'My Listings', Icon: Building2 },
    { to: '/owner/add-property', label: 'Add Property', Icon: PlusCircle },
    { to: '/owner/tenants', label: 'Tenants', Icon: Users },
    { to: '/owner/requests', label: 'Room Requests', Icon: Inbox },
    { to: '/owner/payments', label: 'Payment Log', Icon: CreditCard },
    { to: '/owner/analytics', label: 'Analytics', Icon: BarChart3 },
    { to: '/owner/verification', label: 'Verification', Icon: ShieldCheck },
  ];

  return (
    <nav className="flex flex-wrap gap-1 lg:flex-col">
      {links.map(({ to, label, Icon }) => {
        const isActive = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
              isActive
                ? 'bg-ateneo-blue text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100 hover:text-ateneo-blue'
            }`}
          >
            <Icon size={16} strokeWidth={isActive ? 2.2 : 1.75} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
