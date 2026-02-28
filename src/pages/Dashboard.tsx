"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  Calendar, 
  FileText, 
  ClipboardCheck, 
  Clock, 
  Video, 
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Dashboard = () => {
  const { user, role, signOut } = useAuth();
  const [admissionStatus, setAdmissionStatus] = useState<string | null>(null);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && role === 'patient') {
      fetchPatientData();
    }
  }, [user, role]);

  const fetchPatientData = async () => {
    try {
      // 1. Verificar estado de admisión
      const { data: admissionData } = await supabase
        .from('admissions')
        .select('status')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setAdmissionStatus(admissionData?.status || 'NOT_STARTED');

      // 2. Buscar próxima cita si está aprobado
      if (admissionData?.status === 'APPROVED') {
        const { data: appointmentData } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', user?.id)
          .eq('status', 'SCHEDULED')
          .gte('start_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        setNextAppointment(appointmentData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Si es admin, redirigir a su panel correspondiente
  if (role === 'admin') return <Navigate to="/admin" replace />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-400">Cargando tu panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
            <Calendar className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Mi Espacio</h1>
        </div>
        <Button variant="ghost" onClick={signOut} className="text-slate-500 hover:text-red-500">
          <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
        </Button>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Bienvenida */}
        <header>
          <h2 className="text-3xl font-light text-slate-800">Hola, {user?.user_metadata?.full_name || 'Paciente'}</h2>
          <p className="text-slate-500 mt-1">Gestiona tus sesiones y documentos desde aquí.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Estado de Admisión / Próxima Cita */}
          <Card className="md:col-span-2 border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Estado de tu proceso</CardTitle>
            </CardHeader>
            <CardContent>
              {admissionStatus === 'NOT_STARTED' && (
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mx-auto">
                    <ClipboardCheck className="text-sky-600 w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-slate-800">Comienza tu camino</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">Para empezar la terapia, necesitamos que rellenes un breve formulario de admisión.</p>
                  </div>
                  <Button asChild className="bg-sky-600 hover:bg-sky-700">
                    <Link to="/admission">Rellenar Formulario <ArrowRight className="ml-2 w-4 h-4" /></Link>
                  </Button>
                </div>
              )}

              {admissionStatus === 'PENDING_APPROVAL' && (
                <div className="py-6 flex items-start space-x-4 bg-amber-50 p-6 rounded-2xl border border-amber-100">
                  <div className="bg-amber-100 p-3 rounded-full">
                    <Clock className="text-amber-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-amber-900">Solicitud en revisión</h3>
                    <p className="text-amber-700 text-sm mt-1">Estamos revisando tu información. Te avisaremos por correo en cuanto sea aprobada para que puedas reservar tu primera cita.</p>
                  </div>
                </div>
              )}

              {admissionStatus === 'APPROVED' && (
                <div className="space-y-6">
                  {nextAppointment ? (
                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-emerald-100 p-3 rounded-full">
                          <Video className="text-emerald-600 w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-emerald-900">Próxima Sesión</h3>
                          <p className="text-emerald-700 text-sm">
                            {format(new Date(nextAppointment.start_time), "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <Button asChild className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                        <Link to={`/session/${nextAppointment.id}`}>Entrar a la sala</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-4">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="text-emerald-600 w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-medium text-slate-800">¡Todo listo!</h3>
                        <p className="text-slate-500">Tu solicitud ha sido aprobada. Ya puedes reservar tu primera sesión.</p>
                      </div>
                      <Button asChild className="bg-sky-600 hover:bg-sky-700">
                        <Link to="/booking">Reservar Cita</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {admissionStatus === 'REJECTED' && (
                <div className="py-6 flex items-start space-x-4 bg-red-50 p-6 rounded-2xl border border-red-100">
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertCircle className="text-red-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-red-900">Solicitud no aprobada</h3>
                    <p className="text-red-700 text-sm mt-1">Lo sentimos, en este momento no podemos atender tu solicitud. Por favor, contacta con nosotros si tienes alguna duda.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Accesos Rápidos */}
          <div className="space-y-4">
            <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer group">
              <Link to="/appointments">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-50 p-3 rounded-xl group-hover:bg-indigo-100 transition-colors">
                      <Calendar className="text-indigo-600 w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-700">Mis Citas</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </CardContent>
              </Link>
            </Card>

            <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer group">
              <Link to="/invoices">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-emerald-50 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
                      <FileText className="text-emerald-600 w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-700">Facturas</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </CardContent>
              </Link>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;