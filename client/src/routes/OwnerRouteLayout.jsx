import { Outlet } from 'react-router-dom';
import { OwnerPropertyProvider } from '../context/OwnerPropertyContext';

export function OwnerRouteLayout() {
  return (
    <OwnerPropertyProvider>
      <Outlet />
    </OwnerPropertyProvider>
  );
}
