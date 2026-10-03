import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Avatar,
  Tooltip,
} from '@heroui/react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Building2,
  Calendar,
  FileText,
  ShieldCheck,
  Eye,
  ExternalLink,
  User,
  Phone,
  Mail,
  Home,
  Image as ImageIcon,
  Check,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { DocumentViewer } from '../../components/common/DocumentViewer';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';
import { ROUTES } from '../../constants/routes';

export function AdminListingDetailPage() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Document Viewer & Rejection Dialog State
  const [activeDocPreview, setActiveDocPreview] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, reason: '' });
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    adminService
      .getListingDocuments(id, accessToken)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message || 'Failed to load listing review details'))
      .finally(() => setLoading(false));
  }, [id, accessToken]);

  async function handleApprove() {
    setProcessing(true);
    try {
      await adminService.approveListing(id, accessToken);
      toast.success(`Listing "${data?.property?.name || 'Property'}" approved and activated!`);
      setTimeout(() => navigate(ROUTES.ADMIN_APPROVE_LISTINGS), 1200);
    } catch (err) {
      toast.error(err.message || 'Failed to approve listing');
      setProcessing(false);
    }
  }

  async function handleConfirmReject() {
    setProcessing(true);
    try {
      await adminService.rejectListing(id, accessToken);
      setRejectionModal({ isOpen: false, reason: '' });
      toast.warning(`Listing "${data?.property?.name || 'Property'}" rejected.`);
      setTimeout(() => navigate(ROUTES.ADMIN_APPROVE_LISTINGS), 1200);
    } catch (err) {
      toast.error(err.message || 'Failed to reject listing');
      setProcessing(false);
    }
  }

  const property = data?.property;
  const ownerDocs = data?.ownerDocs || {};
  const owner = data?.owner;
  const images = property?.room_images || [];
  const isPending = property?.status === 'pending';
  const badgeVariant =
    property?.status === 'approved' ? 'verified' : property?.status === 'rejected' ? 'danger' : 'pending';

  const customBreadcrumbs = [
    { label: 'Admin Portal', to: ROUTES.ADMIN_DASHBOARD },
    { label: 'Approve Listings', to: ROUTES.ADMIN_APPROVE_LISTINGS },
    { label: property?.name || 'Listing Review' },
  ];

  // Header Actions
  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      <Link to={ROUTES.ADMIN_APPROVE_LISTINGS}>
        <Button size="sm" radius="full" variant="ghost" startContent={<ArrowLeft size={14} strokeWidth={2} />}>
          Back to Listings
        </Button>
      </Link>

      {isPending && (
        <>
          <Button
            size="sm"
            radius="full"
            variant="danger"
            disabled={processing}
            onClick={() => setRejectionModal({ isOpen: true, reason: '' })}
            startContent={<XCircle size={14} strokeWidth={2} />}
          >
            Reject
          </Button>

          <Button
            size="sm"
            radius="full"
            variant="primary"
            isLoading={processing}
            onClick={handleApprove}
            startContent={!processing && <CheckCircle2 size={14} strokeWidth={2} />}
          >
            Approve Listing
          </Button>
        </>
      )}

      {property?.status === 'rejected' && (
        <Button
          size="sm"
          radius="full"
          variant="primary"
          isLoading={processing}
          onClick={handleApprove}
          startContent={!processing && <CheckCircle2 size={14} strokeWidth={2} />}
        >
          Re-approve Listing
        </Button>
      )}
    </div>
  );

  return (
    <AdminLayout
      title={property?.name || 'Listing Inspection'}
      subtitle={`Submitted by ${owner?.full_name || 'Owner'} · Property ID: ${id ? id.slice(0, 8) : ''}…`}
      headerAction={headerAction}
      customBreadcrumbs={customBreadcrumbs}
    >
      {loading ? (
        <PageSkeleton variant="detail" />
      ) : error || !property ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <AlertTriangle size={24} />
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-900">Listing Not Found</h3>
          <p className="mt-1 text-xs text-rose-700 max-w-md mx-auto">{error || 'Unable to retrieve property record.'}</p>
          <div className="mt-5">
            <Link to={ROUTES.ADMIN_APPROVE_LISTINGS}>
              <Button size="sm" radius="full" variant="secondary" startContent={<ArrowLeft size={14} />}>
                Return to Approve Listings
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ==================================================================== */}
          {/* 2-COLUMN ASYMMETRIC INSPECTION GRID */}
          {/* ==================================================================== */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* ------------------------------------------------------------------ */}
            {/* LEFT 2 COLUMNS: PROPERTY OVERVIEW & ROOM GALLERY */}
            {/* ------------------------------------------------------------------ */}
            <div className="space-y-6 lg:col-span-2">
              {/* Card A: Property Details & Description */}
              <Card shadow="sm" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <CardHeader className="border-b border-slate-100 p-5 pb-4">
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Property Overview</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Basic dormitory information and location specifications</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip size="sm" variant="flat" className="font-semibold text-xs text-ateneo-blue bg-blue-50">
                        {PROPERTY_TYPE_LABELS[property.type] || property.type}
                      </Chip>
                      <Badge variant={badgeVariant}>{property.status}</Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="p-5 space-y-4">
                  {/* Address Section */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 flex items-start gap-2.5">
                    <MapPin size={16} className="text-ateneo-blue shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{property.address}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Zoned within Ateneo de Davao University walking perimeter
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Property Description
                    </h4>
                    {property.description ? (
                      <div className="rounded-xl border border-slate-100 bg-white p-4 text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                        {property.description}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No description provided by landlord.</p>
                    )}
                  </div>

                  {/* Amenities / Rules tags if provided */}
                  {property.rules && property.rules.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        House Rules & Amenities
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {property.rules.map((rule, idx) => (
                          <span
                            key={idx}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                          >
                            {rule}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Card B: Listing Photos & Gallery */}
              <Card shadow="sm" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <CardHeader className="border-b border-slate-100 p-5 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Listing Photos & Room Previews
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Click any image to inspect high-resolution preview</p>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">{images.length} photos uploaded</span>
                </CardHeader>

                <CardBody className="p-5">
                  {images.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
                      <ImageIcon size={32} className="mx-auto text-slate-300" />
                      <p className="mt-2 text-xs font-semibold text-slate-600">No room photos uploaded</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Landlord has not attached photo evidence for this dormitory submission.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {images.map((img, idx) => {
                        const imgUrl = img.url || img;
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedPhoto(imgUrl)}
                            className="group relative h-28 sm:h-32 w-full cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition-all hover:border-ateneo-blue hover:shadow-md"
                          >
                            <img
                              src={imgUrl}
                              alt={`Room preview ${idx + 1}`}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition-all group-hover:bg-slate-900/30">
                              <Eye size={18} className="text-white opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-slate-900/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                              Photo #{idx + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* ------------------------------------------------------------------ */}
            {/* RIGHT COLUMN: OWNER CREDENTIALS & PERMITS */}
            {/* ------------------------------------------------------------------ */}
            <div className="space-y-6">
              {/* Card C: Landlord Profile */}
              <Card shadow="sm" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <CardHeader className="border-b border-slate-100 p-5 pb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Landlord Credentials</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Registered property owner profile</p>
                  </div>
                </CardHeader>

                <CardBody className="p-5 space-y-4">
                  {owner ? (
                    <>
                      <div className="flex items-center gap-3">
                        <Avatar
                          size="md"
                          name={owner.full_name || 'Owner'}
                          className="h-11 w-11 bg-ateneo-blue text-white text-sm font-bold"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {owner.full_name || 'Unnamed Landlord'}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200 mt-0.5">
                            <Check size={10} strokeWidth={3} />
                            Property Owner
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                        {owner.email && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Mail size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{owner.email}</span>
                          </div>
                        )}
                        {owner.phone_number && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Phone size={13} className="text-slate-400 shrink-0" />
                            <span>{owner.phone_number}</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-400">No owner profile attached to this record.</p>
                  )}
                </CardBody>
              </Card>

              {/* Card D: Official Verification Documents (ID & Permit) */}
              <Card shadow="sm" className="rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <CardHeader className="border-b border-slate-100 p-5 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Permits & Government ID</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Official compliance documentation</p>
                  </div>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={ownerDocs?.id_url && ownerDocs?.license_url ? 'success' : ownerDocs?.id_url || ownerDocs?.license_url ? 'warning' : 'default'}
                    className="font-semibold text-[11px]"
                  >
                    {ownerDocs?.id_url && ownerDocs?.license_url
                      ? 'Complete'
                      : ownerDocs?.id_url || ownerDocs?.license_url
                      ? 'Partial'
                      : 'Missing'}
                  </Chip>
                </CardHeader>

                <CardBody className="p-5 space-y-3.5">
                  {/* Valid ID Tile */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-ateneo-blue">
                        <FileText size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">Valid Government ID</p>
                        <p className="text-[10px] text-slate-400">
                          {ownerDocs?.id_url ? 'Document on file' : 'Not submitted'}
                        </p>
                      </div>
                    </div>

                    {ownerDocs?.id_url ? (
                      <Button
                        size="sm"
                        radius="full"
                        variant="secondary"
                        onClick={() => setActiveDocPreview({ title: 'Owner Valid Government ID', url: ownerDocs.id_url })}
                        startContent={<Eye size={12} />}
                        className="h-7 text-[11px] px-2.5"
                      >
                        Inspect
                      </Button>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400">Missing</span>
                    )}
                  </div>

                  {/* Business Permit Tile */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <ShieldCheck size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800">Business License / Permit</p>
                        <p className="text-[10px] text-slate-400">
                          {ownerDocs?.license_url ? 'Permit on file' : 'Not submitted'}
                        </p>
                      </div>
                    </div>

                    {ownerDocs?.license_url ? (
                      <Button
                        size="sm"
                        radius="full"
                        variant="secondary"
                        onClick={() => setActiveDocPreview({ title: 'Business License / Permit', url: ownerDocs.license_url })}
                        startContent={<Eye size={12} />}
                        className="h-7 text-[11px] px-2.5"
                      >
                        Inspect
                      </Button>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400">Missing</span>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Lightbox Modal */}
      {activeDocPreview && (
        <DocumentViewer
          title={activeDocPreview.title}
          idUrl={activeDocPreview.url}
          onClose={() => setActiveDocPreview(null)}
        />
      )}

      {/* Image Gallery Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-black shadow-2xl">
            <img src={selectedPhoto} alt="Zoom preview" className="max-h-[85vh] w-auto object-contain" />
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Rejection Remarks Modal */}
      {rejectionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertTriangle size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Property Listing</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specify rejection remarks for "{property?.name || 'Property'}".
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-slate-700">Administrative Rejection Reason</label>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal((m) => ({ ...m, reason: e.target.value }))}
                placeholder="e.g. Missing valid business permit, unclear floor plan, or invalid landlord contact details."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-ateneo-blue focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                size="sm"
                radius="full"
                variant="ghost"
                onClick={() => setRejectionModal({ isOpen: false, reason: '' })}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                radius="full"
                variant="danger"
                isLoading={processing}
                onClick={handleConfirmReject}
                startContent={!processing && <XCircle size={14} strokeWidth={2} />}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
