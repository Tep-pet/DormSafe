import React from 'react';
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
  MapPin,
  BedDouble,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatPrice } from '../../utils/formatPrice';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';

/**
 * OwnerListingCard Component
 * Displays owner property overview with room management and real-time availability toggle.
 * Adheres to Golden DormSafe Design Standards.
 */
export function OwnerListingCard({ property, onToggleAvailability }) {
  const rooms = property.rooms || [];
  const totalCapacity = rooms.reduce((sum, r) => sum + (Number(r.capacity) || 1), 0);
  const vacantRoomsCount = rooms.filter((r) => r.is_available).length;

  return (
    <Card
      shadow="sm"
      className="rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xs p-1 shadow-xs hover:border-slate-300/90 hover:shadow-md transition-all duration-200"
    >
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-5 pb-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-ateneo-blue border border-blue-100/80">
            <Building2 size={20} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 tracking-tight truncate">
                {property.name}
              </h3>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200/70">
                {PROPERTY_TYPE_LABELS[property.type] || property.type}
              </span>
              <Badge variant={property.status === 'approved' ? 'verified' : 'pending'}>
                {property.status === 'approved' ? 'Approved & Active' : 'Pending Verification'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin size={13} className="shrink-0 text-slate-400" />
                <span className="truncate">{property.address}</span>
              </div>
              {property.contact_email && (
                <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
                  <Mail size={13} className="shrink-0 text-ateneo-blue" />
                  <span className="truncate font-medium">{property.contact_email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <Link to={`/student/property/${property.id}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" radius="full" variant="ghost" startContent={<ExternalLink size={13} />}>
              Preview
            </Button>
          </Link>
          <Link to={`/owner/listings/${property.id}/edit`}>
            <Button size="sm" radius="full" variant="secondary" startContent={<Edit3 size={13} />}>
              Edit Listing
            </Button>
          </Link>
        </div>
      </CardHeader>

      <Divider className="my-1 border-slate-100" />

      <CardBody className="p-5 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-600">
            Units & rooms ({rooms.length} units · {vacantRoomsCount} vacant)
          </h4>
          <span className="text-[11px] font-medium text-slate-400">
            Total Capacity: {totalCapacity} beds
          </span>
        </div>

        {rooms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-500">No rooms listed under this property yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50">
            {rooms.map((room) => (
              <li
                key={room.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:px-4 hover:bg-slate-50/90 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200/80 text-slate-600 shadow-2xs">
                    <BedDouble size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {room.label || 'Standard Room'}
                  </span>
                  <span className="text-xs font-bold text-ateneo-blue bg-blue-50/90 border border-blue-100 px-2.5 py-0.5 rounded-full">
                    {formatPrice(room.price)}<span className="text-[10px] font-normal text-slate-500">/mo</span>
                  </span>
                  {room.capacity && (
                    <span className="text-[11px] font-medium text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      Capacity: {room.capacity}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <Badge variant={room.is_available ? 'vacant' : 'occupied'}>
                    {room.is_available ? 'Vacant (Available)' : 'Occupied'}
                  </Badge>

                  {onToggleAvailability && (
                    <Button
                      variant="ghost"
                      size="sm"
                      radius="full"
                      className="h-7 px-2.5 text-xs text-slate-600 hover:text-ateneo-blue"
                      onClick={() => onToggleAvailability(room.id, !room.is_available)}
                      startContent={
                        room.is_available ? (
                          <ToggleRight size={15} className="text-emerald-600" />
                        ) : (
                          <ToggleLeft size={15} className="text-slate-400" />
                        )
                      }
                    >
                      {room.is_available ? 'Mark Occupied' : 'Mark Vacant'}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

/**
 * Owner Sidebar Navigation Component
 */
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
                ? 'bg-ateneo-blue text-white shadow-xs font-bold'
                : 'text-slate-700 hover:bg-slate-100 hover:text-ateneo-blue'
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
