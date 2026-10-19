import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';

/**
 * Persistent Student Layout Route
 * Keeps AppShell permanently mounted across student subpages.
 */
export function StudentRouteLayout() {
  return (
    <AppShell showSidebar={false}>
      <Outlet />
    </AppShell>
  );
}
