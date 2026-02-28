"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Calendar, Video, FileText, ClipboardList } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [admissionStatus, setAdmissionStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmission = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('admissions')
        .select('status')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setAdmissionStatus(data?.status || 'NOT_STARTED');
    };
    checkAdmission();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#f0f9ff]">
      <nav className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-medium text-slate-800">Mi Espacio</h1>
        <Button variant="ghost" onClick={signOut} className="text-slate-500 hover:text-red-500">
          <LogOut className="w-4 h-4 mr-2" /> Salir
        </Button>
      </nav>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-3 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <ClipboardList className="w-5 h-5 mr-2 text-sky-500" /> Estado de tu solicitud
            </CardTitle>
          </CardHeader>
          <CardContent>
            {admissionStatus === 'NOT_STARTED' && (
              <div className="flex flex-col items-center py-8 text-center">
                <p className="text-slate-600 mb-4">Para comenzar tu terapia, necesitamos conocerte un poco mejor.</p>
                <Button asChild className="bg-sky-500 hover:bg-sky-600">
                  <Link to="/admission">Completar Formulario de Admisión</Link>
                </Button>
              </div>
            )}
            {admissionStatus === 'PENDING_APPROVAL' && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg text-amber-800 flex items-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-3" />
                Tu solicitud está siendo revisada por la psicóloga. Te avisaremos pronto.
              </div>
            )}
            {admissionStatus === 'APPROVED' && (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg text-emerald-800">
                ¡Solicitud aprobada! Ya puedes reservar tu primera sesión.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="text-sky-600" />
            </div>
            <h3 className="font-medium text-slate-800">Reservar Cita</h3>
            <p className="text-sm text-slate-500 mt-1">Elige el horario que mejor te venga</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Video className="text-indigo-600" />
            </div>
            <h3 className="font-medium text-slate-800">Entrar a Sesión</h3>
            <p className="text-sm text-slate-500 mt-1">Accede a tu videollamada privada</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="text-slate-600" />
            </div>
            <h3 className="font-medium text-slate-800">Mis Facturas</h3>
            <p className="text-sm text-slate-500 mt-1">Descarga tus recibos de terapia</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;