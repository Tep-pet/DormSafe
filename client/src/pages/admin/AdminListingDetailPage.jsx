import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Loader } from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';
import { PROPERTY_TYPE_LABELS } from '../../constants/propertyTypes';
import { ROUTES } from '../../constants/routes';

export function AdminListingDetailPage() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService
      .getListingDocuments(id, accessToken)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, accessToken]);

  async function approve() {
    await adminService.approveListing(id, accessToken);
    navigate(ROUTES.ADMIN_APPROVE_LISTINGS);
  }

  async function reject() {
    await adminService.rejectListing(id, accessToken);
    navigate(ROUTES.ADMIN_APPROVE_LISTINGS);
  }

  if (loading) {
    return (
      <AdminLayout title="Listing Review">
        <Loader />
      </AdminLayout>
    );
  }

  if (error || !data?.property) {
    return (
      <AdminLayout title="Listing Review">
        <p className="text-sm text-red-600">{error || 'Listing not found'}</p>
        <Link to={ROUTES.ADMIN_APPROVE_LISTINGS} className="mt-4 inline-block text-sm text-ateneo-blue hover:underline">
          ← Back to listings
        </Link>
      </AdminLayout>
    );
  }

  const { property, ownerDocs, owner } = data;
  const images = property.room_images || [];
  const badgeVariant =
    property.status === 'approved' ? 'verified' : property.status === 'rejected' ? 'danger' : 'pending';

  return (
    <AdminLayout title={property.name} subtitle="Review listing details and owner documents">
      <Link to={ROUTES.ADMIN_APPROVE_LISTINGS} className="text-sm text-ateneo-blue hover:underline">
        ← Back to Approve Listings
      </Link>

      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">{PROPERTY_TYPE_LABELS[property.type]}</p>
            <p className="mt-1 text-gray-700">{property.address}</p>
          </div>
          <Badge variant={badgeVariant}>{property.status}</Badge>
        </div>

        {owner && (
          <p className="mt-2 text-sm text-gray-600">
            Owner: {owner.full_name} ({owner.email})
          </p>
        )}

        {property.description && (
          <section className="mt-6">
            <h2 className="font-semibold">Description</h2>
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{property.description}</p>
          </section>
        )}

        <section className="mt-6">
          <h2 className="font-semibold">Owner verification documents</h2>
          {!ownerDocs?.id_url && !ownerDocs?.license_url ? (
            <p className="mt-2 text-sm text-gray-500">No owner ID or license documents on file.</p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {ownerDocs.id_url && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Valid ID</p>
                  <a href={ownerDocs.id_url} target="_blank" rel="noreferrer" className="block">
                    <img
                      src={ownerDocs.id_url}
                      alt="Owner valid ID"
                      className="max-h-96 w-full rounded-lg border object-contain"
                    />
                  </a>
                </div>
              )}
              {ownerDocs.license_url && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Business license / permit</p>
                  <a href={ownerDocs.license_url} target="_blank" rel="noreferrer" className="block">
                    <img
                      src={ownerDocs.license_url}
                      alt="Owner business license"
                      className="max-h-96 w-full rounded-lg border object-contain"
                    />
                  </a>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="mt-6">
          <h2 className="font-semibold">Listing photos</h2>
          {images.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No room photos uploaded.</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((img) => (
                <a key={img.id || img.url} href={img.url} target="_blank" rel="noreferrer">
                  <img
                    src={img.url}
                    alt="Listing"
                    className="h-32 w-full rounded-lg border object-cover hover:opacity-90"
                  />
                </a>
              ))}
            </div>
          )}
        </section>

        {property.status === 'pending' && (
          <div className="mt-8 flex gap-2 border-t border-gray-100 pt-6">
            <Button onClick={approve}>Approve</Button>
            <Button variant="danger" onClick={reject}>Reject</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
