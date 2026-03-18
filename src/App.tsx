import React, { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { StatsProvider } from "@/contexts/StatsContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { NotificationPrompt } from "@/components/notifications/NotificationPrompt";
import Landing from "./pages/Landing";
import Parks from "./pages/Parks";
import Explore from "./pages/Explore";
import ServiceDetails from "./pages/ServiceDetails";
import Social from "./pages/Social";
import Dates from "./pages/Dates";
import Pack from "./pages/Pack";
import Me from "./pages/Me";
import Shop from "./pages/Shop";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import SubmitService from "./pages/SubmitService";
import SubmissionSuccess from "./pages/SubmissionSuccess";
import AdminParks from "./pages/admin/AdminParks";
import AdminServices from "./pages/admin/AdminServices";
import AdminSocial from "./pages/admin/AdminSocial";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminTools from "./pages/admin/AdminTools";
import AdminVaccinations from "./pages/admin/AdminVaccinations";

const ExploreIdRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/services/${id}`} replace />;
};

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // This is the "Listener" that catches the login from Safari
    CapacitorApp.addListener('appUrlOpen', async (event: any) => {
      // Convert the # fragment from Supabase into a URL we can read
      const url = new URL(event.url.replace('#', '?'));
      const accessToken = url.searchParams.get('access_token');
      const refreshToken = url.searchParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) {
          console.log("Login successful, session synced!");
        }
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <NotificationPrompt />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/submit-service" element={<SubmitService />} />
                <Route path="/submission-success" element={<SubmissionSuccess />} />
                
                <Route element={<AppLayout />}>
                  <Route path="/parks" element={<Parks />} />
                  <Route path="/services" element={<Explore />} />
                  <Route path="/services/:id" element={<ServiceDetails />} />
                  <Route path="/social" element={<Social />} />
                  <Route path="/social/post/:id" element={<Social />} />
                  <Route path="/dates" element={<Dates />} />
                  <Route path="/pack" element={<Pack />} />
                  <Route path="/me" element={<Me />} />
                  <Route path="/shop" element={<Shop />} />
                </Route>

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<Navigate to="/admin/parks" replace />} />
                  <Route path="parks" element={<AdminParks />} />
                  <Route path="services" element={<AdminServices />} />
                  <Route path="social" element={<AdminSocial />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="tools" element={<AdminTools />} />
                  <Route path="vaccinations" element={<AdminVaccinations />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Legacy redirects */}
                <Route path="/explore" element={<Navigate to="/services" replace />} />
                <Route path="/explore/:id" element={<ExploreIdRedirect />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </StatsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
);

export default App;
