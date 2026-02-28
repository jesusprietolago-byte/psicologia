"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  LogOut, 
  Users, 
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
  FileText,
  ArrowLeft
} from 'lucide-react';
import { Navigate, Link } from 'react-router-dom';
import AvailabilityManager from '@/components/AvailabilityManager';
import { showSuccess, showError } from '@/utils/toast';
import { format, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

const Admin = () => {
  const { role, signOut } = useAuth();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (role === 'admin') {
      fetchAdmissions();
      fetchAppointments();
      fetchPatients();
    }
  }, [role]);

  const fetchAdmissions = async () => {
    const { data, error } = await supabase
      .from('admissions')
      .select('*, profiles(full_name, email)')
      .eq('status', 'PENDING_APPROVAL')
      .order('created_at', { ascending: false });
    
    if (error) showError(error.message);
    else setAdmissions(data || []);
  };

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, profiles(full_name, email)')
      .eq('status', 'SCHEDULED')
      .order('start_time', { ascending: true });
    
    if (error) showError(error.message);
    else setAppointments(data || []);
    setLoading(false);
  };

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'patient')
      .order('full_name', { ascending: true });
    
    if (error) showError(error.message);
    else setPatients(data || []);
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

  const handleAdmission = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    const { error } = await supabase
      .from('admissions')
      .update({ status })
      .eq('id', id);

    if (error) showError(error.message);
    else {
      showSuccess(`Solicitud ${status === 'APPROVED' ? 'aprobada' : 'rechazada'}`);
      fetchAdmissions();
    }
  };

  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (role !== 'admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
            <Users className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Panel Profesional</h1>
        </div>
        <Button variant="ghost" onClick={signOut} className="text-slate-500 hover:text-red-500">
          <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
        </Button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="appointments" className="space-y-8">
          <TabsList className="bg-white border border-slate-200 p-1 h-12 rounded-xl shadow-sm overflow-x-auto flex-nowrap">
            <TabsTrigger value="appointments" className="rounded-lg px-6 data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700">
              <Calendar className="w-4 h-4 mr-2" /> Próximas Citas
            </TabsTrigger>
            <TabsTrigger value="patients" className="rounded-lg px-6 data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700">
              <UserCircle className="w-4 h-4 mr-2" /> Pacientes
            </TabsTrigger>
            <TabsTrigger value="admissions" className="rounded-lg px-6 data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700">
              <ClipboardList className="w-4 h-4 mr-2" /> Admisiones ({admissions.length})
            </TabsTrigger>
            <TabsTrigger value="availability" className="rounded-lg px-6 data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700">
              <Clock className="w-4 h-4 mr-2" /> Agenda
            </TabsTrigger>
          </TabsList>

          {/* Pestaña de Citas */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {appointments.length > 0 ? (
                appointments.map((apt) => (
                  <Card key={apt.id} className="border-none shadow-sm bg-white hover:shadow-md transition-all">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 font-bold">
                            {apt.profiles?.full_name?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-800">{apt.profiles?.full_name || 'Paciente'}</h3>
                            <p className="text-sm text-slate-500">{apt.profiles?.email}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 md:gap-8">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-slate-600">
                              <Calendar className="w-4 h-4 mr-2 text-sky-500" />
                              {format(new Date(apt.start_time), 'PPP', { locale: es })}
                            </div>
                            <div className="flex items-center text-sm text-slate-500">
                              <Clock className="w-4 h-4 mr-2 text-slate-400" />
                              {format(new Date(apt.start_time), 'HH:mm')} - {format(new Date(apt.end_time), 'HH:mm')}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge className="bg-emerald-100 text-emerald-700 border-none">Confirmada</Badge>
                            <Button asChild className="bg-sky-600 hover:bg-sky-700">
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
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                  <h3 className="text-lg font-medium text-slate-400">No hay citas programadas</h3>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Pestaña de Pacientes (Base de Datos) */}
          <TabsContent value="patients" className="space-y-6">
            {selectedPatient ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <Button variant="ghost" onClick={() => setSelectedPatient(null)} className="mb-2">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Volver al listado
                </Button>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Perfil y Admisión */}
                  <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="border-b border-slate-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-2xl font-bold">
                          {selectedPatient.full_name?.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-xl">{selectedPatient.full_name}</CardTitle>
                          <CardDescription>{selectedPatient.email}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      {selectedPatient.admission ? (
                        <>
                          <div className="space-y-2">
                            <Label className="text-xs uppercase text-slate-400 font-bold">Motivo de Consulta</Label>
                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                              {selectedPatient.admission.reason_for_consultation}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <Label className="text-[10px] uppercase text-slate-400 block mb-1">Terapia Previa</Label>
                              <Badge variant={selectedPatient.admission.previous_therapy ? "default" : "secondary"}>
                                {selectedPatient.admission.previous_therapy ? 'Sí' : 'No'}
                              </Badge>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <Label className="text-[10px] uppercase text-slate-400 block mb-1">Menor de Edad</Label>
                              <Badge variant={selectedPatient.admission.is_minor ? "destructive" : "secondary"}>
                                {selectedPatient.admission.is_minor ? 'Sí' : 'No'}
                              </Badge>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No hay formulario de admisión registrado.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Historial de Citas */}
                  <Card className="lg:col-span-2 border-none shadow-sm bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <History className="w-5 h-5 mr-2 text-sky-500" /> Historial de Sesiones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {patientHistory.length > 0 ? (
                          patientHistory.map((apt) => (
                            <div key={apt.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center space-x-4">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  isPast(new Date(apt.start_time)) ? "bg-slate-200 text-slate-500" : "bg-emerald-100 text-emerald-600"
                                )}>
                                  <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800">
                                    {format(new Date(apt.start_time), 'PPP', { locale: es })}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {format(new Date(apt.start_time), 'HH:mm')} - {format(new Date(apt.end_time), 'HH:mm')}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={isPast(new Date(apt.start_time)) ? "secondary" : "default"}>
                                {isPast(new Date(apt.start_time)) ? 'Realizada' : 'Programada'}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-center py-8 text-slate-400">No hay citas registradas para este paciente.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input 
                    placeholder="Buscar paciente por nombre o email..." 
                    className="pl-10 bg-white border-slate-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPatients.map((patient) => (
                    <Card 
                      key={patient.id} 
                      className="border-none shadow-sm bg-white hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => fetchPatientDetails(patient)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center text-sky-600 font-bold group-hover:bg-sky-600 group-hover:text-white transition-colors">
                              {patient.full_name?.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-medium text-slate-800">{patient.full_name}</h3>
                              <p className="text-xs text-slate-500">{patient.email}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Pestaña de Admisiones */}
          <TabsContent value="admissions" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {admissions.map((adm) => (
                <Card key={adm.id} className="border-none shadow-sm overflow-hidden bg-white">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-medium text-slate-800">
                          {adm.profiles?.full_name || 'Paciente sin nombre'}
                        </CardTitle>
                        <CardDescription>{adm.profiles?.email}</CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={() => handleAdmission(adm.id, 'APPROVED')} className="bg-emerald-500 hover:bg-emerald-600">
                          <Check className="w-4 h-4 mr-2" /> Aprobar
                        </Button>
                        <Button variant="outline" onClick={() => handleAdmission(adm.id, 'REJECTED')} className="text-red-500 border-red-100 hover:bg-red-50">
                          <X className="w-4 h-4 mr-2" /> Rechazar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <Label className="text-slate-400 flex items-center text-xs uppercase tracking-wider">
                          <MessageSquare className="w-3 h-3 mr-1" /> Motivo de Consulta
                        </Label>
                        <p className="text-slate-700 text-sm leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {adm.reason_for_consultation}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-sm text-slate-600 flex items-center"><History className="w-4 h-4 mr-2 text-sky-500" /> Terapia previa</span>
                          <Badge variant={adm.previous_therapy ? "default" : "secondary"}>{adm.previous_therapy ? 'Sí' : 'No'}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-sm text-slate-600 flex items-center"><Baby className="w-4 h-4 mr-2 text-indigo-500" /> Menor de edad</span>
                          <Badge variant={adm.is_minor ? "destructive" : "secondary"}>{adm.is_minor ? 'Sí' : 'No'}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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

import { cn } from '@/lib/utils';
import { ChevronRight as ChevronRightIcon } from 'lucide-react';
export default Admin;