---
description: Development Rules, Core Constraints, and Component Consistency Mandate for DormSafe
globs: ["**/*"]
alwaysApply: true
---

# Development Rules: Frontend-Only Scope & Design Consistency Mandate

## 1. Strict Boundary Definition
- The developer is responsible **EXCLUSIVELY for the Frontend (`client/`)**.
- **DO NOT** edit, refactor, delete, or create files in:
  - `server/` (Node.js/Express API, backend routes, server controllers)
  - `supabase/` (PostgreSQL migrations, seed scripts, SQL schemas, RLS policies)
  - `Places/` or backend seed assets

## 2. Backend & API Handling
- Treat all backend API endpoints and Supabase database schemas as **fixed, read-only contracts**.
- If a frontend feature needs data, use the existing client service layer (`client/src/services/`) or connect via standard client endpoints.
- Do not attempt to fix or alter backend files if an API returns an error; handle error states gracefully in the UI.

## 3. Mandatory Component-First Architecture (ALWAYS USE COMPONENTS!)
- **NEVER create raw HTML primitives or ad-hoc inline styled elements** when dedicated UI components exist in the codebase:
  - **Emblem / Identity**: ALWAYS use `<BrandLogo size="..." />` (`client/src/components/common/BrandLogo.jsx`). Never draw ad-hoc DS boxes.
  - **Buttons & Actions**: ALWAYS use `<Button variant="..." size="..." radius="full" />` (`client/src/components/common/Button.jsx`).
  - **KPIs & Metrics**: ALWAYS use `<StatsCard />` (`client/src/components/dashboard/StatsCard.jsx`) with compact ~80px height layout. Strictly follow `AdminDashboardPage.jsx`: NEVER pass extraneous `trend` pill chips on KPI cards; only use `label`, `value`, `variant`, `icon`, and `subtext`.
  - **Loading States**: ALWAYS use `<PageSkeleton variant="dashboard|table|grid|detail|form" />` (`client/src/components/common/PageSkeleton.jsx`). NEVER use raw spinners or plain loading text for page loads.
  - **Page Enclosures**: ALWAYS wrap page content in `<PageContainer>` or `<AppShell>` with `<PageTransition>`.
  - **Badges & Status**: ALWAYS use `<Badge variant="verified|pending|danger|occupied|default">` or HeroUI `<Chip>`.
  - **Inputs & Forms**: ALWAYS use `<Input>`, `<Select>`, or HeroUI form controls with unified 12px radii.
  - **Filters & Search Toolbars**: ALWAYS join status toggles and filter inputs into a single, compact, responsive flex-wrap row without bulky 2nd-row card containers or redundant field labels.
  - **Pagination & Card Density**: ALWAYS paginate card lists, queues, directories, and tables with a strict **15 items/cards per page maximum** (`itemsPerPage = 15` / `limit = 15`) with the unified golden pagination bar (numerical buttons + prev/next).
  - **Detail & Inspection Pages**: NEVER render KPIs or duplicate decision containers on detail pages; all actions belong in the top `headerAction` slot (with `<ArrowLeft /> Back` button on the left).

## 4. Pre-Task Reference Requirement (Check Existing Pages First!)
- **BEFORE writing or modifying any UI/page**, you MUST inspect existing golden reference pages for layout patterns, spacing, and visual harmony:
  - **Golden Dashboard Reference**: `client/src/pages/admin/AdminDashboardPage.jsx`
  - **Golden Design System Lab**: `client/src/pages/dev/ComponentsShowcasePage.jsx`
  - **Golden Shell & Navigation**: `client/src/components/layout/AppShell.jsx` and `AppSidebar.jsx`
- Maintain 100% visual consistency: If a pattern exists on the Dashboard (e.g. section headers with `text-base font-semibold text-slate-900`, pill action buttons, card surfaces `rounded-2xl border border-slate-200/90 bg-white`), ALL other pages must adhere to that exact standard.

## 5. UI Hygiene & Zero-Emoji Policy
- **ZERO raw emojis in UI code**: Always import semantic vector icons from `lucide-react`.
- **Responsive & Universal Alignment**: All views must respect universal container bounds (`max-w-7xl px-4 sm:px-6 lg:px-8 py-6`) and support desktop, tablet, and mobile layouts.
