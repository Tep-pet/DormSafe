import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  Chip,
} from '@heroui/react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';
import { NotificationBell } from '../common/NotificationBell';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';

export function Navbar() {
  const { isAuthenticated, profile, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const studentNavItems = [
    { label: 'Search Dorms', path: ROUTES.STUDENT_SEARCH },
    { label: 'Saved', path: ROUTES.STUDENT_SAVED },
    { label: 'My Stay', path: ROUTES.STUDENT_MY_STAY },
    { label: 'Requests', path: ROUTES.STUDENT_REQUESTS },
  ];

  return (
    <HeroUINavbar
      maxWidth="xl"
      isBordered
      className="bg-white/95 backdrop-blur-md sticky top-0 z-40"
      classNames={{
        wrapper: 'px-4 sm:px-6 max-w-7xl',
      }}
    >
      <NavbarBrand>
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ateneo-blue text-white font-bold text-base shadow-xs group-hover:scale-105 transition">
            D
          </div>
          <span className="text-lg font-extrabold tracking-tight text-ateneo-blue">
            DormSafe
          </span>
        </Link>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-6" justify="center">
        {isAuthenticated && role === ROLES.STUDENT && profile?.verification_status === 'approved' && (
          studentNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavbarItem key={item.path} isActive={isActive}>
                <Link
                  to={item.path}
                  className={`text-sm font-medium transition ${
                    isActive
                      ? 'text-ateneo-blue font-semibold border-b-2 border-ateneo-blue pb-1'
                      : 'text-gray-600 hover:text-ateneo-blue'
                  }`}
                >
                  {item.label}
                </Link>
              </NavbarItem>
            );
          })
        )}
      </NavbarContent>

      <NavbarContent justify="end" className="gap-3">
        {isAuthenticated ? (
          <>
            <NavbarItem>
              <NotificationBell />
            </NavbarItem>

            <NavbarItem>
              <Dropdown placement="bottom-end">
                <DropdownTrigger>
                  <div className="flex items-center gap-2 cursor-pointer rounded-full p-0.5 hover:ring-2 hover:ring-ateneo-blue/20 transition">
                    <Avatar
                      isBordered
                      color="primary"
                      size="sm"
                      name={profile?.full_name?.charAt(0) || 'U'}
                      className="bg-ateneo-blue text-white text-xs font-semibold"
                    />
                    <div className="hidden md:flex flex-col text-left">
                      <span className="text-xs font-bold text-gray-800 line-clamp-1">
                        {profile?.full_name}
                      </span>
                      <span className="text-[10px] text-gray-500 capitalize">
                        {profile?.role}
                      </span>
                    </div>
                  </div>
                </DropdownTrigger>
                <DropdownMenu aria-label="Profile Actions" variant="flat">
                  <DropdownItem key="profile_info" isReadOnly className="h-14 gap-2 opacity-100">
                    <p className="text-xs font-semibold text-gray-500">Signed in as</p>
                    <p className="text-xs font-bold text-gray-900">{profile?.email}</p>
                  </DropdownItem>
                  <DropdownItem key="role" isReadOnly>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Role</span>
                      <Chip size="sm" variant="flat" color="primary" className="capitalize text-[10px]">
                        {profile?.role}
                      </Chip>
                    </div>
                  </DropdownItem>
                  <DropdownItem
                    key="components"
                    className="text-ateneo-blue font-medium text-xs bg-blue-50/50"
                    onPress={() => navigate('/components')}
                  >
                    UI Components Lab
                  </DropdownItem>
                  <DropdownItem
                    key="logout"
                    color="danger"
                    className="text-danger font-medium text-xs"
                    onPress={handleLogout}
                  >
                    Log Out
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          </>
        ) : (
          <>
            <NavbarItem>
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-ateneo-blue">
                Login
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Button size="sm" variant="primary" onClick={() => navigate('/register')}>
                Register
              </Button>
            </NavbarItem>
          </>
        )}
      </NavbarContent>
    </HeroUINavbar>
  );
}
