"use client";

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import VideoRoom from '@/components/VideoRoom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isAfter } from 'date-fns';

const Session = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!appointmentId || !user) return;

      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select('video_room_url, patient_id, end_time, status')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !data) {
        console.error("Error cargando la sesión:", fetchError);
        navigate(role === 'admin' ? '/admin' : '/dashboard');
        return;
      }

      // 1. Verificar permisos
      if (role !== 'admin' && data.patient_id !== user.id) {
        navigate('/dashboard');
        return;
      }

      // 2. Verificar si la sesión ha terminado
      const now = new Date();
      const endTime = new Date(data.end_time);
      
      if (isAfter(now, endTime)) {
        setError("Esta sesión ya ha finalizado. No es posible acceder a la sala.");
        setLoading(false);
        return;
      }

      // 3. Verificar si hay URL de sala
      if (!data.video_room_url) {
        setError("La sala de video aún no está preparada. Por favor, espera un momento.");
        setLoading(false);
        return;
      }

      setRoomUrl(data.video_room_url);
      setLoading(false);
    };

    fetchSession();
  }, [appointmentId, user, role, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-slate-400 animate-pulse font-serif text-xl">Preparando sala segura...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md w-full bg-slate-900 p-10 rounded-[3rem] border border-slate-800 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <Clock className="text-red-500 w-10 h-10" />
        </div>
        <h2 className="text-2xl font-serif text-white">Sesión Finalizada</h2>
        <p className="text-slate-400 leading-relaxed">{error}</p>
        <Button 
          onClick={() => navigate(role === 'admin' ? '/admin' : '/dashboard')}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-full h-12"
        >
          Volver al panel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Salir de la sala
          </Button>
          <div className="flex items-center text-emerald-500 text-sm font-medium bg-emerald-500/10 px-3 py-1 rounded-full">
            <ShieldCheck className="w-4 h-4 mr-2" /> Conexión Encriptada de Extremo a Extremo
          </div>
        </div>

        {roomUrl && <VideoRoom url={roomUrl} />}
      </div>
    </div>
  );
};

export default Session;