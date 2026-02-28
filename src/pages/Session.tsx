"use client";

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import VideoRoom from '@/components/VideoRoom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Session = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      if (!appointmentId || !user) return;

      const { data, error } = await supabase
        .from('appointments')
        .select('video_room_url, patient_id')
        .eq('id', appointmentId)
        .single();

      if (error || !data?.video_room_url) {
        console.error("Error cargando la sesión:", error);
        navigate(role === 'admin' ? '/admin' : '/dashboard');
        return;
      }

      // Verificar que el usuario tiene permiso (es el paciente o el admin)
      if (role !== 'admin' && data.patient_id !== user.id) {
        navigate('/dashboard');
        return;
      }

      setRoomUrl(data.video_room_url);
      setLoading(false);
    };

    fetchSession();
  }, [appointmentId, user, role, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Preparando sala segura...</div>;

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