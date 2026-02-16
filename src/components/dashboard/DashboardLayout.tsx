import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { useBusiness } from '@/hooks/useBusiness';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Tag,
  Menu,
  X,
  Store,
  ExternalLink,
  Shield,
  Wallet
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Përmbledhje', icon: LayoutDashboard },
  { path: '/dashboard/orders', label: 'Porositë', icon: ShoppingCart },
  { path: '/dashboard/products', label: 'Produktet', icon: Package },
  { path: '/dashboard/categories', label: 'Kategoritë', icon: Tag },
  { path: '/dashboard/customers', label: 'Klientët', icon: Users },
  { path: '/dashboard/earnings', label: 'Fitimet', icon: Wallet },
  { path: '/dashboard/analytics', label: 'Analitika', icon: BarChart3 },
  { path: '/dashboard/settings', label: 'Cilësimet', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { business } = useBusiness();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b h-16 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="ml-4 flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <span className="font-semibold">{business?.name || 'eblej.com'}</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-background border-r transition-transform duration-200",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
                <Store className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg">eblej</span>
            </Link>
          </div>

          {/* Business info */}
          {business && (
            <div className="px-4 py-3 border-b">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium text-sm truncate">{business.name}</p>
                <Link
                  to={`/store/${business.subdomain}`}
                  target="_blank"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                >
                  {business.subdomain}.eblej.com
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className="border-t border-border my-3" />
                <Link
                  to="/admin"
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === '/admin'
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Shield className="h-5 w-5" />
                  Admin Panel
                </Link>
              </>
            )}
          </nav>

          {/* Sign out */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              Dil nga llogaria
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
