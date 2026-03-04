import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Documents from "./pages/Documents";
import Blog from "./pages/Blog";
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
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admission" element={<AdmissionForm />} />
            <Route path="/blog" element={<Blog />} />
            
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

            <Route path="/documents" element={
              <ProtectedRoute allowedRole="patient">
                <Documents />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;