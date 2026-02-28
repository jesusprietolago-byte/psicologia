"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Calendar, Video, FileText, ClipboardList } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [admissionStatus, setAdmissionStatus] = useState<string | null>(null);
  const [nextAppointment, setNextAppointment] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkAdmission();
      fetchNextAppointment();
    }
  }, [user]);

  const checkAdmission = async () => {
    const { data, error } = await supabase
      .from('admissions')
      .select('status')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) console.error(error);
    else setAdmissionStatus(data?.status || 'NOT_STARTED');
  };

  const fetchNextAppointment = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', user.id)
      .eq('status', 'SCHEDULED')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) console.error(error);
    else setNextAppointment(data);
  };

  return (
    <div className="min-h-screen bg-[#f0f9ff]">
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-medium text-slate-800">Mi Espacio</h1>
        <Button variant="ghost" onClick={signOut} className="text-slate-500 hover:text-red-500">
          <LogOut className="w-4 h-4 mr-2" /> Salir
        </Button>
      </nav>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-3 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <ClipboardList className="w-5 h-5 mr-2 text-sky-500" /> Estado de tu solicitud
            </CardTitle>
          </CardHeader>
          <CardContent>
            {admissionStatus === 'NOT_STARTED' && (
              <div className="flex flex-col items-center py-8 text-center">
                <p className="text-slate-600 mb-4">Para comenzar tu terapia, necesitamos conocerte un poco mejor.</p>
                <Button asChild className="bg-sky-500 hover:bg-sky-600">
                  <Link to="/admission">Completar Formulario de Admisión</Link>
                </Button>
              </div>
            )}
            {admissionStatus === 'PENDING_APPROVAL' && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg text-amber-800 flex items-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-3" />
                Tu solicitud está siendo revisada por la psicóloga. Te avisaremos pronto.
              </div>
            )}
            {admissionStatus === 'APPROVED' && (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg text-emerald-800">
                ¡Solicitud aprobada! Ya puedes reservar tu primera sesión.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservar Cita */}
        <div className="relative">
          <Card className={`border-none shadow-sm ${admissionStatus === 'APPROVED' ? 'hover:shadow-md transition-shadow cursor-pointer' : 'opacity-50'}`}>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="text-sky-600" />
              </div>
              <h3 className="font-medium text-slate-800">Reservar Cita</h3>
              <p className="text-sm text-slate-500 mt-1">
                {admissionStatus === 'APPROVED' ? 'Elige el horario que mejor te venga' : 'Requiere aprobación de la psicóloga'}
              </p>
            </CardContent>
          </Card>
          {admissionStatus === 'APPROVED' && (
            <Link to="/booking" className="absolute inset-0">
              <span className="sr-only">Reservar Cita</span>
            </Link>
          )}
        </div>

        {/* Entrar a Sesión */}
        <div className="relative">
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <Video className="text-indigo-600" />
              </div>
              <h3 className="font-medium text-slate-800">Entrar a Sesión</h3>
              <p className="text-sm text-slate-500 mt-1">
                {nextAppointment ? `Próxima: ${format(new Date(nextAppointment.start_time), 'PPP p', { locale: es })}` : 'No hay citas programadas'}
              </p>
            </CardContent>
          </Card>
          {nextAppointment && (
            <Link to={`/session/${nextAppointment.id}`} className="absolute inset-0">
              <span className="sr-only">Entrar a Sesión</span>
            </Link>
          )}
        </div>

        {/* Mis Facturas */}
        <div className="relative">
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="text-slate-600" />
              </div>
              <h3 className="font-medium text-slate-800">Mis Facturas</h3>
              <p className="text-sm text-slate-500 mt-1">Descarga tus recibos de terapia</p>
            </CardContent>
          </Card>
          <Link to="/invoices" className="absolute inset-0">
            <span className="sr-only">Mis Facturas</span>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
＜/dyad-write>

Finalmente, modificamos `App.tsx` para añadir las rutas:

<dyad-write path="src/App.tsx" description="Añadiendo rutas para booking, appointments e invoices">
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
import NotFound from "./pages/NotFound";
import Booking from "./pages/Booking";
import Appointments from "./pages/Appointments";
import Invoices from "./pages/Invoices";

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
            
            {/* Rutas de Paciente */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRole="patient">
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admission" element={
              <ProtectedRoute allowedRole="patient">
                <AdmissionForm />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;