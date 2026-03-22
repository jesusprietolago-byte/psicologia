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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  RefreshCw,
  Loader2,
  XCircle,
  Layout,
  FileText,
  Stethoscope,
  Pill,
  MessageCircle,
  Heart,
  Home,
  User
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
  const [activeTab, setActiveTab] = useState("appointments");
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

  const getAttentionTypeInfo = (type: string) => {
    switch (type) {
      case 'individual':
        return { label: 'Individual', icon: <User className="w-3 h-3 mr-1" />, color: 'bg-blue-50 text-blue-700 border-blue-100' };
      case 'parejas':
        return { label: 'Pareja', icon: <Heart className="w-3 h-3 mr-1" />, color: 'bg-pink-50 text-pink-700 border-pink-100' };
      case 'familiar':
        return { label: 'Familiar', icon: <Home className="w-3 h-3 mr-1" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      default:
        return { label: 'Individual', icon: <User className="w-3 h-3 mr-1" />, color: 'bg-slate-50 text-slate-700 border-slate-100' };
    }
  };

  if (role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-[#fdfaf6] font-sans">
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#e8e1d5] px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#c17d60] rounded-2xl flex items-center justify-center shadow-lg shadow-[#c17d60]/20 shrink-0">
            <Leaf className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h1 className="text-lg md:text-2xl font-serif font-medium text-[#4a3f35] truncate">Panel Profesional</h1>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4">
          <Button variant="outline" size="icon" onClick={fetchAllData} className="rounded-full h-9 w-9 md:h-10 md:w-10">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-[#7a6f64] hover:text-red-500 rounded-full px-2 md:px-4">
            <LogOut className="w-4 h-4 md:mr-2" /> 
            <span className="hidden md:inline">Salir</span>
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-10">
          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full h-12 rounded-2xl border-[#e8e1d5] bg-white text-[#4a3f35] shadow-sm">
                <SelectValue placeholder="Seleccionar sección" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-[#e8e1d5]">
                <SelectItem value="appointments" className="rounded-xl">
                  <div className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-[#c17d60]" /> Próximas</div>
                </SelectItem>
                <SelectItem value="patients" className="rounded-xl">
                  <div className="flex items-center relative">
                    <UserCircle className="w-4 h-4 mr-2 text-[#c17d60]" /> 
                    Pacientes
                    {totalUnread > 0 && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full" />}
                  </div>
                </SelectItem>
                <SelectItem value="admissions" className="rounded-xl">
                  <div className="flex items-center"><ClipboardList className="w-4 h-4 mr-2 text-[#c17d60]" /> Admisiones ({admissions.length})</div>
                </SelectItem>
                <SelectItem value="availability" className="rounded-xl">
                  <div className="flex items-center"><Clock className="w-4 h-4 mr-2 text-[#c17d60]" /> Agenda</div>
                </SelectItem>
                <SelectItem value="content" className="rounded-xl">
                  <div className="flex items-center"><Layout className="w-4 h-4 mr-2 text-[#c17d60]" /> Editar Web</div>
                </SelectItem>
                <SelectItem value="blog" className="rounded-xl">
                  <div className="flex items-center"><FileText className="w-4 h-4 mr-2 text-[#c17d60]" /> Blog</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden md:block overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="bg-white border border-[#e8e1d5] p-1 h-14 rounded-[1.5rem] shadow-sm inline-flex">
              <TabsTrigger value="appointments" className="rounded-xl px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white">
                <Calendar className="w-4 h-4 mr-2" /> Próximas
              </TabsTrigger>
              <TabsTrigger value="patients" className="rounded-xl px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white relative">
                <UserCircle className="w-4 h-4 mr-2" /> Pacientes
                {totalUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
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
          </div>

          <TabsContent value="appointments" className="space-y-4 md:space-y-6">
            {appointments.length > 0 ? appointments.map((apt) => (
              <Card key={apt.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-8">
                    <div className="flex items-center space-x-4 md:space-x-6 w-full lg:w-auto">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-[#fdfaf6] border border-[#e8e1d5] rounded-2xl md:rounded-3xl flex items-center justify-center text-[#c17d60] text-lg md:text-xl font-bold shrink-0">
                        {apt.profiles?.full_name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg md:text-2xl font-serif text-[#4a3f35] truncate">{apt.profiles?.full_name}</h3>
                        <p className="text-[#7a6f64] text-sm md:text-base truncate">{apt.profiles?.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 w-full lg:w-auto">
                      <div className="text-center sm:text-right w-full sm:w-auto">
                        <div className="flex items-center justify-center sm:justify-end text-[#4a3f35] font-medium text-sm md:text-base">
                          <Calendar className="w-4 h-4 mr-2 text-[#c17d60]" />
                          {format(new Date(apt.start_time), 'PPP', { locale: es })}
                        </div>
                        <div className="text-[#7a6f64] text-sm">{format(new Date(apt.start_time), 'HH:mm')}</div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        {apt.status === 'SCHEDULED' && (
                          <Button asChild className="flex-1 sm:flex-none bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-6 h-10 md:h-11">
                            <Link to={`/session/${apt.id}`}><Video className="w-4 h-4 mr-2" /> Unirse</Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => cancelAppointment(apt.id)} className="text-red-500 rounded-full h-10 w-10 md:h-11 md:w-11">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-12 md:py-20 bg-white rounded-[2rem] border-2 border-dashed border-[#e8e1d5]">
                <Calendar className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-[#e8e1d5]" />
                <p className="text-[#7a6f64]">No hay citas próximas programadas.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="patients" className="space-y-6 md:space-y-8">
            {selectedPatient ? (
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)} className="text-[#7a6f64] hover:text-[#c17d60] rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button>
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                  <div className="space-y-6 md:space-y-8">
                    <Card className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
                      <CardHeader className="border-b border-[#fdfaf6] p-6 md:p-8">
                        <div className="flex items-center space-x-4 md:space-x-6">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-[#c17d60]/10 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-[#c17d60] text-2xl md:text-3xl font-bold shrink-0">
                            {selectedPatient.full_name?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-xl md:text-2xl font-serif text-[#4a3f35] truncate">{selectedPatient.full_name}</CardTitle>
                            <CardDescription className="truncate">{selectedPatient.email}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 md:p-8 space-y-6 md:space-y-8">
                        {selectedPatient.admission ? (
                          <div className="space-y-6">
                            <div className="space-y-3">
                              <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest flex items-center">
                                <Stethoscope className="w-3 h-3 mr-2" /> Motivo de Consulta
                              </Label>
                              <p className="text-sm md:text-base text-[#4a3f35] bg-[#fdfaf6] p-4 md:p-5 rounded-2xl border border-[#e8e1d5] leading-relaxed">
                                {selectedPatient.admission.reason_for_consultation}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                              <div className="flex items-center justify-between p-3 md:p-4 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5]">
                                <span className="text-xs md:text-sm font-medium text-[#7a6f64]">Terapia previa</span>
                                <Badge variant="outline" className={selectedPatient.admission.previous_therapy ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-600"}>
                                  {selectedPatient.admission.previous_therapy ? 'Sí' : 'No'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center justify-between p-3 md:p-4 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5]">
                                <span className="text-xs md:text-sm font-medium text-[#7a6f64]">Menor de edad</span>
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
                                <p className="text-xs md:text-sm text-[#4a3f35] bg-[#fdfaf6] p-3 md:p-4 rounded-2xl border border-[#e8e1d5]">
                                  {selectedPatient.admission.medication}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-center py-6 text-[#7a6f64] italic text-sm">Sin datos de admisión.</p>
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <MessageDialog 
                            otherUserId={selectedPatient.id} 
                            otherUserName={selectedPatient.full_name} 
                            onOpen={fetchUnreadMessages}
                            trigger={
                              <Button variant="outline" className="flex-1 rounded-full border-[#c17d60] text-[#c17d60] hover:bg-[#c17d60] hover:text-white h-11">
                                <MessageCircle className="w-4 h-4 mr-2" /> Mensajes
                              </Button>
                            }
                          />
                          <AdminBookingDialog patientId={selectedPatient.id} patientName={selectedPatient.full_name} onSuccess={() => fetchPatientDetails(selectedPatient)} />
                        </div>
                      </CardContent>
                    </Card>

                    <DocumentManager patientId={selectedPatient.id} isAdmin={true} />
                  </div>

                  <Card className="xl:col-span-2 border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-6 md:p-8">
                      <CardTitle className="text-xl md:text-2xl font-serif text-[#4a3f35] flex items-center">
                        <History className="w-5 h-5 md:w-6 md:h-6 mr-3 text-[#b5b891]" /> Historial de Sesiones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8">
                      <div className="space-y-4">
                        {patientHistory.length > 0 ? patientHistory.map((apt) => (
                          <div key={apt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 bg-[#fdfaf6] rounded-2xl md:rounded-[2rem] border border-[#e8e1d5] gap-4">
                            <div className="flex items-center space-x-4 md:space-x-6">
                              <div className={cn("p-3 md:p-4 rounded-2xl shrink-0", isPast(new Date(apt.start_time)) ? "bg-[#e8e1d5] text-[#7a6f64]" : "bg-[#b5b891]/20 text-[#6b6e4d]")}>
                                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-base md:text-lg font-serif text-[#4a3f35] truncate">{format(new Date(apt.start_time), 'PPP', { locale: es })}</p>
                                <p className="text-xs md:text-sm text-[#7a6f64]">{format(new Date(apt.start_time), 'HH:mm')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                              <Badge variant="secondary" className="rounded-full px-3 md:px-4 text-[10px] md:text-xs">{translateStatus(apt.status)}</Badge>
                              <ClinicalNoteDialog appointmentId={apt.id} patientId={selectedPatient.id} appointmentDate={apt.start_time} />
                            </div>
                          </div>
                        )) : (
                          <p className="text-center py-10 text-[#7a6f64] italic text-sm">No hay historial de sesiones.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a6f64] w-5 h-5" />
                  <Input placeholder="Buscar paciente..." className="pl-12 h-12 md:h-14 bg-white border-[#e8e1d5] rounded-full text-sm md:text-base" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredPatients.map((patient) => (
                    <Card key={patient.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white hover:shadow-2xl transition-all cursor-pointer group rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative" onClick={() => fetchPatientDetails(patient)}>
                      {unreadMessages[patient.id] > 0 && (
                        <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse z-10" />
                      )}
                      <CardContent className="p-6 md:p-8 flex items-center justify-between">
                        <div className="flex items-center space-x-3 md:space-x-4 min-w-0">
                          <div className="w-12 h-12 md:w-14 md:h-14 bg-[#fdfaf6] border border-[#e8e1d5] rounded-xl md:rounded-2xl flex items-center justify-center text-[#c17d60] font-bold group-hover:bg-[#c17d60] group-hover:text-white transition-all shrink-0">
                            {patient.full_name?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-serif text-[#4a3f35] group-hover:text-[#c17d60] transition-colors truncate text-sm md:text-base">{patient.full_name}</h3>
                            <p className="text-[10px] md:text-xs text-[#7a6f64] truncate">{patient.email}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 md:w-5 h-5 text-[#e8e1d5] group-hover:text-[#c17d60] transition-all shrink-0" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="admissions" className="space-y-6">
            {admissions.length > 0 ? admissions.map((adm) => {
              const attentionInfo = getAttentionTypeInfo(adm.additional_data?.attention_type);
              return (
                <Card key={adm.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2rem] md:rounded-[3rem] overflow-hidden">
                  <CardHeader className="bg-[#fdfaf6] border-b border-[#e8e1d5] p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div className="flex items-center space-x-4 md:space-x-6 w-full sm:w-auto">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-white border border-[#e8e1d5] rounded-2xl md:rounded-3xl flex items-center justify-center text-[#c17d60] text-lg md:text-xl font-bold shrink-0">
                          {adm.full_name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-xl md:text-2xl font-serif text-[#4a3f35] truncate">{adm.full_name}</CardTitle>
                            <Badge variant="outline" className={cn("rounded-full px-2 py-0 text-[10px] font-bold uppercase tracking-tighter", attentionInfo.color)}>
                              {attentionInfo.icon} {attentionInfo.label}
                            </Badge>
                          </div>
                          <CardDescription className="truncate">{adm.email}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button onClick={() => handleAdmission(adm, 'APPROVED')} disabled={actionLoading === adm.id} className="flex-1 sm:flex-none bg-[#b5b891] hover:bg-[#a4a77d] text-white rounded-full px-6 h-10 md:h-12">
                          {actionLoading === adm.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Aprobar</>}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleAdmission(adm, 'REJECTED')} disabled={actionLoading === adm.id} className="text-red-500 rounded-full">
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 md:p-10 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                      <div className="p-3 md:p-4 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5] flex items-center justify-between">
                        <span className="text-xs md:text-sm text-[#7a6f64]">Terapia previa</span>
                        <Badge variant="outline" className="text-[10px] md:text-xs">{adm.previous_therapy ? 'Sí' : 'No'}</Badge>
                      </div>
                      <div className="p-3 md:p-4 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5] flex items-center justify-between">
                        <span className="text-xs md:text-sm text-[#7a6f64]">Menor de edad</span>
                        <Badge variant="outline" className="text-[10px] md:text-xs">{adm.is_minor ? 'Sí' : 'No'}</Badge>
                      </div>
                      <div className="p-3 md:p-4 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5] flex items-center justify-between">
                        <span className="text-xs md:text-sm text-[#7a6f64]">Fecha</span>
                        <span className="text-[10px] md:text-xs font-medium">{format(new Date(adm.created_at), 'dd/MM/yyyy')}</span>
                      </div>
                    </div>

                    {/* Detalles específicos según tipo de terapia */}
                    {adm.additional_data?.attention_type === 'parejas' && adm.additional_data.partner && (
                      <div className="p-6 bg-pink-50/30 rounded-[2rem] border border-pink-100 space-y-4">
                        <h4 className="text-sm font-bold text-pink-700 uppercase tracking-widest flex items-center">
                          <Heart className="w-4 h-4 mr-2" /> Datos de la Pareja
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-pink-600 uppercase font-bold">Nombre</p>
                            <p className="text-[#4a3f35] font-medium">{adm.additional_data.partner.fullName}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-pink-600 uppercase font-bold">Teléfono</p>
                            <p className="text-[#4a3f35] font-medium">{adm.additional_data.partner.phone}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {adm.additional_data?.attention_type === 'familiar' && adm.additional_data.family && (
                      <div className="p-6 bg-emerald-50/30 rounded-[2rem] border border-emerald-100 space-y-6">
                        <h4 className="text-sm font-bold text-emerald-700 uppercase tracking-widest flex items-center">
                          <Home className="w-4 h-4 mr-2" /> Miembros de la Familia
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] text-emerald-600 uppercase font-bold mb-2">Adultos</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {adm.additional_data.family.adults.map((adult: any, idx: number) => (
                                <div key={idx} className="bg-white/50 p-3 rounded-xl border border-emerald-100 text-sm">
                                  <p className="font-medium text-[#4a3f35]">{adult.fullName}</p>
                                  <p className="text-xs text-[#7a6f64]">{adult.phone}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-emerald-600 uppercase font-bold mb-2">Hijos</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {adm.additional_data.family.children.map((child: any, idx: number) => (
                                <div key={idx} className="bg-white/50 p-3 rounded-xl border border-emerald-100 text-sm">
                                  <p className="font-medium text-[#4a3f35]">{child.fullName}</p>
                                  <p className="text-xs text-[#7a6f64]">{child.age} años</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest">Motivo de Consulta</Label>
                      <p className="text-base md:text-lg text-[#4a3f35] leading-relaxed bg-[#fdfaf6] p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-[#e8e1d5]">
                        {adm.reason_for_consultation}
                      </p>
                    </div>
                    {adm.medication && (
                      <div className="space-y-3">
                        <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest">Medicación</Label>
                        <p className="text-xs md:text-sm text-[#4a3f35] bg-[#fdfaf6] p-3 md:p-4 rounded-2xl border border-[#e8e1d5]">
                          {adm.medication}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            }) : (
              <div className="text-center py-12 md:py-20 bg-white rounded-[2rem] border-2 border-dashed border-[#e8e1d5]">
                <ClipboardList className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-[#e8e1d5]" />
                <p className="text-[#7a6f64]">No hay solicitudes de admisión pendientes.</p>
              </div>
            )}
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