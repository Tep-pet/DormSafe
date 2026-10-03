import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardBody,
  Chip,
  Avatar,
  Tooltip,
} from '@heroui/react';
import {
  Users,
  User,
  Building2,
  ShieldCheck,
  UserCheck,
  FileText,
  Award,
  RefreshCw,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  ArrowUpDown,
  UserCog,
  Check,
  Shield,
  Clock,
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { adminService } from '../../services/adminService';
import { ROLE_LABELS, ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';

export function ManageUsersPage() {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Filter State
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [roleFilter, setRoleFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modals State
  const [roleModal, setRoleModal] = useState({ isOpen: false, user: null, newRole: '' });
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, user: null, reason: '' });

  // Sync search state with URL search param
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== search) {
      setSearch(q);
    }
  }, [searchParams]);

  // Load auxiliary stats
  const fetchAuxiliaryStats = useCallback(async () => {
    try {
      const statsRes = await adminService.getDashboardStats(accessToken).catch(() => ({ data: null }));
      setStats(statsRes.data || null);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [accessToken]);

  // Load all users
  const loadUsers = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await adminService.getUsers(accessToken);
        setUsers(res.data || []);
      } catch (err) {
        toast.error(err.message || 'Failed to load user directory.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, toast]
  );

  useEffect(() => {
    loadUsers();
    fetchAuxiliaryStats();
  }, [loadUsers, fetchAuxiliaryStats]);

  // Quick Approve Verification
  const handleQuickApprove = async (user) => {
    setProcessingId(user.id);
    try {
      await adminService.reviewUserAccount(user.id, { status: 'approved' }, accessToken);
      toast.success(`Approved verification for "${user.full_name || 'User'}".`);
      loadUsers();
      fetchAuxiliaryStats();
    } catch (err) {
      toast.error(err.message || 'Failed to verify account');
    } finally {
      setProcessingId(null);
    }
  };

  // Open Rejection Dialog
  const openRejectDialog = (user) => {
    setRejectionModal({
      isOpen: true,
      user,
      reason: '',
    });
  };

  // Confirm Rejection
  const handleConfirmReject = async () => {
    if (!rejectionModal.user) return;
    const { id, full_name } = rejectionModal.user;
    setProcessingId(id);
    try {
      await adminService.reviewUserAccount(
        id,
        { status: 'rejected', notes: rejectionModal.reason || null },
        accessToken
      );
      toast.warning(`Rejected verification for "${full_name || 'User'}".`);
      setRejectionModal({ isOpen: false, user: null, reason: '' });
      loadUsers();
      fetchAuxiliaryStats();
    } catch (err) {
      toast.error(err.message || 'Failed to reject account');
    } finally {
      setProcessingId(null);
    }
  };

  // Open Role Change Modal
  const openRoleModal = (user) => {
    setRoleModal({
      isOpen: true,
      user,
      newRole: user.role || 'student',
    });
  };

  // Confirm Role Change
  const handleConfirmRoleChange = async () => {
    if (!roleModal.user || !roleModal.newRole) return;
    const { id, full_name, role: oldRole } = roleModal.user;
    if (roleModal.newRole === oldRole) {
      setRoleModal({ isOpen: false, user: null, newRole: '' });
      return;
    }

    setProcessingId(id);
    try {
      await adminService.updateUserRole(id, roleModal.newRole, accessToken);
      toast.success(
        `Role updated for "${full_name || 'User'}" to ${ROLE_LABELS[roleModal.newRole] || roleModal.newRole}.`
      );
      setRoleModal({ isOpen: false, user: null, newRole: '' });
      loadUsers();
      fetchAuxiliaryStats();
    } catch (err) {
      toast.error(err.message || 'Failed to update user role');
    } finally {
      setProcessingId(null);
    }
  };

  // Compute filtered & sorted users
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        // Role filter
        if (roleFilter && u.role !== roleFilter) return false;

        // Verification status filter
        if (verificationFilter) {
          if (verificationFilter === 'approved' && u.verification_status !== 'approved') return false;
          if (verificationFilter === 'pending' && u.verification_status !== 'pending') return false;
          if (verificationFilter === 'rejected' && u.verification_status !== 'rejected') return false;
        }

        // Search query (name or email)
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesName = (u.full_name || '').toLowerCase().includes(q);
          const matchesEmail = (u.email || '').toLowerCase().includes(q);
          const matchesPhone = (u.phone_number || '').toLowerCase().includes(q);
          if (!matchesName && !matchesEmail && !matchesPhone) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'name') {
          return (a.full_name || '').localeCompare(b.full_name || '');
        }
        if (sortOrder === 'asc') {
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        }
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [users, roleFilter, verificationFilter, search, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setRoleFilter('');
    setVerificationFilter('');
    setSortOrder('desc');
    setCurrentPage(1);
    setSearchParams({});
  };

  const hasActiveFilters =
    search !== '' || roleFilter !== '' || verificationFilter !== '' || sortOrder !== 'desc';

  // Counts for KPI metrics
  const studentCount = useMemo(() => users.filter((u) => u.role === 'student').length, [users]);
  const ownerCount = useMemo(() => users.filter((u) => u.role === 'owner').length, [users]);
  const adminCount = useMemo(() => users.filter((u) => u.role === 'admin').length, [users]);
  const pendingVerificationsCount = useMemo(
    () => users.filter((u) => u.verification_status === 'pending' && u.role !== 'admin').length,
    [users]
  );

  // Executive Top Action Bar
  const headerAction = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        radius="full"
        variant="secondary"
        onClick={() => navigate(ROUTES.ADMIN_VERIFY_ACCOUNTS)}
        startContent={<UserCheck size={14} strokeWidth={2} />}
      >
        <span>Verify Queue</span>
        {pendingVerificationsCount > 0 && (
          <span className="ml-1 rounded-full bg-ateneo-blue/15 px-1.5 py-0.2 text-[10px] font-bold text-ateneo-blue">
            {pendingVerificationsCount}
          </span>
        )}
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        onClick={() => navigate(ROUTES.ADMIN_AUDIT_LOG)}
        startContent={<Award size={14} strokeWidth={2} />}
      >
        Audit Log
      </Button>

      <Button
        size="sm"
        radius="full"
        variant="ghost"
        isLoading={refreshing}
        onClick={() => {
          loadUsers(true);
          fetchAuxiliaryStats();
        }}
        startContent={!refreshing && <RefreshCw size={14} strokeWidth={2} className={refreshing ? 'animate-spin' : ''} />}
        title="Sync user directory"
      >
        {refreshing ? 'Syncing…' : 'Sync'}
      </Button>
    </div>
  );

  return (
    <AdminLayout
      title="Manage Users"
      subtitle="Directory of student tenants, property owners, and university administrators"
      headerAction={headerAction}
    >
      <div className="space-y-6">
        {/* ==================================================================== */}
        {/* SECTION 1: EXECUTIVE KPI METRICS (COMPACT ~80px STANDARD) */}
        {/* ==================================================================== */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Total Registered Users"
            value={users.length}
            icon={<Users size={16} strokeWidth={2} />}
            variant="default"
            subtext="all platform accounts"
          />

          <StatsCard
            label="Student Tenants"
            value={studentCount}
            icon={<User size={16} strokeWidth={2} />}
            variant="default"
            subtext="housing seekers"
          />

          <StatsCard
            label="Property Owners"
            value={ownerCount}
            icon={<Building2 size={16} strokeWidth={2} />}
            variant="occupied"
            subtext="verified dorm managers"
          />

          <StatsCard
            label="Platform Administrators"
            value={adminCount}
            icon={<ShieldCheck size={16} strokeWidth={2} />}
            variant="verified"
            subtext="university moderators"
          />
        </section>

        {/* ==================================================================== */}
        {/* ==================================================================== */}
        {/* SECTION 2: RESPONSIVE SINGLE-ROW FILTERS & RIGHT-ALIGNED STATUS SELECTOR */}
        {/* ==================================================================== */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 border-b border-slate-200/80 pb-3.5">
          {/* Left Group: Inline Filter Inputs */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* 1. Search Input */}
            <div className="relative w-full sm:w-56">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                  setSearchParams(e.target.value ? { q: e.target.value } : {});
                }}
                placeholder="Search name, email, phone…"
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              />
            </div>

            {/* 2. Role Selector Dropdown */}
            <div className="w-full sm:w-44">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-xs text-slate-800 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              >
                <option value="">All account roles</option>
                <option value="student">Student (@addu.edu.ph)</option>
                <option value="owner">Property Owner</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* 3. Verification Status Dropdown */}
            <div className="w-full sm:w-40">
              <select
                value={verificationFilter}
                onChange={(e) => {
                  setVerificationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full rounded-xl border border-slate-200/90 bg-white px-3 text-xs text-slate-800 focus:border-ateneo-blue focus:outline-hidden shadow-2xs"
              >
                <option value="">All verification</option>
                <option value="approved">Verified</option>
                <option value="pending">Pending Review</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Reset Filters CTA if active */}
            {hasActiveFilters && (
              <Button
                size="sm"
                radius="full"
                variant="ghost"
                onClick={handleResetFilters}
                startContent={<RotateCcw size={13} strokeWidth={2} />}
                className="h-10 text-xs text-slate-500 hover:text-slate-900"
              >
                Reset
              </Button>
            )}
          </div>

          {/* Right Group: Role Selector on the Right Side Edge */}
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
            <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 p-1 h-10 rounded-2xl bg-slate-100/90 border border-slate-200/70 shrink-0">
              {[
                { id: '', label: 'All Users', icon: Users, count: users.length },
                { id: 'student', label: 'Students', icon: User, count: studentCount },
                { id: 'owner', label: 'Owners', icon: Building2, count: ownerCount },
                { id: 'admin', label: 'Admins', icon: ShieldCheck, count: adminCount },
              ].map((tab) => {
                const isActive = roleFilter === tab.id;
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setRoleFilter(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`inline-flex items-center gap-1.5 h-full rounded-xl px-3 text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? 'bg-white text-ateneo-blue shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <IconComp size={13} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-ateneo-blue' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        isActive ? 'bg-ateneo-blue/10 text-ateneo-blue' : 'bg-slate-200/60 text-slate-500'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 3: USER DIRECTORY CARDS LIST */}
        {/* ==================================================================== */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-2.5">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-slate-900">
                {roleFilter === 'student'
                  ? 'Registered Students'
                  : roleFilter === 'owner'
                  ? 'Registered Property Owners'
                  : roleFilter === 'admin'
                  ? 'University Administrators'
                  : 'All Registered Platform Users'}
              </h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                Manage roles, verify institutional credentials, and moderate system privileges.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0 self-start sm:self-auto pt-0.5 sm:pt-0">
              <span>Sort:</span>
              <button
                type="button"
                onClick={() => {
                  setSortOrder((prev) => (prev === 'desc' ? 'asc' : prev === 'asc' ? 'name' : 'desc'));
                  setCurrentPage(1);
                }}
                className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-ateneo-blue"
              >
                <ArrowUpDown size={13} />
                <span>
                  {sortOrder === 'desc'
                    ? 'Newest First'
                    : sortOrder === 'asc'
                    ? 'Oldest First'
                    : 'Alphabetical (A-Z)'}
                </span>
              </button>
            </div>
          </div>

          {loading ? (
            <PageSkeleton variant="table" rows={6} cols={5} />
          ) : paginatedUsers.length === 0 ? (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center shadow-xs">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Users size={24} />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">No users found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No user profiles match the selected role or filter criteria.
              </p>
              {hasActiveFilters && (
                <div className="mt-4">
                  <Button size="sm" radius="full" variant="secondary" onClick={handleResetFilters}>
                    Clear Filter Criteria
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {paginatedUsers.map((u) => {
                const isAdmin = u.role === 'admin';
                const isStudent = u.role === 'student';
                const isOwner = u.role === 'owner';
                const isAdDU = u.email?.endsWith('@addu.edu.ph');
                const isPending = !isAdmin && u.verification_status === 'pending';
                const badgeVariant =
                  u.verification_status === 'approved'
                    ? 'verified'
                    : u.verification_status === 'rejected'
                    ? 'danger'
                    : 'pending';

                return (
                  <Card
                    key={u.id}
                    shadow="sm"
                    className="rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    <CardBody className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Left Info Container */}
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                          {/* User Avatar */}
                          <Avatar
                            size="md"
                            name={u.full_name || 'User'}
                            className={`h-11 w-11 text-xs font-bold shrink-0 ${
                              isAdmin
                                ? 'bg-indigo-600 text-white'
                                : isOwner
                                ? 'bg-amber-600 text-white'
                                : 'bg-ateneo-blue text-white'
                            }`}
                          />

                          {/* Details Metadata */}
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900 truncate">
                                {u.full_name || 'Unnamed User'}
                              </h3>
                              {isAdDU && (
                                <Chip size="sm" variant="flat" color="primary" className="text-[10px] font-bold h-5 px-1.5">
                                  @addu.edu.ph
                                </Chip>
                              )}
                              <Chip
                                size="sm"
                                variant="flat"
                                className={`font-semibold text-[11px] ${
                                  isAdmin
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : isOwner
                                    ? 'bg-amber-50 text-amber-800'
                                    : 'bg-blue-50 text-ateneo-blue'
                                }`}
                              >
                                {ROLE_LABELS[u.role] || u.role}
                              </Chip>
                              {!isAdmin && (
                                <Badge variant={badgeVariant}>
                                  {u.verification_status || 'pending'}
                                </Badge>
                              )}
                            </div>

                            {/* Email & Contact */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Mail size={13} className="text-slate-400 shrink-0" />
                                <span className="truncate">{u.email}</span>
                              </div>

                              {u.phone_number && (
                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <Phone size={13} className="text-slate-400 shrink-0" />
                                  <span>{u.phone_number}</span>
                                </div>
                              )}

                              {u.created_at && (
                                <div className="flex items-center gap-1 text-slate-400">
                                  <Calendar size={12} />
                                  <span>Registered {new Date(u.created_at).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Action Buttons */}
                        <div className="flex flex-row items-center justify-between lg:justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                          {isPending && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                radius="full"
                                variant="primary"
                                isLoading={processingId === u.id}
                                onClick={() => handleQuickApprove(u)}
                                startContent={processingId !== u.id && <CheckCircle2 size={14} strokeWidth={2} />}
                              >
                                Approve ID
                              </Button>

                              <Button
                                size="sm"
                                radius="full"
                                variant="danger"
                                disabled={processingId === u.id}
                                onClick={() => openRejectDialog(u)}
                                startContent={<XCircle size={14} strokeWidth={2} />}
                              >
                                Reject
                              </Button>
                            </div>
                          )}

                          <Button
                            size="sm"
                            radius="full"
                            variant="ghost"
                            onClick={() => openRoleModal(u)}
                            startContent={<UserCog size={14} strokeWidth={2} />}
                            className="text-xs text-slate-600 hover:text-slate-900"
                          >
                            Change Role
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ==================================================================== */}
          {/* SECTION 4: PAGINATION & DIRECTORY COUNTER */}
          {/* ==================================================================== */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 font-normal">
                Showing page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
                <span className="font-semibold text-slate-800">{totalPages}</span> ({filteredUsers.length} matching users)
              </p>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  radius="full"
                  variant="ghost"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-xs text-slate-400">…</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`h-7 w-7 rounded-full text-xs font-semibold transition-all ${
                          currentPage === p
                            ? 'bg-ateneo-blue text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}

                <Button
                  size="sm"
                  radius="full"
                  variant="ghost"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Role Change Modal */}
      {roleModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-ateneo-blue">
                <UserCog size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Change Account Role</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update platform permissions for "{roleModal.user?.full_name || 'User'}".
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <label className="text-xs font-semibold text-slate-700">Assign Platform Role</label>
              <div className="space-y-2">
                {[
                  {
                    id: 'student',
                    title: 'Student Tenant',
                    desc: 'Searches dorms, books rooms, submits Ateneo student verification ID.',
                    icon: User,
                  },
                  {
                    id: 'owner',
                    title: 'Property Owner',
                    desc: 'Publishes listings, manages tenants, submits business permits.',
                    icon: Building2,
                  },
                  {
                    id: 'admin',
                    title: 'University Administrator',
                    desc: 'Full administrative access to verify listings, approve IDs, and moderate reviews.',
                    icon: Shield,
                  },
                ].map((r) => {
                  const isSelected = roleModal.newRole === r.id;
                  const IconComponent = r.icon;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setRoleModal((m) => ({ ...m, newRole: r.id }))}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-ateneo-blue/80 bg-blue-50/40 ring-2 ring-ateneo-blue/15'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          isSelected ? 'bg-ateneo-blue text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <IconComponent size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{r.title}</h4>
                          {isSelected && <Check size={14} className="text-ateneo-blue" strokeWidth={3} />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{r.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                size="sm"
                radius="full"
                variant="ghost"
                onClick={() => setRoleModal({ isOpen: false, user: null, newRole: '' })}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                radius="full"
                variant="primary"
                isLoading={processingId === roleModal.user?.id}
                onClick={handleConfirmRoleChange}
              >
                Save Role Assignment
              </Button>
            </div>
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
                <h3 className="text-base font-bold text-slate-900">Reject Account Verification</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specify rejection remarks for "{rejectionModal.user?.full_name || 'Applicant'}".
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-slate-700">Administrative Rejection Reason</label>
              <textarea
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal((m) => ({ ...m, reason: e.target.value }))}
                placeholder="e.g. Unclear student ID, expired ID document, or non-matching registered name."
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-ateneo-blue focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                size="sm"
                radius="full"
                variant="ghost"
                onClick={() => setRejectionModal({ isOpen: false, user: null, reason: '' })}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                radius="full"
                variant="danger"
                isLoading={processingId === rejectionModal.user?.id}
                onClick={handleConfirmReject}
                startContent={processingId !== rejectionModal.user?.id && <XCircle size={14} strokeWidth={2} />}
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
