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
  X, 
  History, 
  Baby, 
  MessageSquare, 
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
  Loader2
} from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import AvailabilityManager from '@/components/AvailabilityManager';
import { showSuccess, showError } from '@/utils/toast';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
      .eq('status', 'SCHEDULED')
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

  const handleAdmission = async (admission: any, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(admission.id);
    try {
      // 1. Actualizar estado de admisión
      const { error: updateError } = await supabase
        .from('admissions')
        .update({ status: status })
        .eq('id', admission.id);

      if (updateError) throw updateError;

      if (status === 'APPROVED') {
        // 2. Asegurar rol de paciente
        await supabase
          .from('profiles')
          .update({ role: 'patient' })
          .eq('id', admission.patient_id);

        // 3. Notificar enviando un Magic Link (usa el mailer interno de Supabase)
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
          showSuccess("Aprobado. Se ha enviado un email de acceso al paciente.");
        } catch (e) {
          showSuccess("Aprobado, pero no se pudo enviar el email de notificación.");
        }
      } else {
        showSuccess("Solicitud rechazada.");
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
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#e8e1d5] px-8 py-5 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#c17d60] rounded-2xl flex items-center justify-center shadow-lg shadow-[#c17d60]/20">
            <Leaf className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-medium text-[#4a3f35]">Panel Profesional</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={fetchAllData} className="rounded-full border-[#e8e1d5] text-[#7a6f64]">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <Button variant="ghost" onClick={signOut} className="text-[#7a6f64] hover:text-red-500 hover:bg-red-50 rounded-full">
            <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        <Tabs defaultValue="appointments" className="space-y-10">
          <TabsList className="bg-white border border-[#e8e1d5] p-1.5 h-14 rounded-[1.5rem] shadow-sm flex w-fit">
            <TabsTrigger value="appointments" className="rounded-xl px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white transition-all">
              <Calendar className="w-4 h-4 mr-2" /> Próximas Citas
            </TabsTrigger>
            <TabsTrigger value="patients" className="rounded-xl px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white transition-all">
              <UserCircle className="w-4 h-4 mr-2" /> Pacientes
            </TabsTrigger>
            <TabsTrigger value="admissions" className="rounded-xl px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white transition-all">
              <ClipboardList className="w-4 h-4 mr-2" /> Admisiones ({admissions.length})
            </TabsTrigger>
            <TabsTrigger value="availability" className="rounded-xl px-8 data-[state=active]:bg-[#c17d60] data-[state=active]:text-white transition-all">
              <Clock className="w-4 h-4 mr-2" /> Agenda
            </TabsTrigger>
          </TabsList>

          {/* Pestaña de Citas */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {appointments.length > 0 ? (
                appointments.map((apt) => (
                  <Card key={apt.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white hover:shadow-2xl transition-all rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="flex items-center space-x-6">
                          <div className="w-16 h-16 bg-[#fdfaf6] border border-[#e8e1d5] rounded-3xl flex items-center justify-center text-[#c17d60] text-xl font-bold">
                            {apt.profiles?.full_name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <h3 className="text-2xl font-serif text-[#4a3f35]">{apt.profiles?.full_name || 'Paciente'}</h3>
                            <p className="text-[#7a6f64]">{apt.profiles?.email}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-8">
                          <div className="space-y-2">
                            <div className="flex items-center text-[#4a3f35] font-medium">
                              <Calendar className="w-4 h-4 mr-3 text-[#c17d60]" />
                              {format(new Date(apt.start_time), 'PPP', { locale: es })}
                            </div>
                            <div className="flex items-center text-[#7a6f64]">
                              <Clock className="w-4 h-4 mr-3 opacity-50" />
                              {format(new Date(apt.start_time), 'HH:mm')} - {format(new Date(apt.end_time), 'HH:mm')}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <Badge className="bg-[#b5b891]/20 text-[#6b6e4d] border-none px-4 py-1.5 rounded-full">Confirmada</Badge>
                            <Button asChild className="bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-8 h-12">
                              <Link to={`/session/${apt.id}`}>
                                <Video className="w-4 h-4 mr-2" /> Unirse
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-[#e8e1d5]">
                  <Calendar className="w-16 h-16 mx-auto mb-6 text-[#e8e1d5]" />
                  <h3 className="text-2xl font-serif text-[#7a6f64]">No hay citas programadas</h3>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Pestaña de Pacientes */}
          <TabsContent value="patients" className="space-y-8">
            {selectedPatient ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <Button variant="ghost" onClick={() => setSelectedPatient(null)} className="text-[#7a6f64] hover:text-[#c17d60] rounded-full">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Volver al listado
                </Button>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="border-b border-[#fdfaf6] p-8">
                      <div className="flex items-center space-x-6">
                        <div className="w-20 h-20 bg-[#c17d60]/10 rounded-[2rem] flex items-center justify-center text-[#c17d60] text-3xl font-bold">
                          {selectedPatient.full_name?.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-serif text-[#4a3f35]">{selectedPatient.full_name}</CardTitle>
                          <CardDescription className="text-[#7a6f64]">{selectedPatient.email}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      {selectedPatient.admission ? (
                        <>
                          <div className="space-y-3">
                            <Label className="text-xs uppercase text-[#c17d60] font-bold tracking-widest">Motivo de Consulta</Label>
                            <p className="text-[#4a3f35] bg-[#fdfaf6] p-5 rounded-2xl border border-[#e8e1d5] leading-relaxed">
                              {selectedPatient.admission.reason_for_consultation}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5]">
                              <Label className="text-[10px] uppercase text-[#7a6f64] block mb-2 font-bold">Terapia Previa</Label>
                              <Badge variant={selectedPatient.admission.previous_therapy ? "default" : "secondary"} className={selectedPatient.admission.previous_therapy ? "bg-[#c17d60]" : ""}>
                                {selectedPatient.admission.previous_therapy ? 'Sí' : 'No'}
                              </Badge>
                            </div>
                            <div className="p-4 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5]">
                              <Label className="text-[10px] uppercase text-[#7a6f64] block mb-2 font-bold">Menor de Edad</Label>
                              <Badge variant={selectedPatient.admission.is_minor ? "destructive" : "secondary"}>
                                {selectedPatient.admission.is_minor ? 'Sí' : 'No'}
                              </Badge>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-[#7a6f64] italic">No hay formulario de admisión registrado.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2 border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8">
                      <CardTitle className="text-2xl font-serif text-[#4a3f35] flex items-center">
                        <History className="w-6 h-6 mr-3 text-[#b5b891]" /> Historial de Sesiones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="space-y-4">
                        {patientHistory.length > 0 ? (
                          patientHistory.map((apt) => (
                            <div key={apt.id} className="flex items-center justify-between p-6 bg-[#fdfaf6] rounded-[2rem] border border-[#e8e1d5] hover:border-[#c17d60]/30 transition-colors">
                              <div className="flex items-center space-x-6">
                                <div className={cn(
                                  "p-4 rounded-2xl",
                                  isPast(new Date(apt.start_time)) ? "bg-[#e8e1d5] text-[#7a6f64]" : "bg-[#b5b891]/20 text-[#6b6e4d]"
                                )}>
                                  <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-lg font-serif text-[#4a3f35]">
                                    {format(new Date(apt.start_time), 'PPP', { locale: es })}
                                  </p>
                                  <p className="text-sm text-[#7a6f64]">
                                    {format(new Date(apt.start_time), 'HH:mm')} - {format(new Date(apt.end_time), 'HH:mm')}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={isPast(new Date(apt.start_time)) ? "secondary" : "default"} className={!isPast(new Date(apt.start_time)) ? "bg-[#c17d60]" : ""}>
                                {isPast(new Date(apt.start_time)) ? 'Realizada' : 'Programada'}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-center py-12 text-[#7a6f64]">No hay citas registradas para este paciente.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a6f64] w-5 h-5" />
                  <Input 
                    placeholder="Buscar paciente..." 
                    className="pl-12 h-14 bg-white border-[#e8e1d5] rounded-full focus:ring-[#c17d60] text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPatients.map((patient) => (
                    <Card 
                      key={patient.id} 
                      className="border-none shadow-xl shadow-[#c17d60]/5 bg-white hover:shadow-2xl transition-all cursor-pointer group rounded-[2.5rem] overflow-hidden"
                      onClick={() => fetchPatientDetails(patient)}
                    >
                      <CardContent className="p-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-5">
                            <div className="w-14 h-14 bg-[#fdfaf6] border border-[#e8e1d5] rounded-2xl flex items-center justify-center text-[#c17d60] font-bold group-hover:bg-[#c17d60] group-hover:text-white transition-all">
                              {patient.full_name?.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-lg font-serif text-[#4a3f35] group-hover:text-[#c17d60] transition-colors">{patient.full_name}</h3>
                              <p className="text-sm text-[#7a6f64]">{patient.email}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[#e8e1d5] group-hover:text-[#c17d60] transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Pestaña de Admisiones */}
          <TabsContent value="admissions" className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
              {admissions.length > 0 ? (
                admissions.map((adm) => (
                  <Card key={adm.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[3rem] overflow-hidden">
                    <CardHeader className="bg-[#fdfaf6] border-b border-[#e8e1d5] p-8">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center space-x-6">
                          <div className="w-16 h-16 bg-white border border-[#e8e1d5] rounded-3xl flex items-center justify-center text-[#c17d60] text-xl font-bold">
                            {adm.full_name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <CardTitle className="text-2xl font-serif text-[#4a3f35]">
                              {adm.full_name || 'Paciente'}
                            </CardTitle>
                            <CardDescription className="flex items-center text-[#7a6f64]">
                              <Mail className="w-3 h-3 mr-2" /> {adm.email}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex space-x-3 w-full md:w-auto">
                          <Button 
                            onClick={() => handleAdmission(adm, 'APPROVED')} 
                            disabled={actionLoading === adm.id}
                            className="flex-1 md:flex-none bg-[#b5b891] hover:bg-[#a4a77d] text-white rounded-full px-8 h-12"
                          >
                            {actionLoading === adm.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Aprobar y Notificar</>}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleAdmission(adm, 'REJECTED')} 
                            disabled={actionLoading === adm.id}
                            className="flex-1 md:flex-none text-red-500 border-red-100 hover:bg-red-50 rounded-full px-8 h-12"
                          >
                            <X className="w-4 h-4 mr-2" /> Rechazar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-10">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <Label className="text-[#c17d60] flex items-center text-xs uppercase tracking-widest font-bold">
                            <MessageSquare className="w-4 h-4 mr-2" /> Motivo de Consulta
                          </Label>
                          <p className="text-[#4a3f35] text-lg leading-relaxed bg-[#fdfaf6] p-6 rounded-[2rem] border border-[#e8e1d5]">
                            {adm.reason_for_consultation}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-6 bg-[#fdfaf6] rounded-[2rem] border border-[#e8e1d5]">
                            <span className="text-[#4a3f35] font-medium flex items-center"><History className="w-5 h-5 mr-3 text-[#c17d60]" /> Terapia previa</span>
                            <Badge variant={adm.previous_therapy ? "default" : "secondary"} className={adm.previous_therapy ? "bg-[#c17d60]" : ""}>{adm.previous_therapy ? 'Sí' : 'No'}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-6 bg-[#fdfaf6] rounded-[2rem] border border-[#e8e1d5]">
                            <span className="text-[#4a3f35] font-medium flex items-center"><Baby className="w-5 h-5 mr-3 text-[#b5b891]" /> Menor de edad</span>
                            <Badge variant={adm.is_minor ? "destructive" : "secondary"}>{adm.is_minor ? 'Sí' : 'No'}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-[#e8e1d5]">
                  <ClipboardList className="w-16 h-16 mx-auto mb-6 text-[#e8e1d5]" />
                  <h3 className="text-2xl font-serif text-[#7a6f64]">No hay solicitudes pendientes</h3>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Pestaña de Disponibilidad */}
          <TabsContent value="availability">
            <AvailabilityManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;