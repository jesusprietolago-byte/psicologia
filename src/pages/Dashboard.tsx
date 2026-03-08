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
  MessageCircle
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import MessageDialog from '@/components/MessageDialog';

const Dashboard = () => {
  const { user, role, signOut } = useAuth();
  const [admissionStatus, setAdmissionStatus] = useState<string | null>(null);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [pendingAppointment, setPendingAppointment] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user && role === 'patient') {
      fetchPatientData();
      fetchAdminProfile();
      fetchUnreadMessages();

      const channel = supabase
        .channel(`dashboard-notifications-${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, () => {
          fetchUnreadMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, role]);

  const fetchUnreadMessages = async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (e) {
      setUnreadCount(0);
    }
  };

  const fetchAdminProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'admin')
      .maybeSingle();
    
    if (data) setAdminProfile(data);
  };

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
        const { data: appointmentData } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', user?.id)
          .eq('status', 'SCHEDULED')
          .gte('end_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        setNextAppointment(appointmentData);

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
      console.error(error);
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
        showSuccess("¡Cita confirmada!");
        const { data: apt } = await supabase.from('appointments').select('video_room_url').eq('id', id).single();
        if (!apt?.video_room_url) {
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
        }
      } else {
        showSuccess("Cita rechazada.");
      }
      
      await fetchPatientData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (role === 'admin') return <Navigate to="/admin" replace />;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6]">
      <div className="animate-pulse text-[#c17d60] font-serif text-xl">Cargando tu espacio...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fdfaf6] font-sans">
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#e8e1d5] px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#c17d60] rounded-full flex items-center justify-center shrink-0">
            <Leaf className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg md:text-xl font-serif font-medium text-[#4a3f35] truncate">Mi Espacio</h1>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          {adminProfile && (
            <div className="relative">
              <MessageDialog 
                otherUserId={adminProfile.id} 
                otherUserName="Laura (Psicóloga)" 
                onOpen={fetchUnreadMessages}
                trigger={
                  <Button variant="ghost" size="sm" className="text-[#7a6f64] hover:text-[#c17d60] rounded-full px-2 md:px-4">
                    <MessageCircle className="w-4 h-4 md:mr-2" /> 
                    <span className="hidden md:inline">Mensajes</span>
                  </Button>
                }
              />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
              )}
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={fetchPatientData} className="text-[#7a6f64] hover:text-[#c17d60] rounded-full">
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-[#7a6f64] hover:text-[#c17d60] rounded-full px-2 md:px-4">
            <LogOut className="w-4 h-4 md:mr-2" /> 
            <span className="hidden md:inline">Salir</span>
          </Button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6 md:space-y-10">
        <header className="pt-4 md:pt-8">
          <h2 className="text-3xl md:text-4xl font-serif text-[#4a3f35]">Hola, {user?.user_metadata?.full_name?.split(' ')[0] || 'Paciente'}</h2>
          <p className="text-[#7a6f64] mt-2 text-base md:text-lg">Bienvenido a tu panel personal.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <Card className="md:col-span-2 border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
            <CardHeader className="pb-2 pt-6 md:pt-8 px-6 md:px-8">
              <CardTitle className="text-xl font-serif text-[#4a3f35]">Tu proceso</CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              {admissionStatus === 'NOT_STARTED' && (
                <div className="py-6 text-center space-y-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-[#fdfaf6] rounded-3xl flex items-center justify-center mx-auto border border-[#e8e1d5]">
                    <ClipboardCheck className="text-[#c17d60] w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-serif text-[#4a3f35]">Comienza tu camino</h3>
                  <Button asChild className="bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-8 h-12 w-full sm:w-auto">
                    <Link to="/admission">Rellenar Formulario <ArrowRight className="ml-2 w-4 h-4" /></Link>
                  </Button>
                </div>
              )}

              {admissionStatus === 'PENDING_APPROVAL' && (
                <div className="py-6 md:py-8 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 bg-[#fdfaf6] p-6 md:p-8 rounded-[2rem] border border-[#e8e1d5] text-center sm:text-left">
                  <div className="bg-white p-4 rounded-2xl shadow-sm shrink-0"><Clock className="text-[#c17d60] w-8 h-8" /></div>
                  <div className="space-y-2">
                    <h3 className="text-xl md:text-2xl font-serif text-[#4a3f35]">Solicitud en revisión</h3>
                    <p className="text-[#7a6f64] text-sm md:text-base">Estamos revisando tu información. Te avisaremos pronto por correo electrónico.</p>
                  </div>
                </div>
              )}

              {admissionStatus === 'APPROVED' && (
                <div className="space-y-6 md:space-y-8">
                  {pendingAppointment ? (
                    <div className="bg-amber-50 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-amber-200 space-y-6">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 text-center sm:text-left">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 shrink-0">
                          <Sparkles className="text-amber-600 w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl md:text-2xl font-serif text-[#4a3f35]">Propuesta de cita</h3>
                          <p className="text-amber-800 font-medium text-base md:text-lg">
                            {format(new Date(pendingAppointment.start_time), "EEEE d 'de' MMMM", { locale: es })}
                          </p>
                          <p className="text-amber-700 font-medium">
                            {format(new Date(pendingAppointment.start_time), "HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2">
                        <Button 
                          onClick={() => handleAppointmentAction(pendingAppointment.id, 'SCHEDULED')}
                          disabled={actionLoading}
                          className="flex-1 bg-[#b5b891] hover:bg-[#a4a77d] text-white rounded-full h-12 md:h-14 text-base md:text-lg"
                        >
                          {actionLoading ? <Loader2 className="animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Confirmar</>}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleAppointmentAction(pendingAppointment.id, 'CANCELLED')}
                          disabled={actionLoading}
                          className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-100 rounded-full h-12 md:h-14 text-base md:text-lg"
                        >
                          <X className="w-5 h-5 mr-2" /> Rechazar
                        </Button>
                      </div>
                    </div>
                  ) : nextAppointment ? (
                    <div className="bg-[#b5b891]/10 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-[#b5b891]/30 flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-8 text-center lg:text-left">
                      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <div className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border border-[#b5b891]/20 shrink-0">
                          <Video className="text-[#6b6e4d] w-8 h-8 md:w-10 md:h-10" />
                        </div>
                        <div>
                          <h3 className="text-xl md:text-2xl font-serif text-[#4a3f35]">Próxima Sesión</h3>
                          <p className="text-[#6b6e4d] font-medium text-base md:text-lg mt-1">
                            {format(new Date(nextAppointment.start_time), "EEEE d 'de' MMMM", { locale: es })}
                          </p>
                          <p className="text-[#6b6e4d] font-medium">
                            {format(new Date(nextAppointment.start_time), "HH:mm")}
                          </p>
                        </div>
                      </div>
                      <Button asChild className="bg-[#6b6e4d] hover:bg-[#5a5d41] text-white rounded-full px-8 md:px-10 h-12 md:h-14 text-base md:text-lg w-full lg:w-auto">
                        <Link to={`/session/${nextAppointment.id}`}>Entrar a la sala</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="py-10 md:py-12 text-center space-y-6 md:space-y-8 bg-[#fdfaf6]/50 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-[#e8e1d5] px-4">
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-[#e8e1d5]">
                        <Calendar className="text-[#c17d60] w-8 h-8 md:w-10 md:h-10" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl md:text-3xl font-serif text-[#4a3f35]">¿Agendamos tu sesión?</h3>
                        <p className="text-[#7a6f64] max-w-xs mx-auto text-sm md:text-base">Elige el momento que mejor te venga para tu próxima sesión.</p>
                      </div>
                      <Button asChild className="bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-8 md:px-12 h-12 md:h-14 text-base md:text-lg w-full sm:w-auto">
                        <Link to="/booking">Reservar Cita <ArrowRight className="ml-2 w-5 h-5" /></Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4 md:gap-6">
            <Card className="border-none shadow-lg shadow-[#c17d60]/5 bg-white hover:shadow-xl transition-all cursor-pointer group rounded-[2rem] overflow-hidden">
              <Link to="/appointments">
                <CardContent className="p-6 md:p-8 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#fdfaf6] p-3 md:p-4 rounded-2xl group-hover:bg-[#c17d60]/10 transition-colors border border-[#e8e1d5]">
                      <Calendar className="text-[#c17d60] w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span className="font-serif text-lg md:text-xl text-[#4a3f35]">Mis Citas</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#e8e1d5] group-hover:text-[#c17d60] transition-colors" />
                </CardContent>
              </Link>
            </Card>

            <Card className="border-none shadow-lg shadow-[#c17d60]/5 bg-white hover:shadow-xl transition-all cursor-pointer group rounded-[2rem] overflow-hidden">
              <Link to="/documents">
                <CardContent className="p-6 md:p-8 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#fdfaf6] p-3 md:p-4 rounded-2xl group-hover:bg-[#c17d60]/10 transition-colors border border-[#e8e1d5]">
                      <FileText className="text-[#c17d60] w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <span className="font-serif text-lg md:text-xl text-[#4a3f35]">Documentos</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#e8e1d5] group-hover:text-[#c17d60] transition-colors" />
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