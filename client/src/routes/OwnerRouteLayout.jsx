import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { OwnerPropertyProvider } from '../context/OwnerPropertyContext';

/**
 * Persistent Owner Layout Route
 * Keeps OwnerPropertyProvider & AppShell (sidebar, topbar, scroll container)
 * permanently mounted across all owner subpages.
 */
export function OwnerRouteLayout() {
  return (
    <OwnerPropertyProvider>
      <AppShell showSidebar={true}>
        <Outlet />
      </AppShell>
    </OwnerPropertyProvider>
  );
}
