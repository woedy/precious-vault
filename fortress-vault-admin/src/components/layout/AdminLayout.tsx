import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  UserCheck,
  Receipt,
  Users,
  Package,
  FileText,
  Mail,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'KYC', path: '/kyc', icon: UserCheck },
  { name: 'Transactions', path: '/transactions', icon: Receipt },
  { name: 'Users', path: '/users', icon: Users },
  { name: 'Deliveries', path: '/deliveries', icon: Package },
  { name: 'Audit Log', path: '/audit-log', icon: FileText },
  { name: 'Dev Emails', path: '/dev-emails', icon: Mail },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 md:px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Logo/Title */}
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Fortress Vault Admin</h1>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User info and logout */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-sm">
              <p className="font-medium">{user?.first_name || user?.email}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16 border-r bg-background">
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Sidebar - Mobile */}
        {isSidebarOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={closeSidebar}
            />

            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background pt-16 md:hidden">
              <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeSidebar}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 md:pl-64 pt-0">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
