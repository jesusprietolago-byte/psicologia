"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  LogOut, 
  ClipboardList, 
  Check, 
  History, 
  Calendar, 
  Video,
  Clock,
  Search,
  UserCircle,
  ArrowLeft,
  ChevronRight,
  Leaf,
  Mail,
  RefreshCw,
  Loader2,
  XCircle,
  MessageCircle,
  Settings
} from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import AvailabilityManager from '@/components/AvailabilityManager';
import AdminBookingDialog from '@/components/AdminBookingDialog';
import DocumentManager from '@/components/DocumentManager';
import ClinicalNoteDialog from '@/components/ClinicalNoteDialog';
import MessageDialog from '@/components/MessageDialog';
import ContentManager from '@/components/ContentManager';
import { showSuccess, showError } from '@/utils/toast';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { translateStatus } from '@/utils/translations';

const Admin = () => {
  const { role, signOut } = useAuth();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (role === 'admin') {
      fetchAllData();
    }
  }, [role]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAdmissions(),
        fetchAppointments(),
        fetchPatients()
      ]);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmissions = async () => {
    const { data, error } = await supabase
      .from('admissions')
      .select('*')
      .eq('status', 'PENDING_APPROVAL')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setAdmissions(data || []);
  };

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, profiles(full_name, email)')
      .in('status', ['SCHEDULED', 'PENDING_CONFIRMATION'])
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    setAppointments(data || []);
  };

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient')
      .order('full_name', { ascending: true });
    
    if (error) throw error;
    setPatients(data || []);
  };

  const fetchPatientDetails = async (patient: any) => {
    setSelectedPatient(patient);
    const { data: history } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patient.id)
      .order('start_time', { ascending: false });
    
    const { data: admission } = await supabase
      .from('admissions')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setPatientHistory(history || []);
    setSelectedPatient({ ...patient, admission });
  };

  const cancelAppointment = async (id: string) => {
    if (!confirm("¿Estás segura de que quieres cancelar esta cita?")) return;
    
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'CANCELLED' })
        .eq('id', id);

      if (error) throw error;
      showSuccess("Cita cancelada");
      await fetchAppointments();
      if (selectedPatient) await fetchPatientDetails(selectedPatient);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdmission = async (admission: any, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(admission.id);

    try {
      const { error: updateError } = await supabase
        .from('admissions')
        .update({ status: status })
        .eq('id', admission.id);

      if (updateError) throw updateError;

      if (status === 'APPROVED') {
        await supabase
          .from('profiles')
          .update({ role: 'patient' })
          .eq('id', admission.patient_id);

        try {
          const functionUrl = `https://remnvakjvujygcdwnsgn.supabase.co/functions/v1/notify-approval`;
          await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({ email: admission.email })
          });
          showSuccess("Paciente aprobado y notificado.");
        } catch (e) {
          showError("Aprobado, pero falló el email.");
        }
      }
      await fetchAllData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-[#fdfaf6] font-sans">
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#e8e1d5] px-4 md:px-8 py-4 md:py-5 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#c17d60] rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-[#c17d60]/20 shrink-0">
            <Leaf className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h1 className="text-lg md:text-2xl font-serif font-medium text-[#4a3f35] truncate">Panel Profesional</h1>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <Button variant="outline" size="icon" onClick={fetchAllData} className="rounded-full border-[#e8e1d5] text-[#7a6f64] h-9 w-9 md:h-10 md:w-10">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <Button variant="ghost" onClick={signOut} className="text-[#7a6f64] hover:text-red-500 hover:bg-red-50 rounded-full h-9 md:h-10 px-3 md:px-4 text-sm md:text-base">
            <LogOut className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Cerrar Sesión</span>
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <Tabs defaultValue="appointments" className="space-y-6 md:space-y-10">
          <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            <TabsList className="bg-white border border-[#e8e1d5] p-1 h-12 md:h-14 rounded-2xl md:rounded-[1.5rem] shadow-sm flex w-max md:w-fit">
              <TabsTrigger value="appointments" className="rounded-xl px-4 md:px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white transition-all text-sm md:text-base">
                <Calendar className="w-4 h-4 mr-2" /> Próximas
              </TabsTrigger>
              <TabsTrigger value="patients" className="rounded-xl px-4 md:px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white transition-all text-sm md:text-base">
                <UserCircle className="w-4 h-4 mr-2" /> Pacientes
              </TabsTrigger>
              <TabsTrigger value="admissions" className="rounded-xl px-4 md:px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white transition-all text-sm md:text-base">
                <ClipboardList className="w-4 h-4 mr-2" /> Admisiones ({admissions.length})
              </TabsTrigger>
              <TabsTrigger value="availability" className="rounded-xl px-4 md:px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white transition-all text-sm md:text-base">
                <Clock className="w-4 h-4 mr-2" /> Agenda
              </TabsTrigger>
              <TabsTrigger value="content" className="rounded-xl px-4 md:px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white transition-all text-sm md:text-base">
                <Settings className="w-4 h-4 mr-2" /> Contenido
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="appointments" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              {appointments.length > 0 ? (
                appointments.map((apt) => (
                  <Card key={apt.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white hover:shadow-2xl transition-all rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8">
                        <div className="flex items-center space-x-4 md:space-x-6 min-w-0">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-[#fdfaf6] border border-[#e8e1d5] rounded-2xl md:rounded-3xl flex items-center justify-center text-[#c17d60] text-lg md:text-xl font-bold shrink-0">
                            {apt.profiles?.full_name?.charAt(0) || 'P'}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-xl md:text-2xl font-serif text-[#4a3f35] truncate">{apt.profiles?.full_name || 'Paciente'}</h3>
                            <p className="text-sm md:text-base text-[#7a6f64] truncate">{apt.profiles?.email}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-8 w-full lg:w-auto">
                          <div className="space-y-1">
                            <div className="flex items-center text-[#4a3f35] font-medium text-sm md:text-base">
                              <Calendar className="w-4 h-4 mr-2 text-[#c17d60]" />
                              {format(new Date(apt.start_time), 'PPP', { locale: es })}
                            </div>
                            <div className="flex items-center text-[#7a6f64] text-sm md:text-base">
                              <Clock className="w-4 h-4 mr-2 opacity-50" />
                              {format(new Date(apt.start_time), 'HH:mm')}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 w-full sm:w-auto">
                            <Badge className={cn(
                              "px-3 py-1 rounded-full border-none text-xs md:text-sm",
                              apt.status === 'PENDING_CONFIRMATION' ? "bg-amber-100 text-amber-700" : "bg-[#b5b891]/20 text-[#6b6e4d]"
                            )}>
                              {translateStatus(apt.status)}
                            </Badge>
                            <div className="flex gap-2 flex-1 sm:flex-none">
                              {apt.status === 'SCHEDULED' && (
                                <Button asChild className="bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-6 h-10 md:h-12 text-sm md:text-base flex-1">
                                  <Link to={`/session/${apt.id}`}>
                                    <Video className="w-4 h-4 mr-2" /> Unirse
                                  </Link>
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                onClick={() => cancelAppointment(apt.id)}
                                disabled={actionLoading === apt.id}
                                className="text-red-500 hover:bg-red-50 rounded-full h-10 md:h-12 px-4"
                              >
                                {actionLoading === apt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-16 md:py-24 bg-white rounded-[2.5rem] md:rounded-[3rem] border-2 border-dashed border-[#e8e1d5]">
                  <Calendar className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 text-[#e8e1d5]" />
                  <h3 className="text-xl md:text-2xl font-serif text-[#7a6f64]">No hay citas programadas</h3>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6 md:space-y-8">
            {selectedPatient ? (
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <Button variant="ghost" onClick={() => setSelectedPatient(null)} className="text-[#7a6f64] hover:text-[#c17d60] rounded-full p-0 sm:px-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Volver al listado
                  </Button>
                  <div className="flex gap-3">
                    <MessageDialog 
                      otherUserId={selectedPatient.id} 
                      otherUserName={selectedPatient.full_name} 
                    />
                    <AdminBookingDialog 
                      patientId={selectedPatient.id} 
                      patientName={selectedPatient.full_name} 
                      onSuccess={() => fetchPatientDetails(selectedPatient)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                  <div className="space-y-6 md:space-y-8 xl:col-span-1">
                    <Card className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
                      <CardHeader className="border-b border-[#fdfaf6] p-6 md:p-8">
                        <div className="flex items-center space-x-4 md:space-x-6">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-[#c17d60]/10 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-[#c17d60] text-2xl md:text-3xl font-bold shrink-0">
                            {selectedPatient.full_name?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-xl md:text-2xl font-serif text-[#4a3f35] truncate">{selectedPatient.full_name}</CardTitle>
                            <CardDescription className="text-sm md:text-base text-[#7a6f64] truncate">{selectedPatient.email}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 md:p-8 space-y-6 md:space-y-8">
                        {selectedPatient.admission ? (
                          <div className="space-y-3">
                            <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest">Motivo de Consulta</Label>
                            <p className="text-sm md:text-base text-[#4a3f35] bg-[#fdfaf6] p-4 md:p-5 rounded-2xl border border-[#e8e1d5] leading-relaxed">
                              {selectedPatient.admission.reason_for_consultation}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-[#7a6f64] italic">Sin formulario de admisión.</p>
                        )}
                      </CardContent>
                    </Card>

                    <DocumentManager patientId={selectedPatient.id} isAdmin={true} />
                  </div>

                  <Card className="xl:col-span-2 border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-6 md:p-8">
                      <CardTitle className="text-xl md:text-2xl font-serif text-[#4a3f35] flex items-center">
                        <History className="w-5 h-5 md:w-6 md:h-6 mr-3 text-[#b5b891]" /> Historial
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                      <div className="space-y-3 md:space-y-4">
                        {patientHistory.length > 0 ? (
                          patientHistory.map((apt) => (
                            <div key={apt.id} className="flex items-center justify-between p-4 md:p-6 bg-[#fdfaf6] rounded-2xl md:rounded-[2rem] border border-[#e8e1d5] hover:border-[#c17d60]/30 transition-colors">
                              <div className="flex items-center space-x-4 md:space-x-6 min-w-0">
                                <div className={cn(
                                  "p-3 md:p-4 rounded-xl md:rounded-2xl shrink-0",
                                  isPast(new Date(apt.start_time)) ? "bg-[#e8e1d5] text-[#7a6f64]" : "bg-[#b5b891]/20 text-[#6b6e4d]"
                                )}>
                                  <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-base md:text-lg font-serif text-[#4a3f35] truncate">
                                    {format(new Date(apt.start_time), 'PPP', { locale: es })}
                                  </p>
                                  <p className="text-xs md:text-sm text-[#7a6f64]">
                                    {format(new Date(apt.start_time), 'HH:mm')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className={cn(
                                  "rounded-full px-3 md:px-4 text-[10px] md:text-xs shrink-0",
                                  apt.status === 'PENDING_CONFIRMATION' ? "bg-amber-100 text-amber-700" : ""
                                )}>
                                  {translateStatus(apt.status)}
                                </Badge>
                                
                                <ClinicalNoteDialog 
                                  appointmentId={apt.id} 
                                  patientId={selectedPatient.id}
                                  appointmentDate={apt.start_time}
                                />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center py-12 text-sm text-[#7a6f64]">No hay citas registradas.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8">
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a6f64] w-5 h-5" />
                  <Input 
                    placeholder="Buscar paciente..." 
                    className="pl-12 h-12 md:h-14 bg-white border-[#e8e1d5] rounded-full focus:ring-[#c17d60] text-base md:text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredPatients.map((patient) => (
                    <Card 
                      key={patient.id} 
                      className="border-none shadow-xl shadow-[#c17d60]/5 bg-white hover:shadow-2xl transition-all cursor-pointer group rounded-[2rem] overflow-hidden"
                      onClick={() => fetchPatientDetails(patient)}
                    >
                      <CardContent className="p-6 md:p-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 min-w-0">
                            <div className="w-12 h-12 md:w-14 md:h-14 bg-[#fdfaf6] border border-[#e8e1d5] rounded-xl md:rounded-2xl flex items-center justify-center text-[#c17d60] font-bold group-hover:bg-[#c17d60] group-hover:text-white transition-all shrink-0">
                              {patient.full_name?.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base md:text-lg font-serif text-[#4a3f35] group-hover:text-[#c17d60] transition-colors truncate">{patient.full_name}</h3>
                              <p className="text-xs md:text-sm text-[#7a6f64] truncate">{patient.email}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#e8e1d5] group-hover:text-[#c17d60] transition-all shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="admissions" className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 gap-6 md:gap-8">
              {admissions.length > 0 ? (
                admissions.map((adm) => (
                  <Card key={adm.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] md:rounded-[3rem] overflow-hidden">
                    <CardHeader className="bg-[#fdfaf6] border-b border-[#e8e1d5] p-6 md:p-8">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center space-x-4 md:space-x-6 min-w-0">
                          <div className="w-14 h-14 md:w-16 md:h-16 bg-white border border-[#e8e1d5] rounded-2xl md:rounded-3xl flex items-center justify-center text-[#c17d60] text-lg md:text-xl font-bold shrink-0">
                            {adm.full_name?.charAt(0) || 'P'}
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-xl md:text-2xl font-serif text-[#4a3f35] truncate">
                              {adm.full_name || 'Paciente'}
                            </CardTitle>
                            <CardDescription className="flex items-center text-sm md:text-base text-[#7a6f64] truncate">
                              <Mail className="w-3 h-3 mr-2 shrink-0" /> {adm.email}
                            </CardDescription>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleAdmission(adm, 'APPROVED')} 
                          disabled={actionLoading === adm.id}
                          className="w-full md:w-auto bg-[#b5b891] hover:bg-[#a4a77d] text-white rounded-full px-8 h-11 md:h-12 text-sm md:text-base"
                        >
                          {actionLoading === adm.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Aprobar</>}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-10">
                      <p className="text-sm md:text-lg text-[#4a3f35] leading-relaxed bg-[#fdfaf6] p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-[#e8e1d5]">
                        {adm.reason_for_consultation}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-16 md:py-24 bg-white rounded-[2.5rem] md:rounded-[3rem] border-2 border-dashed border-[#e8e1d5]">
                  <ClipboardList className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 text-[#e8e1d5]" />
                  <h3 className="text-xl md:text-2xl font-serif text-[#7a6f64]">Sin solicitudes pendientes</h3>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilityManager />
          </TabsContent>

          <TabsContent value="content">
            <ContentManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;