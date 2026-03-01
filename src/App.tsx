import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Session from "./pages/Session";
import AdmissionForm from "./pages/AdmissionForm";
import Booking from "./pages/Booking";
import Appointments from "./pages/Appointments";
import Invoices from "./pages/Invoices";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

// Componente para manejar redirecciones de Auth (Invitaciones/Recuperación)
const AuthRedirectHandler = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    // Si hay un token en la URL y no estamos ya en login, redirigimos preservando el hash
    if (hash && (hash.includes("access_token=") || hash.includes("type=invite") || hash.includes("type=recovery"))) {
      if (location.pathname !== "/login") {
        setShouldRedirect(true);
      }
    }
  }, [location]);

  if (shouldRedirect) {
    // Importante: Pasamos el hash actual a la nueva ruta
    return <Navigate to={`/login${window.location.hash}`} replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthRedirectHandler>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admission" element={<AdmissionForm />} />
              
              {/* Rutas de Paciente */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRole="patient">
                  <Dashboard />
                </ProtectedRoute>
              } />

              <Route path="/booking" element={
                <ProtectedRoute allowedRole="patient">
                  <Booking />
                </ProtectedRoute>
              } />

              <Route path="/appointments" element={
                <ProtectedRoute allowedRole="patient">
                  <Appointments />
                </ProtectedRoute>
              } />

              <Route path="/invoices" element={
                <ProtectedRoute allowedRole="patient">
                  <Invoices />
                </ProtectedRoute>
              } />

              {/* Rutas de Videollamada */}
              <Route path="/session/:appointmentId" element={
                <ProtectedRoute>
                  <Session />
                </ProtectedRoute>
              } />

              {/* Rutas de Admin */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRole="admin">
                  <Admin />
                </ProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthRedirectHandler>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;