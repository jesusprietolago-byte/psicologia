"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Users, Calendar, ClipboardList, Check, X } from 'lucide-react';
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
      .eq('status', 'PENDING_APPROVAL');
    
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
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-slate-900">Panel Profesional</h1>
        <Button variant="ghost" onClick={signOut} className="text-slate-500 hover:text-red-500">
          <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
        </Button>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase">Pendientes Aprobación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-sky-600">{admissions.length}</div>
            </CardContent>
          </Card>
          {/* Otros stats estáticos por ahora */}
          <Card className="bg-white border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase">Citas Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">0</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase">Pacientes Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">--</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gestión de Solicitudes */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="w-5 h-5 mr-2 text-sky-500" /> Solicitudes de Admisión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {admissions.map((adm) => (
                  <div key={adm.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-slate-800">{adm.profiles?.full_name || 'Paciente Nuevo'}</p>
                        <p className="text-xs text-slate-500">{adm.profiles?.email}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={() => handleAdmission(adm.id, 'APPROVED')} className="bg-emerald-500 hover:bg-emerald-600 h-8 w-8 p-0">
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleAdmission(adm.id, 'REJECTED')} variant="destructive" className="h-8 w-8 p-0">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100">
                      <p className="font-medium text-xs text-slate-400 uppercase mb-1">Motivo de consulta:</p>
                      {adm.reason_for_consultation}
                    </div>
                  </div>
                ))}
                {admissions.length === 0 && !loading && (
                  <div className="text-center py-12 text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No hay solicitudes pendientes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gestión de Disponibilidad */}
          <AvailabilityManager />
        </div>
      </main>
    </div>
  );
};

export default Admin;