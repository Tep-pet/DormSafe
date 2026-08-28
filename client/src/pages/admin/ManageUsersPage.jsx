import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { adminService } from '../../services/adminService';
import { ROLE_LABELS } from '../../constants/roles';

export function ManageUsersPage() {
  const { accessToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await adminService.getUsers(accessToken);
      setUsers(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [accessToken]);

  const filteredUsers = roleFilter
    ? users.filter((u) => u.role === roleFilter)
    : users;

  async function reviewUser(id, status) {
    const notes = status === 'rejected' ? window.prompt('Rejection reason (optional):') : '';
    await adminService.reviewUserAccount(id, { status, notes: notes || null }, accessToken);
    load();
  }

  return (
    <AdminLayout title="Manage Users" subtitle="Approve or reject student and owner accounts">
      <div className="mb-4 max-w-xs rounded-xl border border-gray-200 bg-white p-4">
        <label className="mb-1 block text-xs font-medium text-gray-600">Filter by role</label>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option value="">All users</option>
          <option value="student">Student</option>
          <option value="owner">Property Owner</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : filteredUsers.length === 0 ? (
        <p className="text-sm text-gray-600">No users match this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">{u.full_name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[u.role] || u.role}</td>
                  <td className="px-4 py-3">
                    {u.role === 'admin' ? (
                      '—'
                    ) : (
                      <Badge
                        variant={
                          u.verification_status === 'approved'
                            ? 'verified'
                            : u.verification_status === 'rejected'
                              ? 'danger'
                              : 'pending'
                        }
                      >
                        {u.verification_status || 'pending'}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== 'admin' && u.verification_status === 'pending' && (
                      <div className="flex gap-2">
                        <Button onClick={() => reviewUser(u.id, 'approved')}>Approve</Button>
                        <Button variant="danger" onClick={() => reviewUser(u.id, 'rejected')}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
