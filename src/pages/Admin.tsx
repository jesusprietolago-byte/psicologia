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
  Settings,
  Layout,
  FileText,
  Stethoscope,
  Pill,
  Baby
} from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import AvailabilityManager from '@/components/AvailabilityManager';
import AdminBookingDialog from '@/components/AdminBookingDialog';
import DocumentManager from '@/components/DocumentManager';
import ClinicalNoteDialog from '@/components/ClinicalNoteDialog';
import MessageDialog from '@/components/MessageDialog';
import VisualEditor from '@/components/VisualEditor';
import BlogManager from '@/components/BlogManager';
import { showSuccess, showError } from '@/utils/toast';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { translateStatus } from '@/utils/translations';

const Admin = () => {
  const { user, role, signOut } = useAuth();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});

  useEffect(() => {
    if (role === 'admin') {
      fetchAllData();
      fetchUnreadMessages();

      const channel = supabase
        .channel('admin-messages')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'messages'
        }, () => {
          fetchUnreadMessages();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [role]);

  const fetchUnreadMessages = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      
      const counts: Record<string, number> = {};
      data?.forEach(msg => {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
      });
      setUnreadMessages(counts);
    } catch (e) {
      setUnreadMessages({});
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAdmissions(),
        fetchAppointments(),
        fetchPatients()
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmissions = async () => {
    const { data } = await supabase
      .from('admissions')
      .select('*')
      .eq('status', 'PENDING_APPROVAL')
      .order('created_at', { ascending: false });
    setAdmissions(data || []);
  };

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*, profiles(full_name, email)')
      .in('status', ['SCHEDULED', 'PENDING_CONFIRMATION'])
      .order('start_time', { ascending: true });
    setAppointments(data || []);
  };

  const fetchPatients = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient')
      .order('full_name', { ascending: true });
    setPatients(data || []);
  };

  const fetchPatientDetails = async (patient: any) => {
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
    if (!confirm("¿Cancelar esta cita?")) return;
    setActionLoading(id);
    try {
      await supabase.from('appointments').update({ status: 'CANCELLED' }).eq('id', id);
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
      await supabase.from('admissions').update({ status }).eq('id', admission.id);
      if (status === 'APPROVED') {
        await supabase.from('profiles').update({ role: 'patient' }).eq('id', admission.patient_id);
        try {
          await fetch(`https://remnvakjvujygcdwnsgn.supabase.co/functions/v1/notify-approval`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({ email: admission.email })
          });
        } catch (e) {}
      }
      showSuccess(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'}`);
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

  const totalUnread = Object.values(unreadMessages).reduce((a, b) => a + b, 0);

  if (role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-[#fdfaf6] font-sans">
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#e8e1d5] px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#c17d60] rounded-2xl flex items-center justify-center shadow-lg shadow-[#c17d60]/20">
            <Leaf className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-medium text-[#4a3f35]">Panel Profesional</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={fetchAllData} className="rounded-full">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <Button variant="ghost" onClick={signOut} className="text-[#7a6f64] hover:text-red-500 rounded-full">
            <LogOut className="w-4 h-4 mr-2" /> Salir
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <Tabs defaultValue="appointments" className="space-y-10">
          <TabsList className="bg-white border border-[#e8e1d5] p-1 h-14 rounded-[1.5rem] shadow-sm">
            <TabsTrigger value="appointments" className="rounded-xl px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" /> Próximas
            </TabsTrigger>
            <TabsTrigger value="patients" className="rounded-xl px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white relative">
              <UserCircle className="w-4 h-4 mr-2" /> Pacientes
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse" />
              )}
            </TabsTrigger>
            <TabsTrigger value="admissions" className="rounded-xl px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white">
              <ClipboardList className="w-4 h-4 mr-2" /> Admisiones ({admissions.length})
            </TabsTrigger>
            <TabsTrigger value="availability" className="rounded-xl px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" /> Agenda
            </TabsTrigger>
            <TabsTrigger value="content" className="rounded-xl px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white">
              <Layout className="w-4 h-4 mr-2" /> Editar Web
            </TabsTrigger>
            <TabsTrigger value="blog" className="rounded-xl px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" /> Blog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            {appointments.map((apt) => (
              <Card key={apt.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 bg-[#fdfaf6] border border-[#e8e1d5] rounded-3xl flex items-center justify-center text-[#c17d60] text-xl font-bold">
                        {apt.profiles?.full_name?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif text-[#4a3f35]">{apt.profiles?.full_name}</h3>
                        <p className="text-[#7a6f64]">{apt.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="flex items-center text-[#4a3f35] font-medium">
                          <Calendar className="w-4 h-4 mr-2 text-[#c17d60]" />
                          {format(new Date(apt.start_time), 'PPP', { locale: es })}
                        </div>
                        <div className="text-[#7a6f64]">{format(new Date(apt.start_time), 'HH:mm')}</div>
                      </div>
                      <div className="flex gap-2">
                        {apt.status === 'SCHEDULED' && (
                          <Button asChild className="bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-6">
                            <Link to={`/session/${apt.id}`}><Video className="w-4 h-4 mr-2" /> Unirse</Link>
                          </Button>
                        )}
                        <Button variant="ghost" onClick={() => cancelAppointment(apt.id)} className="text-red-500 rounded-full">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="patients" className="space-y-8">
            {selectedPatient ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <Button variant="ghost" onClick={() => setSelectedPatient(null)} className="text-[#7a6f64] hover:text-[#c17d60] rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button>
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="space-y-8">
                    <Card className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden">
                      <CardHeader className="border-b border-[#fdfaf6] p-8">
                        <div className="flex items-center space-x-6">
                          <div className="w-20 h-20 bg-[#c17d60]/10 rounded-[2rem] flex items-center justify-center text-[#c17d60] text-3xl font-bold">
                            {selectedPatient.full_name?.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-2xl font-serif text-[#4a3f35]">{selectedPatient.full_name}</CardTitle>
                            <CardDescription>{selectedPatient.email}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 space-y-8">
                        {selectedPatient.admission ? (
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest flex items-center">
                                <Stethoscope className="w-3 h-3 mr-2" /> Motivo de Consulta
                              </Label>
                              <p className="text-[#4a3f35] bg-[#fdfaf6] p-5 rounded-2xl border border-[#e8e1d5] leading-relaxed">
                                {selectedPatient.admission.reason_for_consultation}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                              <div className="flex items-center justify-between p-4 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5]">
                                <span className="text-sm font-medium text-[#7a6f64]">Terapia previa</span>
                                <Badge variant="outline" className={selectedPatient.admission.previous_therapy ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-600"}>
                                  {selectedPatient.admission.previous_therapy ? 'Sí' : 'No'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center justify-between p-4 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5]">
                                <span className="text-sm font-medium text-[#7a6f64]">Menor de edad</span>
                                <Badge variant="outline" className={selectedPatient.admission.is_minor ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-50 text-slate-600"}>
                                  {selectedPatient.admission.is_minor ? 'Sí' : 'No'}
                                </Badge>
                              </div>
                            </div>

                            {selectedPatient.admission.medication && (
                              <div className="space-y-3">
                                <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest flex items-center">
                                  <Pill className="w-3 h-3 mr-2" /> Medicación
                                </Label>
                                <p className="text-sm text-[#4a3f35] bg-[#fdfaf6] p-4 rounded-2xl border border-[#e8e1d5]">
                                  {selectedPatient.admission.medication}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-center py-8 text-[#7a6f64] italic">Sin datos de admisión.</p>
                        )}
                        
                        <div className="flex gap-3 pt-4">
                          <MessageDialog 
                            otherUserId={selectedPatient.id} 
                            otherUserName={selectedPatient.full_name} 
                            onOpen={fetchUnreadMessages}
                          />
                          <AdminBookingDialog patientId={selectedPatient.id} patientName={selectedPatient.full_name} onSuccess={() => fetchPatientDetails(selectedPatient)} />
                        </div>
                      </CardContent>
                    </Card>

                    <DocumentManager patientId={selectedPatient.id} isAdmin={true} />
                  </div>

                  <Card className="xl:col-span-2 border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8">
                      <CardTitle className="text-2xl font-serif text-[#4a3f35] flex items-center">
                        <History className="w-6 h-6 mr-3 text-[#b5b891]" /> Historial de Sesiones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="space-y-4">
                        {patientHistory.map((apt) => (
                          <div key={apt.id} className="flex items-center justify-between p-6 bg-[#fdfaf6] rounded-[2rem] border border-[#e8e1d5]">
                            <div className="flex items-center space-x-6">
                              <div className={cn("p-4 rounded-2xl", isPast(new Date(apt.start_time)) ? "bg-[#e8e1d5] text-[#7a6f64]" : "bg-[#b5b891]/20 text-[#6b6e4d]")}>
                                <Calendar className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-lg font-serif text-[#4a3f35]">{format(new Date(apt.start_time), 'PPP', { locale: es })}</p>
                                <p className="text-sm text-[#7a6f64]">{format(new Date(apt.start_time), 'HH:mm')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="rounded-full px-4">{translateStatus(apt.status)}</Badge>
                              <ClinicalNoteDialog appointmentId={apt.id} patientId={selectedPatient.id} appointmentDate={apt.start_time} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a6f64] w-5 h-5" />
                  <Input placeholder="Buscar paciente..." className="pl-12 h-14 bg-white border-[#e8e1d5] rounded-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPatients.map((patient) => (
                    <Card key={patient.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white hover:shadow-2xl transition-all cursor-pointer group rounded-[2rem] overflow-hidden relative" onClick={() => fetchPatientDetails(patient)}>
                      {unreadMessages[patient.id] > 0 && (
                        <span className="absolute top-4 right-4 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse z-10" />
                      )}
                      <CardContent className="p-8 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-14 h-14 bg-[#fdfaf6] border border-[#e8e1d5] rounded-2xl flex items-center justify-center text-[#c17d60] font-bold group-hover:bg-[#c17d60] group-hover:text-white transition-all">
                            {patient.full_name?.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-serif text-[#4a3f35] group-hover:text-[#c17d60] transition-colors">{patient.full_name}</h3>
                            <p className="text-xs text-[#7a6f64]">{patient.email}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#e8e1d5] group-hover:text-[#c17d60] transition-all" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="admissions">
            <div className="grid grid-cols-1 gap-8">
              {admissions.map((adm) => (
                <Card key={adm.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[3rem] overflow-hidden">
                  <CardHeader className="bg-[#fdfaf6] border-b border-[#e8e1d5] p-8">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-6">
                        <div className="w-16 h-16 bg-white border border-[#e8e1d5] rounded-3xl flex items-center justify-center text-[#c17d60] text-xl font-bold">
                          {adm.full_name?.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-serif text-[#4a3f35]">{adm.full_name}</CardTitle>
                          <CardDescription>{adm.email}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={() => handleAdmission(adm, 'APPROVED')} disabled={actionLoading === adm.id} className="bg-[#b5b891] hover:bg-[#a4a77d] text-white rounded-full px-8 h-12">
                          {actionLoading === adm.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Aprobar</>}
                        </Button>
                        <Button variant="ghost" onClick={() => handleAdmission(adm, 'REJECTED')} disabled={actionLoading === adm.id} className="text-red-500 rounded-full">
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="p-4 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5] flex items-center justify-between">
                        <span className="text-sm text-[#7a6f64]">Terapia previa</span>
                        <Badge variant="outline">{adm.previous_therapy ? 'Sí' : 'No'}</Badge>
                      </div>
                      <div className="p-4 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5] flex items-center justify-between">
                        <span className="text-sm text-[#7a6f64]">Menor de edad</span>
                        <Badge variant="outline">{adm.is_minor ? 'Sí' : 'No'}</Badge>
                      </div>
                      <div className="p-4 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5] flex items-center justify-between">
                        <span className="text-sm text-[#7a6f64]">Fecha</span>
                        <span className="text-xs font-medium">{format(new Date(adm.created_at), 'dd/MM/yyyy')}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest">Motivo de Consulta</Label>
                      <p className="text-lg text-[#4a3f35] leading-relaxed bg-[#fdfaf6] p-6 rounded-[2rem] border border-[#e8e1d5]">
                        {adm.reason_for_consultation}
                      </p>
                    </div>
                    {adm.medication && (
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest">Medicación</Label>
                        <p className="text-sm text-[#4a3f35] bg-[#fdfaf6] p-4 rounded-2xl border border-[#e8e1d5]">
                          {adm.medication}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="availability"><AvailabilityManager /></TabsContent>
          <TabsContent value="content"><VisualEditor /></TabsContent>
          <TabsContent value="blog"><BlogManager /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;