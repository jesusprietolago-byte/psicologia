"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { LogOut, Users, ClipboardList, Check, X, Pill, History, Baby, MessageSquare } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import AvailabilityManager from '@/components/AvailabilityManager';
import { showSuccess, showError } from '@/utils/toast';

const Admin = () => {
  const { role, signOut } = useAuth();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === 'admin') fetchAdmissions();
  }, [role]);

  const fetchAdmissions = async () => {
    const { data, error } = await supabase
      .from('admissions')
      .select('*, profiles(full_name, email)')
      .eq('status', 'PENDING_APPROVAL')
      .order('created_at', { ascending: false });
    
    if (error) showError(error.message);
    else setAdmissions(data || []);
    setLoading(false);
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

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Solicitudes de Admisión (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-light text-slate-800 flex items-center">
                <ClipboardList className="w-6 h-6 mr-2 text-sky-500" /> 
                Solicitudes Pendientes
                <Badge variant="secondary" className="ml-3 bg-sky-100 text-sky-700 border-none">
                  {admissions.length}
                </Badge>
              </h2>
            </div>

            <div className="space-y-4">
              {admissions.map((adm) => (
                <Card key={adm.id} className="border-none shadow-sm overflow-hidden bg-white hover:shadow-md transition-shadow">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-medium text-slate-800">
                          {adm.profiles?.full_name || 'Paciente sin nombre'}
                        </CardTitle>
                        <CardDescription>{adm.profiles?.email}</CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleAdmission(adm.id, 'APPROVED')} 
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        >
                          <Check className="w-4 h-4 mr-2" /> Aprobar
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleAdmission(adm.id, 'REJECTED')} 
                          className="text-red-500 border-red-100 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-2" /> Rechazar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Información Clínica */}
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
                          <div className="flex items-center text-sm text-slate-600">
                            <History className="w-4 h-4 mr-2 text-sky-500" />
                            Terapia previa
                          </div>
                          <Badge variant={adm.previous_therapy ? "default" : "secondary"} className={adm.previous_therapy ? "bg-sky-500" : ""}>
                            {adm.previous_therapy ? 'Sí' : 'No'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center text-sm text-slate-600">
                            <Baby className="w-4 h-4 mr-2 text-indigo-500" />
                            Menor de edad
                          </div>
                          <Badge variant={adm.is_minor ? "destructive" : "secondary"}>
                            {adm.is_minor ? 'Sí' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-slate-400 flex items-center text-xs uppercase tracking-wider">
                        <Pill className="w-3 h-3 mr-1" /> Medicación Actual
                      </Label>
                      <p className="text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {adm.medication || 'Ninguna reportada'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {admissions.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                  <Users className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                  <h3 className="text-lg font-medium text-slate-400">No hay solicitudes pendientes</h3>
                  <p className="text-slate-300 text-sm">Todo está al día por ahora.</p>
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Agenda de Disponibilidad (1/3) */}
          <div className="space-y-6">
            <AvailabilityManager />
          </div>

        </div>
      </main>
    </div>
  );
};

export default Admin;