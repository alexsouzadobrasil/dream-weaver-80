import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OfflineBanner from "./components/OfflineBanner";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { AdminDreamsList, AdminDreamDetail } from "./pages/admin/AdminDreams";
import { AdminUsersList, AdminUserDetail } from "./pages/admin/AdminUsers";
import AdminDonations from "./pages/admin/AdminDonations";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminStorage from "./pages/admin/AdminStorage";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminOpenAI from "./pages/admin/AdminOpenAI";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineBanner />
      <BrowserRouter>
        <Routes>
          {/* ── App principal ── */}
          <Route path="/" element={<Index />} />

          {/* ── Admin ── */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard"      element={<AdminDashboard />} />
            <Route path="dreams"         element={<AdminDreamsList />} />
            <Route path="dreams/:id"     element={<AdminDreamDetail />} />
            <Route path="users"          element={<AdminUsersList />} />
            <Route path="users/:id"      element={<AdminUserDetail />} />
            <Route path="donations"      element={<AdminDonations />} />
            <Route path="logs"           element={<AdminLogs />} />
            <Route path="storage"        element={<AdminStorage />} />
            <Route path="settings"       element={<AdminSettings />} />
            <Route path="openai"         element={<AdminOpenAI />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
