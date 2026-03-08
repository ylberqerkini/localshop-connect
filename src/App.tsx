import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { BusinessProvider, useBusiness } from "@/hooks/useBusiness";
import { useAdmin } from "@/hooks/useAdmin";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import BuyerAccount from "./pages/BuyerAccount";
import Overview from "./pages/dashboard/Overview";
import Orders from "./pages/dashboard/Orders";
import Products from "./pages/dashboard/Products";
import Customers from "./pages/dashboard/Customers";
import Analytics from "./pages/dashboard/Analytics";
import Earnings from "./pages/dashboard/Earnings";
import Coupons from "./pages/dashboard/Coupons";
import Reviews from "./pages/dashboard/Reviews";
import Settings from "./pages/dashboard/Settings";
import Categories from "./pages/dashboard/Categories";
import CreateBusiness from "./pages/dashboard/CreateBusiness";
import StorePage from "./pages/Store";
import ProductDetail from "./pages/ProductDetail";
import OrderConfirmation from "./pages/OrderConfirmation";
import Marketplace from "./pages/Marketplace";
import SellerProfile from "./pages/SellerProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  if (authLoading || adminLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function DashboardRoute({ children }: { children: React.ReactNode }) {
  const { business, loading } = useBusiness();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!business) return <CreateBusiness />;
  return <DashboardLayout>{children}</DashboardLayout>;
}

const DashboardWrapper = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><DashboardRoute>{children}</DashboardRoute></ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BusinessProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/seller/:subdomain" element={<SellerProfile />} />
              <Route path="/account" element={<ProtectedRoute><BuyerAccount /></ProtectedRoute>} />

              {/* Dashboard */}
              <Route path="/dashboard" element={<DashboardWrapper><Overview /></DashboardWrapper>} />
              <Route path="/dashboard/orders" element={<DashboardWrapper><Orders /></DashboardWrapper>} />
              <Route path="/dashboard/products" element={<DashboardWrapper><Products /></DashboardWrapper>} />
              <Route path="/dashboard/categories" element={<DashboardWrapper><Categories /></DashboardWrapper>} />
              <Route path="/dashboard/customers" element={<DashboardWrapper><Customers /></DashboardWrapper>} />
              <Route path="/dashboard/analytics" element={<DashboardWrapper><Analytics /></DashboardWrapper>} />
              <Route path="/dashboard/earnings" element={<DashboardWrapper><Earnings /></DashboardWrapper>} />
              <Route path="/dashboard/coupons" element={<DashboardWrapper><Coupons /></DashboardWrapper>} />
              <Route path="/dashboard/reviews" element={<DashboardWrapper><Reviews /></DashboardWrapper>} />
              <Route path="/dashboard/settings" element={<DashboardWrapper><Settings /></DashboardWrapper>} />

              {/* Admin */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

              {/* Store */}
              <Route path="/store/:subdomain" element={<StorePage />} />
              <Route path="/store/:subdomain/product/:productId" element={<StorePage />} />
              <Route path="/store/:subdomain/order/:orderNumber" element={<OrderConfirmation />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BusinessProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
