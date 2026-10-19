import { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Tabs,
  Tab,
  Chip,
  Progress,
  Divider,
  Switch,
  Alert,
  Calendar,
  DatePicker,
  DateRangePicker,
  TimeInput,
  Badge as HeroUIBadge,
  Avatar,
  AvatarGroup,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { parseDate, parseTime, today, getLocalTimeZone } from '@internationalized/date';
import {
  Building2,
  Users,
  BedDouble,
  CreditCard,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  Star,
  Flag,
  Wrench,
  MapPin,
  CheckCircle2,
  XCircle,
  Award,
  Footprints,
  Plus,
  Send,
  Eye,
  Camera,
  Trash2,
  RefreshCw,
  Search,
  ExternalLink,
  Info,
  Calendar as CalendarIcon,
  Check,
  Bell,
  Sliders,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input, Textarea } from '../../components/common/Input';
import { Checkbox, CheckboxGroup } from '../../components/common/Checkbox';
import { Radio, RadioGroup } from '../../components/common/Radio';
import { Badge } from '../../components/common/Badge';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { WalkingTimeBadge } from '../../components/map/WalkingTimeBadge';
import { PropertyCard } from '../../components/property/PropertyCard';
import { PaymentTable } from '../../components/dashboard/PaymentTable';
import { PageSkeleton } from '../../components/common/PageSkeleton';
import { PageTransition, StaggerContainer, StaggerItem } from '../../components/common/PageTransition';
import { useToast } from '../../hooks/useToast';

export function ComponentsShowcasePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('kpis');
  const [btnLoading, setBtnLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [skeletonVariant, setSkeletonVariant] = useState('dashboard');
  const [simulatedLoading, setSimulatedLoading] = useState(false);
  const [entranceKey, setEntranceKey] = useState(0);

  // State for interactive showcase controls
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [selectedInterests, setSelectedInterests] = useState(['travel', 'music']);
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [autoVerify, setAutoVerify] = useState(false);
  const [dateValue, setDateValue] = useState(today(getLocalTimeZone()));
  const [timeValue, setTimeValue] = useState(parseTime('09:00'));

  // Sample data for PropertyCard showcase
  const sampleProperty = {
    id: 'sample-prop-1',
    name: 'Ivory Residences - Room 1104',
    type: 'condominium',
    address: 'J.P. Laurel Ave, Poblacion District, Davao City',
    min_price: 35000,
    walking_minutes: 8,
    is_verified: true,
    available_rooms: 2,
    primary_image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
  };

  // Sample data for PaymentTable showcase
  const samplePayments = [
    {
      id: 'pay-1',
      tenant_name: 'Juan Dela Cruz',
      property_name: 'Ivory Residences',
      amount: 12000,
      due_date: '2026-10-15',
      status: 'paid',
      receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'pay-2',
      tenant_name: 'Maria Santos',
      property_name: 'Juan Boarding House',
      amount: 4500,
      due_date: '2026-10-05',
      status: 'pending',
      receipt_url: null,
    },
    {
      id: 'pay-3',
      tenant_name: 'Carlos Yulo',
      property_name: 'Juan Luna Boarding House',
      amount: 5800,
      due_date: '2026-09-30',
      status: 'overdue',
      receipt_url: null,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 pb-24">
      {/* Top Sticky Showcase Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-4 shadow-xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ateneo-blue text-white font-extrabold shadow-sm">
              DS
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                DormSafe Design System & Components Library
              </h1>
              <p className="text-xs text-slate-500">
                HeroUI Components • Form Controls • Date & Time • Alerts • Skeletons • Transitions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              Back to App
            </a>
            <Button
              size="sm"
              radius="full"
              variant={showSkeleton ? 'primary' : 'secondary'}
              onClick={() => setShowSkeleton(!showSkeleton)}
              startContent={<RefreshCw size={13} className={showSkeleton ? 'animate-spin' : ''} />}
            >
              {showSkeleton ? 'Exit Skeleton Mode' : 'Preview Live Skeletons'}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
        {/* Navigation Tabs */}
        <div className="mb-8 flex overflow-x-auto pb-2 scrollbar-none">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(k) => setActiveTab(k)}
            color="primary"
            variant="solid"
            radius="full"
            classNames={{
              tabList: 'bg-white shadow-xs border border-slate-200/80 p-1.5 rounded-full gap-1',
              cursor: 'bg-ateneo-blue shadow-sm rounded-full',
              tab: 'h-9 px-5 text-xs font-semibold rounded-full data-[selected=true]:text-white text-slate-600',
            }}
          >
            <Tab key="kpis" title="KPI Cards (Depths & Outlines)" />
            <Tab key="buttons" title="Buttons & Actions" />
            <Tab key="forms" title="Forms & Inputs (Pulled)" />
            <Tab key="datetime" title="Date & Time (Pulled)" />
            <Tab key="alerts" title="Alerts & Banners (Pulled)" />
            <Tab key="datadisplay" title="Data Display (Pulled)" />
            <Tab key="property-cards" title="Property Cards" />
            <Tab key="tables" title="Data Tables" />
            <Tab key="skeletons" title="Dynamic Skeletons" />
            <Tab key="transitions" title="Graceful Page Transitions" />
          </Tabs>
        </div>

        {/* ==================================================================== */}
        {/* TAB 1: KPI CARDS WITH DIFFERENT DEPTHS, SHADOWS & OUTLINES */}
        {/* ==================================================================== */}
        {activeTab === 'kpis' && (
          <div className="space-y-12">
            {/* Style 1: Modern Executive Glass */}
            <section className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    Style 1: Modern Executive (Clean 1px Border + Subtle Drop Shadow)
                  </h2>
                  <Chip size="sm" color="primary" variant="flat" className="text-[10px] font-bold">
                    Official Standard
                  </Chip>
                </div>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                  Uses non-truncating responsive grids, squircle icon badges, high-contrast numbers, and HeroUI Progress mini-gauges.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  label="Total Properties"
                  value="12"
                  icon={<Building2 size={18} strokeWidth={2} />}
                  variant="default"
                  trend="Active"
                  subtext="managed across Davao"
                />

                <StatsCard
                  label="Occupied Units"
                  value="38"
                  icon={<Users size={18} strokeWidth={2} />}
                  variant="occupied"
                  trend="86% filled"
                  subtext="out of 44 total beds"
                />

                <StatsCard
                  label="Vacant Ready"
                  value="6"
                  icon={<BedDouble size={18} strokeWidth={2} />}
                  variant="vacant"
                  trend="14% ready"
                  subtext="available for rent"
                />

                <StatsCard
                  label="Monthly Revenue"
                  value="₱184,500"
                  icon={<CreditCard size={18} strokeWidth={2} />}
                  variant="revenue"
                  trend="Verified"
                  subtext="collected this cycle"
                />
              </div>
            </section>

            {/* Style 2: Accent Border Top */}
            <section className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Style 2: Accent Border Glow Cards (Ateneo Gold / Semantic Top Indicator)
                </h2>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                  Adds a crisp 3px colored indicator stripe along the top edge for high visual separation.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card shadow="sm" className="rounded-2xl border-t-3 border-t-ateneo-blue border-x border-b border-slate-200/90 bg-white p-5 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Total Dorms
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-ateneo-blue">
                      <Building2 size={16} strokeWidth={2} />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">12</p>
                  <p className="mt-1 text-xs text-slate-500 font-medium">All registered properties</p>
                </Card>

                <Card shadow="sm" className="rounded-2xl border-t-3 border-t-rose-500 border-x border-b border-slate-200/90 bg-white p-5 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Occupancy
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                      <Users size={16} strokeWidth={2} />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">86%</p>
                  <p className="mt-1 text-xs text-slate-500 font-medium">38 rooms filled</p>
                </Card>

                <Card shadow="sm" className="rounded-2xl border-t-3 border-t-emerald-500 border-x border-b border-slate-200/90 bg-white p-5 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Vacant Units
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <BedDouble size={16} strokeWidth={2} />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">6</p>
                  <p className="mt-1 text-xs text-slate-500 font-medium">Ready for new tenants</p>
                </Card>

                <Card shadow="sm" className="rounded-2xl border-t-3 border-t-ateneo-gold border-x border-b border-slate-200/90 bg-white p-5 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Revenue
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <CreditCard size={16} strokeWidth={2} />
                    </div>
                  </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">₱184,500</p>
                  <p className="mt-1 text-xs text-slate-500 font-medium">Verified monthly cashflow</p>
                </Card>
              </div>
            </section>

            {/* Style 3: Admin Action Queue */}
            <section className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-slate-900">
                  Style 3: Admin Action Queue (Fixed Grid without Text Truncation)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Responsive 3-to-6 columns with ample padding so labels like "Listing Reports" and "Uncleared Stays" never truncate.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatsCard
                  label="Pending Listings"
                  value="3"
                  variant="pending"
                  icon={<FileText size={16} />}
                  subtext="requires review"
                />
                <StatsCard
                  label="Pending Accounts"
                  value="5"
                  variant="pending"
                  icon={<UserCheck size={16} />}
                  subtext="IDs waiting"
                />
                <StatsCard
                  label="Pending Reviews"
                  value="2"
                  variant="pending"
                  icon={<Star size={16} />}
                  subtext="moderation queue"
                />
                <StatsCard
                  label="Listing Reports"
                  value="1"
                  variant="danger"
                  icon={<Flag size={16} />}
                  subtext="user flagged"
                />
                <StatsCard
                  label="Uncleared Stays"
                  value="0"
                  variant="default"
                  icon={<Clock size={16} />}
                  subtext="expired leases"
                />
                <StatsCard
                  label="Open Maintenance"
                  value="4"
                  variant="pending"
                  icon={<Wrench size={16} />}
                  subtext="active tickets"
                />
              </div>
            </section>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: BUTTONS & ACTIONS */}
        {/* ==================================================================== */}
        {activeTab === 'buttons' && (
          <div className="space-y-8">
            <Card shadow="sm" className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  HeroUI Official Pill Radius (`radius="full"`)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Smooth curved pill buttons matching the official HeroUI website design system.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button radius="full" variant="primary" startContent={<Plus size={15} />}>
                  Primary Action
                </Button>
                <Button radius="full" variant="secondary" startContent={<Eye size={15} />}>
                  Secondary Action
                </Button>
                <Button radius="full" variant="success" startContent={<UserCheck size={15} />}>
                  Success / Approve
                </Button>
                <Button radius="full" variant="ghost" startContent={<RefreshCw size={15} />}>
                  Ghost / Tertiary
                </Button>
                <Button radius="full" variant="danger" startContent={<Trash2 size={15} />}>
                  Destructive Action
                </Button>
              </div>

              <Divider />

              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Standard Sizing Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  sm (32px, text-xs), md (40px, text-sm, default), lg (48px, text-base)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button radius="full" size="sm" variant="primary" startContent={<Plus size={14} />}>
                  Small (sm: h-8, px-3)
                </Button>
                <Button radius="full" size="md" variant="primary" startContent={<Plus size={16} />}>
                  Medium (md: h-10, px-4 - Default)
                </Button>
                <Button radius="full" size="lg" variant="primary" startContent={<Plus size={18} />}>
                  Large (lg: h-12, px-6)
                </Button>
              </div>

              <Divider />

              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  States & Dynamic Loading
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  radius="full"
                  variant="primary"
                  isLoading={btnLoading}
                  onClick={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 2000);
                  }}
                >
                  {btnLoading ? 'Processing…' : 'Click to Test Loading Spinner'}
                </Button>

                <Button radius="full" variant="primary" disabled>
                  Disabled State
                </Button>

                <Button radius="full" variant="secondary" disabled>
                  Disabled Secondary
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: FORMS & INPUTS (PULLED FROM SCREENSHOTS 1, 2, 6) */}
        {/* ==================================================================== */}
        {activeTab === 'forms' && (
          <div className="space-y-8">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900">
                HeroUI Form Controls & Selection Inputs
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                RadioGroup with descriptions, SearchField, floating TextFields, TextArea, CheckboxGroup, and Toggle Switches.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* RadioGroup (Screenshot 1) */}
              <Card shadow="sm" className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    RadioGroup (Screenshot 1)
                  </h3>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                    Plan selection with custom subtitle descriptions.
                  </p>
                </div>

                <RadioGroup
                  label="Plan subscription"
                  value={selectedPlan}
                  onValueChange={setSelectedPlan}
                >
                  <Radio value="basic" description="Includes 100 messages per month">
                    Basic
                  </Radio>
                  <Radio value="premium" description="Includes 200 messages per month">
                    Premium
                  </Radio>
                  <Radio value="business" description="Includes 1,000 messages per month">
                    Business
                  </Radio>
                </RadioGroup>
              </Card>

              {/* Checkbox & CheckboxGroup (Screenshot 2) */}
              <Card shadow="sm" className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    CheckboxGroup & Descriptions (Screenshot 2)
                  </h3>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                    Multi-select amenities matching the exact Radio typography and tile layout.
                  </p>
                </div>

                <CheckboxGroup
                  label="Interests & Amenities"
                  value={selectedInterests}
                  onValueChange={setSelectedInterests}
                >
                  <Checkbox value="travel" description="Exploring new places, and campus shuttles">
                    Travel & Commute
                  </Checkbox>
                  <Checkbox value="music" description="Passion for music in its various forms">
                    Music & Media
                  </Checkbox>
                  <Checkbox value="food" description="Curiosity about various dining & cooking">
                    Food & Kitchen Access
                  </Checkbox>
                </CheckboxGroup>
              </Card>

              {/* SearchField & TextField & TextArea (Screenshot 1) */}
              <Card shadow="sm" className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-5">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    SearchField, TextField & TextArea (Screenshot 1)
                  </h3>
                  <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                    Floating labels, clearable searches, and multiline textareas.
                  </p>
                </div>

                {/* SearchField */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Search
                  </label>
                  <Input
                    placeholder="Search dorms, tenants, listings..."
                    startContent={<Search size={16} className="text-slate-400" />}
                    isClearable
                    radius="lg"
                    className="w-full"
                  />
                </div>

                {/* TextField with Required Asterisk */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Your name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <Input
                    placeholder="John Doe"
                    defaultValue="John"
                    radius="lg"
                    description="We'll never share this with anyone else"
                    className="w-full"
                  />
                </div>

                {/* TextArea */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Inquiry Message / Project Update
                  </label>
                  <Textarea
                    placeholder="Share a quick project update or message to the landlord..."
                    radius="lg"
                    minRows={3}
                    className="w-full"
                  />
                </div>
              </Card>

              {/* Switches & Toggle Controls (Screenshot 6) */}
              <Card shadow="sm" className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Switch & Toggle Controls (Screenshot 6)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Animated state toggles with primary active glow.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Allow notifications</p>
                      <p className="text-xs text-slate-500">Receive push notifications from DormSafe</p>
                    </div>
                    <Switch
                      isSelected={allowNotifications}
                      onValueChange={setAllowNotifications}
                      color="primary"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Auto-verify Ateneo ID</p>
                      <p className="text-xs text-slate-500">Instant approval for @addu.edu.ph email domains</p>
                    </div>
                    <Switch
                      isSelected={autoVerify}
                      onValueChange={setAutoVerify}
                      color="primary"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Maintenance Emergency Alert</p>
                      <p className="text-xs text-slate-500">Notify campus safety patrol immediately</p>
                    </div>
                    <Switch defaultSelected color="danger" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: DATE AND TIME (PULLED FROM SCREENSHOT 4) */}
        {/* ==================================================================== */}
        {activeTab === 'datetime' && (
          <div className="space-y-8">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900">
                HeroUI Date & Time Components (Screenshot 4)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full Calendar, DatePicker, DateRangePicker, and TimeField with Ateneo Blue highlights.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Interactive Calendar */}
              <Card shadow="sm" className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Calendar
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monthly calendar date selector.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Calendar
                    aria-label="Date selector"
                    value={dateValue}
                    onChange={setDateValue}
                    color="primary"
                  />
                </div>
              </Card>

              {/* DatePicker & DateRangePicker */}
              <Card shadow="sm" className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    DatePicker & Range Picker
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Popup calendars for lease start and end periods.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Move-in Date <span className="text-red-500 font-bold">*</span>
                    </label>
                    <DatePicker
                      aria-label="Move-in Date"
                      value={dateValue}
                      onChange={setDateValue}
                      color="primary"
                      className="w-full"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">Enter a date from today onwards</p>
                  </div>

                  <Divider />

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Lease Term (Date Range)
                    </label>
                    <DateRangePicker
                      aria-label="Lease Duration"
                      color="primary"
                      className="w-full"
                    />
                    <p className="mt-1 text-[11px] text-slate-400">Semester or annual rental period</p>
                  </div>
                </div>
              </Card>

              {/* TimeField / TimeInput */}
              <Card shadow="sm" className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    TimeInput (Curfew & Visits)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Schedule property viewing or gate curfew hours.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Visiting Hours Time <span className="text-red-500 font-bold">*</span>
                  </label>
                  <TimeInput
                    aria-label="Visiting Hours Time"
                    value={timeValue}
                    onChange={setTimeValue}
                    color="primary"
                    className="w-full"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Enter a time between 8:00 AM and 8:00 PM</p>
                </div>

                <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-4 text-xs text-ateneo-blue space-y-1">
                  <p className="font-bold">Ateneo Campus Guidelines</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Student boarding house visitors must sign in before 7:00 PM as mandated by the Ateneo Student Affairs Office.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 5: ALERTS & BANNERS (PULLED FROM SCREENSHOT 3) */}
        {/* ==================================================================== */}
        {activeTab === 'alerts' && (
          <div className="space-y-8">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900">
                HeroUI Alert Banners (Screenshot 3)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rich notification banners with action buttons, status icons, and semantic colors.
              </p>
            </div>

            <div className="space-y-4">
              {/* Exact Screenshot 3 Invite Alert */}
              <Alert
                color="default"
                title="You have an invite"
                description="Bob sent you an invitation to join the Ivory Residences Room 1104 tenant group."
                endContent={
                  <Button size="sm" radius="full" variant="primary">
                    Confirm
                  </Button>
                }
              />

              {/* Success Alert */}
              <Alert
                color="success"
                title="Student Account Verified"
                description="Your Ateneo student ID has been approved. You now have full access to verified dorm listings."
                endContent={
                  <Button size="sm" radius="full" variant="secondary">
                    View Listings
                  </Button>
                }
              />

              {/* Warning Alert */}
              <Alert
                color="warning"
                title="Lease Expiring in 14 Days"
                description="Your rental agreement for Unit 302 expires on October 15, 2026. Please confirm renewal with your landlord."
                endContent={
                  <Button size="sm" radius="full" variant="primary">
                    Renew Lease
                  </Button>
                }
              />

              {/* Danger Alert */}
              <Alert
                color="danger"
                title="Overdue Rent Notice"
                description="Payment for September cycle is past due. Please settle balance to avoid late fee penalties."
                endContent={
                  <Button size="sm" radius="full" variant="danger">
                    Pay Now
                  </Button>
                }
              />
            </div>

            {/* Bottom-Right Universal Toast Notifications Showcase */}
            <div className="space-y-4 pt-6 border-t border-slate-200/80">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Universal Bottom-Right Toast Notifications (Framer Motion)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Floating stacked notifications fixed at the bottom-right corner with 4s auto-dismiss and hover pause.
                </p>
              </div>

              <Card shadow="sm" className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    radius="full"
                    variant="primary"
                    startContent={<CheckCircle2 size={14} />}
                    onClick={() => toast.success('Listing approved and published to student search!')}
                  >
                    Trigger Success Toast
                  </Button>

                  <Button
                    size="sm"
                    radius="full"
                    variant="danger"
                    startContent={<XCircle size={14} />}
                    onClick={() => toast.error('Failed to connect to backend service. Please check network.')}
                  >
                    Trigger Error Toast
                  </Button>

                  <Button
                    size="sm"
                    radius="full"
                    variant="secondary"
                    startContent={<AlertTriangle size={14} />}
                    onClick={() => toast.warning('Account verification rejected due to blurry ID upload.')}
                  >
                    Trigger Warning Toast
                  </Button>

                  <Button
                    size="sm"
                    radius="full"
                    variant="ghost"
                    startContent={<Info size={14} />}
                    onClick={() => toast.info('Syncing real-time campus housing capacity data…')}
                  >
                    Trigger Info Toast
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 6: DATA DISPLAY (PULLED FROM SCREENSHOT 5) */}
        {/* ==================================================================== */}
        {activeTab === 'datadisplay' && (
          <div className="space-y-8">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900">
                HeroUI Data Display: Badges, Chips & Usage Table (Screenshot 5)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Avatar notification badges, status indicator chips, and dark/light metric tables.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Badges on Avatars */}
              <Card shadow="sm" className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Avatar Badges (Screenshot 5)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Online status indicators and unread count badges.
                  </p>
                </div>

                <div className="flex items-center justify-around py-4">
                  {/* Dot Badge */}
                  <HeroUIBadge color="success" content="" shape="circle" placement="bottom-right">
                    <Avatar
                      isBordered
                      color="primary"
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                      size="lg"
                    />
                  </HeroUIBadge>

                  {/* Number Badge */}
                  <HeroUIBadge color="danger" content="5" shape="circle" placement="top-right">
                    <Avatar
                      isBordered
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                      size="lg"
                    />
                  </HeroUIBadge>
                </div>
              </Card>

              {/* Status Chips with Glow Dots (Screenshot 5) */}
              <Card shadow="sm" className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Status Chips (Screenshot 5)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Matching In review, Completed, Pending, and Failed states.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3 py-2">
                  <Chip variant="flat" color="default" radius="full" className="px-3 py-1 font-semibold text-xs">
                    In review
                  </Chip>
                  <Chip variant="flat" color="success" radius="full" className="px-3 py-1 font-semibold text-xs text-emerald-700 bg-emerald-50">
                    Completed
                  </Chip>
                  <Chip variant="flat" color="warning" radius="full" className="px-3 py-1 font-semibold text-xs text-amber-700 bg-amber-50">
                    Pending
                  </Chip>
                  <Chip variant="flat" color="danger" radius="full" className="px-3 py-1 font-semibold text-xs text-rose-700 bg-rose-50">
                    Failed
                  </Chip>
                </div>
              </Card>

              {/* Metric Table (Screenshot 5) */}
              <Card shadow="sm" className="rounded-3xl border border-slate-200/90 bg-white p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Usage Metric Table (Screenshot 5)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Structured key-value metrics.
                  </p>
                </div>

                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50 p-2">
                  <div className="flex items-center justify-between p-2.5 text-xs">
                    <span className="font-semibold text-slate-600">Total API Requests</span>
                    <span className="font-bold text-slate-900">33.1K</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 text-xs">
                    <span className="font-semibold text-slate-600">Input Tokens</span>
                    <span className="font-bold text-slate-900">86.2M</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 text-xs">
                    <span className="font-semibold text-slate-600">Output Tokens</span>
                    <span className="font-bold text-slate-900">52M</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 text-xs">
                    <span className="font-semibold text-slate-600">Total Spend</span>
                    <span className="font-bold text-ateneo-blue">₱149.01</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 7: PROPERTY CARDS */}
        {/* ==================================================================== */}
        {activeTab === 'property-cards' && (
          <div className="space-y-8">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900">
                Property & Entity Cards
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Features image hover zoom, verified badge overlay, price tags, and proximity indicators.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <PropertyCard property={sampleProperty} gate="Jacinto Gate" />
              <PropertyCard
                property={{
                  ...sampleProperty,
                  id: 'sample-prop-2',
                  name: 'Juan Boarding House',
                  type: 'boarding_house',
                  min_price: 4500,
                  walking_minutes: 4,
                  available_rooms: 4,
                  primary_image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
                }}
                gate="Jacinto Gate"
              />
              <PropertyCard
                property={{
                  ...sampleProperty,
                  id: 'sample-prop-3',
                  name: 'Juan Luna Boarding House',
                  type: 'dormitory',
                  min_price: 5800,
                  walking_minutes: 16,
                  is_verified: false,
                  available_rooms: 1,
                  primary_image: null,
                }}
                gate="Roxas Gate"
              />
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 8: DATA TABLES */}
        {/* ==================================================================== */}
        {activeTab === 'tables' && (
          <div className="space-y-8">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900">
                HeroUI Data Table
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Clean table rows, status chips, receipt preview links, and action buttons.
              </p>
            </div>

            <PaymentTable
              payments={samplePayments}
              onMarkPaid={(id) => toast.success(`Marked payment #${id} as paid!`)}
              onUploadReceipt={(id, file) => toast.info(`Uploaded receipt for payment #${id}: ${file.name}`)}
            />
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 9: DYNAMIC SHIMMERING SKELETONS */}
        {/* ==================================================================== */}
        {(activeTab === 'skeletons' || showSkeleton) && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Universal Dynamic Skeletons with Animated Shimmer Wave
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Single component &lt;PageSkeleton variant="..." /&gt; matching all page archetypes.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {['dashboard', 'grid', 'table', 'detail', 'form'].map((v) => (
                  <Button
                    key={v}
                    size="sm"
                    radius="full"
                    variant={skeletonVariant === v ? 'primary' : 'secondary'}
                    onClick={() => setSkeletonVariant(v)}
                    className="capitalize text-xs"
                  >
                    {v} Skeleton
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <PageSkeleton variant={skeletonVariant} count={4} rows={4} />
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 10: GRACEFUL PAGE TRANSITIONS & CROSS-FADE SIMULATOR */}
        {/* ==================================================================== */}
        {activeTab === 'transitions' && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Graceful Page Transitions & Shimmer-to-Content Cross-Fade
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Single component &lt;PageTransition isLoading=&#123;...&#125; skeleton=&#123;...&#125;&gt; eliminates jarring pop-ins with smooth cubic-bezier easing.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  radius="full"
                  variant="primary"
                  onClick={() => setEntranceKey((k) => k + 1)}
                  startContent={<RefreshCw size={14} />}
                >
                  Replay Entrance Motion
                </Button>

                <Button
                  size="sm"
                  radius="full"
                  variant={simulatedLoading ? 'danger' : 'secondary'}
                  onClick={() => {
                    setSimulatedLoading(true);
                    setTimeout(() => setSimulatedLoading(false), 1600);
                  }}
                  startContent={<Sparkles size={14} />}
                >
                  {simulatedLoading ? 'Cross-fading…' : 'Simulate Async Load (1.6s)'}
                </Button>
              </div>
            </div>

            {/* Live Interactive Transition Sandbox */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <PageTransition
                key={entranceKey}
                isLoading={simulatedLoading}
                skeleton={<PageSkeleton variant="dashboard" count={4} />}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Live Hydrated Page State
                      </p>
                      <h3 className="text-xl font-black tracking-tight text-slate-900">
                        Owner Executive Overview
                      </h3>
                    </div>
                    <Chip color="success" variant="flat" size="sm" className="font-bold text-xs">
                      Hydrated & Ready
                    </Chip>
                  </div>

                  {/* Staggered KPI Grid */}
                  <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StaggerItem>
                      <StatsCard
                        label="Total Properties"
                        value="12"
                        icon={<Building2 size={18} strokeWidth={2} />}
                        variant="default"
                        trend="Active"
                        subtext="managed across Davao"
                      />
                    </StaggerItem>

                    <StaggerItem>
                      <StatsCard
                        label="Occupied Units"
                        value="38"
                        icon={<Users size={18} strokeWidth={2} />}
                        variant="occupied"
                        trend="86% filled"
                        subtext="out of 44 total beds"
                      />
                    </StaggerItem>

                    <StaggerItem>
                      <StatsCard
                        label="Vacant Ready"
                        value="6"
                        icon={<BedDouble size={18} strokeWidth={2} />}
                        variant="vacant"
                        trend="14% ready"
                        subtext="available for rent"
                      />
                    </StaggerItem>

                    <StaggerItem>
                      <StatsCard
                        label="Monthly Revenue"
                        value="₱184,500"
                        icon={<CreditCard size={18} strokeWidth={2} />}
                        variant="revenue"
                        trend="Verified"
                        subtext="collected this cycle"
                      />
                    </StaggerItem>
                  </StaggerContainer>

                  {/* Staggered Sample Listing */}
                  <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                    <StaggerItem>
                      <PropertyCard property={sampleProperty} gate="Jacinto Gate" />
                    </StaggerItem>
                    <StaggerItem>
                      <PropertyCard
                        property={{
                          ...sampleProperty,
                          id: 'sample-prop-2',
                          name: 'Juan Boarding House',
                          type: 'boarding_house',
                          min_price: 4500,
                          walking_minutes: 4,
                          available_rooms: 4,
                          primary_image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
                        }}
                        gate="Jacinto Gate"
                      />
                    </StaggerItem>
                    <StaggerItem>
                      <PropertyCard
                        property={{
                          ...sampleProperty,
                          id: 'sample-prop-3',
                          name: 'Juan Luna Boarding House',
                          type: 'dormitory',
                          min_price: 5800,
                          walking_minutes: 16,
                          is_verified: false,
                          available_rooms: 1,
                          primary_image: null,
                        }}
                        gate="Roxas Gate"
                      />
                    </StaggerItem>
                  </StaggerContainer>
                </div>
              </PageTransition>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
