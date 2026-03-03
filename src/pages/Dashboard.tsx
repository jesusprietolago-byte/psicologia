"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LogOut, 
  Calendar, 
  FileText, 
  ClipboardCheck, 
  Clock, 
  Video, 
  ArrowRight,
  Leaf,
  Sparkles,
  RefreshCw,
  Check,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { format, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';

const Dashboard = () => {
  const { user, role, signOut } = useAuth();
  const [admissionStatus, setAdmissionStatus] = useState<string | null>(null);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [pendingAppointment, setPendingAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user && role === 'patient') {
      fetchPatientData();
    }
  }, [user, role]);

  const fetchPatientData = async () => {
    setRefreshing(true);
    try {
      const { data: admissionData } = await supabase
        .from('admissions')
        .select('status')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setAdmissionStatus(admissionData?.status || 'NOT_STARTED');

      if (admissionData?.status === 'APPROVED') {
        // 2. Buscar cita confirmada (SCHEDULED) - Solo futuras o en curso
        const { data: appointmentData } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', user?.id)
          .eq('status', 'SCHEDULED')
          .gte('end_time', new Date().toISOString()) // Que no haya terminado todavía
          .order('start_time', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        setNextAppointment(appointmentData);

        // 3. Buscar cita propuesta por el admin (PENDING_CONFIRMATION)
        const { data: pendingData } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', user?.id)
          .eq('status', 'PENDING_CONFIRMATION')
          .order('start_time', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        setPendingAppointment(pendingData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAppointmentAction = async (id: string, status: 'SCHEDULED' | 'CANCELLED') => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: status })
        .eq('id', id);

      if (error) throw error;

      if (status === 'SCHEDULED') {
        showSuccess("¡Cita confirmada! Te esperamos.");
        try {
          const functionUrl = `https://remnvakjvujygcdwnsgn.supabase.co/functions/v1/create-daily-room`;
          const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            }
          });
          if (response.ok) {
            const { url } = await response.json();
            await supabase.from('appointments').update({ video_room_url: url }).eq('id', id);
          }
        } catch (e) { 
          console.error("Error creando sala:", e); 
        }
      } else {
        showSuccess("Cita rechazada correctamente.");
      }
      
      await fetchPatientData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (role === 'admin') return <Navigate to="/admin" replace />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6]">
        <div className="animate-pulse text-[#c17d60] font-serif text-xl">Preparando tu espacio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf6] font-sans">
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#e8e1d5] px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#c17d60] rounded-full flex items-center justify-center">
            <Leaf className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-serif font-medium text-[#4a3f35]">Mi Espacio</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={fetchPatientData} className="text-[#7a6f64] hover:text-[#c17d60] rounded-full">
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </Button>
          <Button variant="ghost" onClick={signOut} className="text-[#7a6f64] hover:text-[#c17d60] hover:bg-[#fdfaf6] rounded-full">
            <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
          </Button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-10">
        <header className="pt-8">
          <h2 className="text-4xl font-serif text-[#4a3f35]">Hola, {user?.user_metadata?.full_name || 'Paciente'}</h2>
          <p className="text-[#7a6f64] mt-2 text-lg">Es un buen momento para cuidar de ti.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <Card className="md:col-span-2 border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="pb-2 pt-8 px-8">
              <CardTitle className="text-xl font-serif text-[#4a3f35]">Tu proceso actual</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              
              {admissionStatus === 'NOT_STARTED' && (
                <div className="py-6 text-center space-y-6">
                  <div className="w-20 h-20 bg-[#fdfaf6] rounded-3xl flex items-center justify-center mx-auto border border-[#e8e1d5]">
                    <ClipboardCheck className="text-[#c17d60] w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-serif text-[#4a3f35]">Comienza tu camino</h3>
                  <Button asChild className="bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-8 h-12">
                    <Link to="/admission">Rellenar Formulario <ArrowRight className="ml-2 w-4 h-4" /></Link>
                  </Button>
                </div>
              )}

              {admissionStatus === 'PENDING_APPROVAL' && (
                <div className="py-8 flex items-start space-x-6 bg-[#fdfaf6] p-8 rounded-[2rem] border border-[#e8e1d5]">
                  <div className="bg-white p-4 rounded-2xl shadow-sm"><Clock className="text-[#c17d60] w-8 h-8" /></div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-serif text-[#4a3f35]">Solicitud en revisión</h3>
                    <p className="text-[#7a6f64]">Estamos revisando tu información. Te avisaremos pronto por email.</p>
                  </div>
                </div>
              )}

              {admissionStatus === 'APPROVED' && (
                <div className="space-y-8">
                  
                  {pendingAppointment ? (
                    <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-200 space-y-6 animate-in fade-in slide-in-from-top-4">
                      <div className="flex items-start space-x-5">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100">
                          <Sparkles className="text-amber-600 w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-2xl font-serif text-[#4a3f35]">Laura te ha propuesto una cita</h3>
                          <p className="text-amber-800 font-medium text-lg">
                            {format(new Date(pendingAppointment.start_time), "EEEE d 'de' MMMM", { locale: es })}
                          </p>
                          <p className="text-amber-700 font-medium">
                            {format(new Date(pendingAppointment.start_time), "HH:mm")} — {format(new Date(pendingAppointment.end_time), "HH:mm")}
                          </p>
                          <p className="text-amber-700/70 text-sm">Por favor, confirma si puedes asistir o rechaza para liberar el hueco.</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Button 
                          onClick={() => handleAppointmentAction(pendingAppointment.id, 'SCHEDULED')}
                          disabled={actionLoading}
                          className="flex-1 bg-[#b5b891] hover:bg-[#a4a77d] text-white rounded-full h-14 text-lg shadow-lg shadow-[#b5b891]/20"
                        >
                          {actionLoading ? <Loader2 className="animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Confirmar Asistencia</>}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleAppointmentAction(pendingAppointment.id, 'CANCELLED')}
                          disabled={actionLoading}
                          className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-100 rounded-full h-14 text-lg"
                        >
                          <X className="w-5 h-5 mr-2" /> Rechazar
                        </Button>
                      </div>
                    </div>
                  ) : nextAppointment ? (
                    <div className="bg-[#b5b891]/10 p-8 rounded-[2.5rem] border border-[#b5b891]/30 flex flex-col sm:flex-row justify-between items-center gap-8">
                      <div className="flex items-center space-x-6">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-[#b5b891]/20">
                          <Video className="text-[#6b6e4d] w-10 h-10" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-serif text-[#4a3f35]">Próxima Sesión</h3>
                          <p className="text-[#6b6e4d] font-medium text-lg mt-1">
                            {format(new Date(nextAppointment.start_time), "EEEE d 'de' MMMM", { locale: es })}
                          </p>
                          <p className="text-[#6b6e4d] font-medium">
                            {format(new Date(nextAppointment.start_time), "HH:mm")} — {format(new Date(nextAppointment.end_time), "HH:mm")}
                          </p>
                        </div>
                      </div>
                      <Button asChild className="bg-[#6b6e4d] hover:bg-[#5a5d41] text-white rounded-full px-10 h-14 text-lg w-full sm:w-auto shadow-lg shadow-[#6b6e4d]/20">
                        <Link to={`/session/${nextAppointment.id}`}>Entrar a la sala</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-8 bg-[#fdfaf6]/50 rounded-[3rem] border-2 border-dashed border-[#e8e1d5]">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-[#e8e1d5]">
                        <Calendar className="text-[#c17d60] w-10 h-10" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-3xl font-serif text-[#4a3f35]">¿Agendamos tu sesión?</h3>
                        <p className="text-[#7a6f64] max-w-xs mx-auto">Elige el momento que mejor te venga para continuar con tu proceso.</p>
                      </div>
                      <Button asChild className="bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-12 h-14 text-lg shadow-lg shadow-[#c17d60]/20">
                        <Link to="/booking">Reservar Cita <ArrowRight className="ml-2 w-5 h-5" /></Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-lg shadow-[#c17d60]/5 bg-white hover:shadow-xl transition-all cursor-pointer group rounded-[2rem] overflow-hidden">
              <Link to="/appointments">
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#fdfaf6] p-4 rounded-2xl group-hover:bg-[#c17d60]/10 transition-colors border border-[#e8e1d5]">
                      <Calendar className="text-[#c17d60] w-6 h-6" />
                    </div>
                    <span className="font-serif text-xl text-[#4a3f35]">Mis Citas</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#e8e1d5] group-hover:text-[#c17d60] transition-colors" />
                </CardContent>
              </Link>
            </Card>

            <Card className="border-none shadow-lg shadow-[#c17d60]/5 bg-white hover:shadow-xl transition-all cursor-pointer group rounded-[2rem] overflow-hidden">
              <Link to="/invoices">
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#fdfaf6] p-4 rounded-2xl group-hover:bg-[#b5b891]/20 transition-colors border border-[#e8e1d5]">
                      <FileText className="text-[#6b6e4d] w-6 h-6" />
                    </div>
                    <span className="font-serif text-xl text-[#4a3f35]">Facturas</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#e8e1d5] group-hover:text-[#6b6e4d] transition-colors" />
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