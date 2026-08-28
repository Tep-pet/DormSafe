import { Link } from 'react-router-dom';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatPrice } from '../../utils/formatPrice';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';

export function OwnerListingCard({ property, onToggleAvailability }) {
  const rooms = property.rooms || [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{property.name}</h3>
          <p className="text-xs text-gray-500">{PROPERTY_TYPE_LABELS[property.type]}</p>
          <p className="mt-1 text-sm text-gray-600">{property.address}</p>
        </div>
        <Badge variant={property.status === 'approved' ? 'verified' : 'pending'}>
          {property.status}
        </Badge>
      </div>

      {property.status === 'approved' && (
        <Link
          to={`/owner/listings/${property.id}/edit`}
          className="mt-2 inline-block text-sm text-ateneo-blue hover:underline"
        >
          Edit listing
        </Link>
      )}

      <ul className="mt-4 divide-y divide-gray-100">
        {rooms.map((room) => (
          <li key={room.id} className="flex items-center justify-between py-2">
            <div>
              <span className="text-sm font-medium">{room.label || 'Room'}</span>
              <span className="ml-2 text-sm text-gray-500">{formatPrice(room.price)}/mo</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={room.is_available ? 'vacant' : 'occupied'}>
                {room.is_available ? 'Vacant' : 'Occupied'}
              </Badge>
              {property.status === 'approved' && onToggleAvailability && (
                <Button
                  variant="ghost"
                  className="text-xs"
                  onClick={() => onToggleAvailability(room.id, !room.is_available)}
                >
                  Toggle
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OwnerSidebarLinks() {
  const links = [
    { to: '/owner/dashboard', label: 'Dashboard' },
    { to: '/owner/listings', label: 'My Listings' },
    { to: '/owner/add-property', label: 'Add Property' },
    { to: '/owner/tenants', label: 'Tenants' },
    { to: '/owner/payments', label: 'Payment Log' },
    { to: '/owner/analytics', label: 'Analytics' },
    { to: '/owner/verification', label: 'Verification' },
  ];

  return (
    <nav className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-ateneo-blue"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
