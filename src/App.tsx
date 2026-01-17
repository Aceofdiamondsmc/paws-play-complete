import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Parks from "./pages/Parks";
import Explore from "./pages/Explore";
import Social from "./pages/Social";
import Dates from "./pages/Dates";
import Pack from "./pages/Pack";
import Me from "./pages/Me";
import Shop from "./pages/Shop";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/parks" replace />} />
              <Route path="/parks" element={<Parks />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/social" element={<Social />} />
              <Route path="/dates" element={<Dates />} />
              <Route path="/pack" element={<Pack />} />
              <Route path="/me" element={<Me />} />
              <Route path="/shop" element={<Shop />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
