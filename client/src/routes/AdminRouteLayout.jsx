import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';

/**
 * Persistent Admin Layout Route
 * Keeps AppShell (sidebar, topbar, scroll container) permanently mounted
 * across all admin subpage transitions.
 */
export function AdminRouteLayout() {
  return (
    <AppShell showSidebar={true}>
      <Outlet />
    </AppShell>
  );
}
