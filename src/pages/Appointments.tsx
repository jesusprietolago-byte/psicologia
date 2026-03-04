"use client";

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video, Clock, ArrowLeft, Leaf } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { translateStatus } from '@/utils/translations';

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
      .order('start_time', { ascending: false }); // Ordenado de más nuevas a más antiguas

    if (error) console.error(error);
    else setAppointments(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')} 
          className="mb-8 text-[#7a6f64] hover:text-[#c17d60] hover:bg-white/50 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al panel
        </Button>

        <div className="flex items-center space-x-4 mb-10">
          <div className="w-12 h-12 bg-[#c17d60]/10 rounded-2xl flex items-center justify-center">
            <Calendar className="text-[#c17d60] w-6 h-6" />
          </div>
          <h1 className="text-4xl font-serif text-[#4a3f35]">Mis Citas</h1>
        </div>
        
        <div className="space-y-6">
          {appointments.map((apt) => (
            <Card key={apt.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all">
              <CardHeader className="pb-2 pt-8 px-8">
                <CardTitle className="flex items-center justify-between text-2xl font-serif text-[#4a3f35]">
                  <span>Sesión de Terapia</span>
                  <Badge className={apt.status === 'SCHEDULED' ? "bg-[#b5b891] text-white" : "bg-[#e8e1d5] text-[#7a6f64]"}>
                    {translateStatus(apt.status)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center text-xl text-[#4a3f35] font-medium">
                      <Calendar className="w-5 h-5 mr-4 text-[#c17d60]" />
                      {format(new Date(apt.start_time), 'PPP', { locale: es })}
                    </div>
                    <div className="flex items-center text-[#7a6f64] text-lg">
                      <Clock className="w-5 h-5 mr-4 opacity-50" />
                      {format(new Date(apt.start_time), 'HH:mm')} — {format(new Date(apt.end_time), 'HH:mm')}
                    </div>
                  </div>
                  
                  {apt.status === 'SCHEDULED' && apt.video_room_url && (
                    <Button asChild className="bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-10 h-14 text-lg shadow-lg shadow-[#c17d60]/20">
                      <Link to={`/session/${apt.id}`}>
                        <Video className="w-5 h-5 mr-3" /> Entrar a Sesión
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {!loading && appointments.length === 0 && (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-[#e8e1d5]">
              <Leaf className="w-16 h-16 mx-auto mb-6 text-[#e8e1d5]" />
              <h3 className="text-2xl font-serif text-[#7a6f64]">No tienes citas programadas</h3>
              <p className="text-[#7a6f64] mt-2">Reserva tu primera cita desde el panel principal.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Appointments;