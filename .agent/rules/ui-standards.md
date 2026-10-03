---
description: Official UI Design Standards, Typography Hierarchy, Theme Tokens, Component Specifications, and Golden Page Guidelines for DormSafe
globs: ["client/src/**/*"]
alwaysApply: true
---

# DormSafe Official UI & Design Standards

This document establishes the mandatory visual hierarchy, theme tokens, typography rules, component sizing matrices, and layout standards across the entire DormSafe platform. Every frontend component, page, and modal must strictly follow these rules.

---

## 1. Golden Reference Rule: Check Existing Pages First!

> [!IMPORTANT]
> **BEFORE creating or editing any page, view and align with the existing live reference implementations:**
> - **Executive Dashboard Standard**: [`client/src/pages/admin/AdminDashboardPage.jsx`](file:///C:/Users/nyanc/OneDrive/Desktop/wow/DormSafe/client/src/pages/admin/AdminDashboardPage.jsx)
> - **Interactive Component Library & Tokens**: [`client/src/pages/dev/ComponentsShowcasePage.jsx`](file:///C:/Users/nyanc/OneDrive/Desktop/wow/DormSafe/client/src/pages/dev/ComponentsShowcasePage.jsx)
> - **Universal App Shell & Navigation**: [`client/src/components/layout/AppShell.jsx`](file:///C:/Users/nyanc/OneDrive/Desktop/wow/DormSafe/client/src/components/layout/AppShell.jsx) and [`client/src/components/layout/AppSidebar.jsx`](file:///C:/Users/nyanc/OneDrive/Desktop/wow/DormSafe/client/src/components/layout/AppSidebar.jsx)

---

## 2. Mandatory Component-First Architecture (ALWAYS USE REUSABLE COMPONENTS!)

Never create ad-hoc raw HTML or inline CSS when official components exist:

| Component | Path | Standard Usage |
| :--- | :--- | :--- |
| `<BrandLogo />` | `client/src/components/common/BrandLogo.jsx` | Always use for brand mark (`size="xs|sm|md|lg|xl"`). Never write plain "DS" boxes. |
| `<Button />` | `client/src/components/common/Button.jsx` | Always use for clickable actions. Default to `radius="full"` with Lucide start icons. |
| `<StatsCard />` | `client/src/components/dashboard/StatsCard.jsx` | Compact ~80px KPI metric cards with baseline-aligned values and subtexts. |
| `<PageSkeleton />` | `client/src/components/common/PageSkeleton.jsx` | Universal shimmer loading states (`variant="dashboard|table|grid|detail|form"`). |
| `<PageTransition />` | `client/src/components/common/PageTransition.jsx` | Graceful cubic-bezier entry and exit wrapper for all route views. |
| `<PageContainer />` | `client/src/components/layout/PageContainer.jsx` | Standardized page layout wrapper with universal margins and breadcrumbs. |
| `<Badge />` / `<Chip />` | `client/src/components/common/Badge.jsx` | Status indicator pills (`verified`, `pending`, `danger`, `occupied`, `default`). |
| `<Input />` / `<Select />` | `client/src/components/common/Input.jsx` | Form fields with unified 12px radii (`rounded-xl`), labels, and focus rings. |
| `<DocumentViewer />` | `client/src/components/common/DocumentViewer.jsx` | Modal preview for IDs, permits, and lease documentation. |

---

## 3. Centralized Theme System (`client/src/theme/tokens.js`)

All brand colors, semantic states, corner radii, and standard sizes are centralized in `client/src/theme/tokens.js` as the single source of truth.

### Brand & Semantic Color Tokens

| Token Name | Hex Code | Tailwind / CSS Class | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| **Ateneo Blue (Primary)** | `#003366` | `bg-ateneo-blue`, `text-ateneo-blue` | Primary buttons, active nav links, headers, key accents |
| **Ateneo Blue Light** | `#004080` | `hover:bg-[#004080]` | Primary button hover state |
| **Ateneo Gold (Secondary)** | `#C5A900` | `border-ateneo-gold`, `text-amber-700` | Secondary badges, VIP / Premium accents, star ratings |
| **Success (Occupied / Approved)** | `#10B981` | `bg-emerald-50`, `text-emerald-700` | Verified accounts, completed transactions, active stays |
| **Warning (Pending / In Review)** | `#F59E0B` | `bg-amber-50`, `text-amber-700` | Pending approvals, expiring leases, review queues |
| **Danger (Overdue / Flagged)** | `#F43F5E` | `bg-rose-50`, `text-rose-700` | Overdue balances, reported listings, destructive actions |
| **Info / Shuttles** | `#0284C7` | `bg-sky-50`, `text-sky-700` | Transit updates, campus notices, info tips |
| **Neutral Background** | `#F8FAFC` | `bg-slate-50` / `bg-slate-50/80` | Page body and panel backgrounds |
| **Neutral Border** | `#E2E8F0` | `border-slate-200/90` | 1px clean crisp card borders |

---

## 4. Typography & Hierarchy Standard (Strict Rule)

### A. Section Headers
- **Standard**: Clean Title Case / Sentence Case (**NEVER ALL-CAPSLOCK**).
- **Font Size & Weight**: `text-base font-semibold text-slate-900` *(downscaled, refined weight — never excessively thick or heavy)*.
- **Subtext / Description**: `text-xs text-slate-500 font-normal leading-relaxed mt-0.5`.
- **Pattern**:
  ```jsx
  <div className="border-b border-slate-200 pb-2 mb-4">
    <h2 className="text-base font-semibold text-slate-900">
      Section Title Here
    </h2>
    <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
      Descriptive explanation of the section and actions available.
    </p>
  </div>
  ```

### B. KPI Cards & Metrics (Compact Executive Standard)
- **Container**: `rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xs p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all duration-200`.
- **Height**: Compact **~80px** total height (never excessively tall).
- **Top Row**: Label (`text-[11px] font-bold uppercase tracking-wider text-slate-500`) + Icon badge (`h-7 w-7 rounded-lg`).
- **Bottom Row**: Value (`text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 leading-none`) aligned baseline with muted Subtext (`text-[11px] font-medium text-slate-400`).
- **Strictly Follow `AdminDashboardPage.jsx`**: **NEVER pass extraneous `trend` pill chips** (e.g. `trend="Active"`, `trend="Total"`, `trend="Landlords"`) on standard KPI cards. Only use `label`, `value`, `variant`, `icon`, and `subtext`. The golden KPI cards are clean and uncluttered.

### C. Page Titles & Body Text
- **Page Title**: `text-2xl sm:text-3xl font-bold tracking-tight text-slate-900`.
- **Page Subtitle**: `text-xs sm:text-sm text-slate-500 font-normal mt-1`.
- **Field Label**: `text-xs font-semibold text-slate-700 mb-1.5`.
- **Field Subtext / Helper**: `text-[11px] text-slate-400 font-normal mt-1`.
- **Table Column Header**: `text-[11px] font-bold uppercase tracking-wider text-slate-400`.

---

## 5. Button System & Standard Sizing Matrix

Every button in the application must use `client/src/components/common/Button.jsx`:

### Sizing Matrix

| Size | Height | Typography | Horizontal Padding | Icon Size | Standard Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`sm`** | `32px` (`h-8`) | `text-xs font-semibold` | `px-3` | `14px` (`size={14}`) | Table row actions, dense cards, inline filters, alert CTAs |
| **`md` (Default)** | `40px` (`h-10`) | `text-sm font-semibold` | `px-4` | `16px` (`size={16}`) | Standard form submits, dialog footers, default action buttons |
| **`lg`** | `48px` (`h-12`) | `text-base font-semibold` | `px-6` | `18px` (`size={18}`) | Hero CTAs, main search submit, prominent booking actions |

### Radius Standards
- **Default Profile**: `radius="full"` (Pill curve matching modern platform standards).

---

## 6. Strict Iconography Rule (Zero-Emoji Policy)

- **Under NO circumstances are raw emojis allowed** in UI text, buttons, tabs, tables, or alerts.
- **Always import semantic SVG vector icons from `lucide-react`**:
  - Button Action Icons: `size={14-16}`, `strokeWidth={2}`
  - KPI Squircle Icons: `size={16-18}`, `strokeWidth={2}`
  - Dense Table Icons: `size={14}`, `strokeWidth={1.75}`
  - Input Start Content Icons: `size={16}`, `text-slate-400`

---

## 7. Animation & Motion Standards

- **Route Changes**: Wrapped with `<PageTransition>` in `AppShell.jsx` (smooth cubic-bezier `[0.16, 1, 0.3, 1]` with subtle `8px` translateY float).
- **Data Loading**: Continuous linear shimmer wave (`<PageSkeleton>`) cross-fading gracefully into hydrated content with zero layout snapping.
- **Scrollbar**: Auto-hiding scrollbar (`.auto-hide-scrollbar`) that seamlessly hides when idle and reveals during scrolling.

---

## 8. Layout Architecture & Universal Spacing Standard

### A. Floating Sidebar (Hits Ceiling)
- **Position**: Spans full ceiling-to-floor height on the left column (`h-screen`).
- **Floating Margin**: `p-3 sm:p-4 pr-0` around the sidebar so it floats gracefully without touching screen edges.
- **Shape & Surface**: `rounded-2xl lg:rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs p-4`.
- **Branding**: `<BrandLogo size="md" />` sits prominently at the top of the sidebar.
- **Scrollbar**: Hidden completely with `[scrollbar-width:none] [&::-webkit-scrollbar]:hidden`.

### B. Dynamic Sticky Glassy Topbar
- **Position**: Sits on the right side of the floating sidebar at the top of the scrollable main content area (`sticky top-0 z-30`).
- **Resting State (`scrollTop <= 12px`)**: `bg-transparent border-b border-transparent shadow-none` (invisible lines and background).
- **Scrolled State (`scrollTop > 12px`)**: `bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm` (smooth glassy reveal with rounded floating capsule).

### C. Universal Page Margins & Paddings
- **Default Container**: `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6`.
- **Full-Width Views**: `w-full px-4 sm:px-6 lg:px-8 py-6`.
- All pages across DormSafe must strictly render within this universal wrapper for unified alignment.

---

## 9. Single-Row Compact Filter & Search Toolbar Standard

All table, queue, and listing pages must present their status selectors and filter inputs in a **single, unified, responsive flex-wrap row**:

- **No Visible Outer Containers for 2nd Row**: Do **NOT** enclose search inputs, property selects, and date pickers in bulky separate white card boxes or distinct 2nd-row panels with heavy borders.
- **No Redundant Field Labels**: Omit vertical uppercase labels above inline filters (`SEARCH NAME`, `SUBMITTED FROM`, etc.). Rely on clean placeholders (`placeholder="Search dorm or address…"`) and native date tooltips.
- **Preserve Standard Full Heights**: Always keep standard input/control height (`h-10` / 40px) across inputs, selectors, and status tab capsules. Never shrink control heights.
- **Compact Widths**:
  - Search Input: Compact `w-44 sm:w-52` with inline search icon.
  - Dropdown / Select: Compact `w-36 sm:w-44`.
  - Date Pickers: Compact `w-32 sm:w-36`.
- **Right-Edge Status Selector Placement**:
  - Left Group: Filter inputs (Search, Selects, Dates, Reset).
  - Right Group: Status selector / toggle tabs positioned on the **right side edge**.
  - Outer Wrapper: `flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-3.5`.
- **Responsive Flex Flow**: On wide viewports, the filter inputs and right-aligned selector sit cleanly on a single row separated by a gap; on smaller viewports, controls gracefully wrap to the row below.

---

## 10. Detail & Inspection Page Standards (No KPIs & Unified Header Actions)

When designing or modifying record inspection or detail review pages (e.g. `AdminListingDetailPage`, `AccountVerificationPage`, `PropertyDetailPage`):

- **No KPIs on Detail Pages**: Detail pages must **NEVER** render top KPI summary cards or metric highlight strips. KPIs are reserved exclusively for executive dashboards and aggregate overview pages. Detail pages must immediately open into structured content inspection (Overview, Media, Permits, Credentials).
- **Single Unified Header Action Bar**: All main actions and navigation must live exclusively in the top `headerAction` slot:
  - **Back Button Placement**: Place `<Button variant="ghost" startContent={<ArrowLeft size={14} />}>Back to ...</Button>` on the far left of the header action button group.
  - **Destructive Actions**: Placed in the middle (`variant="danger"` with icon).
  - **Primary Action**: Placed at the far right (`variant="primary"` with icon).
- **No Redundant Decision Cards**: Never render duplicate decision containers or bottom sidebar cards that only repeat the action buttons already present in the header.
- **Embedded Metadata Placement**: Move record metadata (Property Type, Verification Status, Document Completeness, Photo Count) directly into the relevant card headers or page title badge chips rather than standalone stat blocks.

---

## 11. Universal Pagination & Card Density Standard (15 Items Maximum)

All card lists, directories, queues, moderation feeds, and data tables across the platform must enforce a strict **15 items per page maximum** (`itemsPerPage = 15` or `limit = 15`):

- **Strict Card Density Cap**: Never allow unbounded lists or lists larger than 15 items per view. Lists of 15 cards maintain optimal viewport rendering, low memory footprint, and consistent scrolling rhythm.
- **Unified Pagination Controls**: All paginated views must present the Golden Pagination Bar beneath the card list:
  - **Left**: Current page and total count indicator (`Showing page X of Y (N matching records)`).
  - **Right**: Previous Button, numerical circular page buttons (`1, 2, 3...` with Ateneo Blue active pill), and Next Button.
- **Filter Reset Synchronicity**: Any modification to search inputs, dropdown filters, or status tabs must immediately reset the active page back to `page = 1`.

---

## 12. Mobile Filter & Header Responsiveness Standard

To guarantee zero UI collisions, overlapping text, or squished controls on mobile and narrow viewports:

- **Section Headers & Sort Controls**: Never use rigid horizontal `flex items-center justify-between` on headers that contain multi-line subtitles and sort buttons. Always use:
  ```jsx
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-2.5">
    <div className="min-w-0 flex-1">
      <h2 className="text-base font-semibold text-slate-900">Title</h2>
      <p className="text-xs text-slate-500 mt-0.5">Description...</p>
    </div>
    <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0 self-start sm:self-auto pt-0.5 sm:pt-0">
      <span>Sort:</span>
      <button ...>...</button>
    </div>
  </div>
  ```
- **Horizontal Status / Category Tabs on Mobile**: Never lock tabs in rigid non-wrapping or non-scrollable bars. Always wrap in a touch-scrollable container with hidden scrollbars:
  ```jsx
  <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
    <div className="inline-flex min-w-full sm:min-w-0 items-center gap-1 p-1 h-10 rounded-2xl bg-slate-100/90 border border-slate-200/70 shrink-0">
      {tabs.map((tab) => (
        <button key={tab.id} className="... whitespace-nowrap shrink-0">...</button>
      ))}
    </div>
  </div>
  ```
- **Filter Inputs Fluid Widths**: Inputs on mobile must flex smoothly (`w-full sm:w-52`, `w-full sm:w-44`, and date pickers grouped in `grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center`).
