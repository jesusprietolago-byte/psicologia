"use client";

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Video, Clock, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Appointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user]);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', user?.id)
      .order('start_time', { ascending: true });

    if (error) console.error(error);
    else setAppointments(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>

        <h1 className="text-2xl font-light text-slate-800 mb-6">Mis Citas</h1>
        
        <div className="space-y-4">
          {appointments.map((apt) => (
            <Card key={apt.id} className="border-none shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg font-medium">
                  <span>Sesión de Terapia</span>
                  <Badge variant={apt.status === 'SCHEDULED' ? 'default' : 'secondary'}>
                    {apt.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-slate-600">
                      <Calendar className="w-4 h-4 mr-2 text-sky-500" />
                      {format(new Date(apt.start_time), 'PPP', { locale: es })}
                    </div>
                    <div className="flex items-center text-slate-500 text-sm">
                      <Clock className="w-4 h-4 mr-2" />
                      {format(new Date(apt.start_time), 'HH:mm')} - {format(new Date(apt.end_time), 'HH:mm')}
                    </div>
                  </div>
                  
                  {apt.status === 'SCHEDULED' && apt.video_room_url && (
                    <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                      <Link to={`/session/${apt.id}`}>
                        <Video className="w-4 h-4 mr-2" /> Entrar a Sesión
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && appointments.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <h3 className="text-lg font-medium text-slate-400">No tienes citas programadas</h3>
              <p className="text-slate-300 text-sm">Reserva tu primera cita desde el panel principal.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { Badge } from '@/components/ui/badge';
export default Appointments;