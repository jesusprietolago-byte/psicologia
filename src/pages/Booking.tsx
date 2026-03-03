"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay, addDays, isBefore, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Clock, ArrowLeft, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

const Booking = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAdmission, setCheckingAdmission] = useState(true);
  const [admissionStatus, setAdmissionStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
      } else {
        checkAdmission();
      }
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (selectedDate && admissionStatus === 'APPROVED') {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, admissionStatus]);

  const checkAdmission = async () => {
    try {
      const { data } = await supabase
        .from('admissions')
        .select('status')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const status = data?.status || 'NOT_STARTED';
      setAdmissionStatus(status);
      if (status !== 'APPROVED') navigate('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingAdmission(false);
    }
  };

  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const now = new Date();
      
      const { data: availability } = await supabase
        .from('availability')
        .select('*')
        .eq('date', dateStr)
        .eq('is_active', true);

      const startOfDayDate = startOfDay(date);
      const endOfDayDate = addDays(startOfDayDate, 1);
      
      const { data: appointments } = await supabase
        .from('appointments')
        .select('start_time')
        .gte('start_time', startOfDayDate.toISOString())
        .lt('start_time', endOfDayDate.toISOString())
        .neq('status', 'CANCELLED');

      const slots: any[] = [];
      availability?.forEach(avail => {
        const slotStart = new Date(date);
        const [h, m] = avail.start_time.split(':').map(Number);
        slotStart.setHours(h, m, 0, 0);

        const slotEnd = new Date(date);
        const [eh, em] = avail.end_time.split(':').map(Number);
        slotEnd.setHours(eh, em, 0, 0);

        // 1. Verificar si el hueco ya ha pasado (si es hoy)
        if (isToday(date) && isBefore(slotStart, now)) {
          return;
        }

        // 2. Verificar si ya está reservado
        const isBooked = appointments?.some(app => 
          new Date(app.start_time).getTime() === slotStart.getTime()
        );

        if (!isBooked) {
          slots.push({
            id: avail.id,
            start: avail.start_time.slice(0, 5),
            end: avail.end_time.slice(0, 5),
            startDate: slotStart,
            endDate: slotEnd
          });
        }
      });

      setAvailableSlots(slots);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !user) return;
    setLoading(true);

    try {
      const { data: appointment, error: appError } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          start_time: selectedSlot.startDate.toISOString(),
          end_time: selectedSlot.endDate.toISOString(),
          status: 'SCHEDULED'
        })
        .select().single();

      if (appError) throw appError;

      // Crear sala de video
      try {
        const functionUrl = `https://remnvakjvujygcdwnsgn.supabase.co/functions/v1/create-daily-room`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });
        if (response.ok) {
          const { url } = await response.json();
          await supabase.from('appointments').update({ video_room_url: url }).eq('id', appointment.id);
        }
      } catch (e) { console.error(e); }

      showSuccess('¡Cita reservada!');
      navigate('/dashboard');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingAdmission) return <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6]"><Loader2 className="animate-spin text-[#c17d60]" /></div>;

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-8 text-[#7a6f64] hover:text-[#c17d60] rounded-full">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al panel
        </Button>
        <h1 className="text-4xl font-serif text-[#4a3f35] mb-10">Reservar Sesión</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <Card className="lg:col-span-2 border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="pt-8 px-8"><CardTitle className="text-xl font-serif text-[#4a3f35] flex items-center"><CalendarDays className="w-5 h-5 mr-3 text-[#c17d60]" /> 1. Selecciona el día</CardTitle></CardHeader>
            <CardContent className="p-8 flex justify-center">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => isBefore(date, startOfDay(new Date()))} locale={es} className="rounded-3xl border border-[#e8e1d5] p-4" />
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden">
            <CardHeader className="pt-8 px-8"><CardTitle className="text-xl font-serif text-[#4a3f35] flex items-center"><Clock className="w-5 h-5 mr-3 text-[#b5b891]" /> 2. Horarios disponibles</CardTitle></CardHeader>
            <CardContent className="p-8">
              {loading ? <div className="text-center py-12 animate-pulse">Buscando...</div> : availableSlots.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {availableSlots.map((slot, idx) => (
                    <Button key={idx} variant={selectedSlot?.id === slot.id ? "default" : "outline"} className={cn("h-14 justify-start px-6 rounded-2xl transition-all text-lg", selectedSlot?.id === slot.id ? "bg-[#c17d60] text-white" : "border-[#e8e1d5] text-[#4a3f35]")} onClick={() => setSelectedSlot(slot)}>
                      <Clock className="w-4 h-4 mr-4 opacity-50" /> {slot.start} - {slot.end}
                    </Button>
                  ))}
                </div>
              ) : <p className="text-center py-12 text-[#7a6f64]">No hay horarios disponibles para hoy.</p>}
              {selectedSlot && <Button onClick={handleBooking} className="w-full mt-6 bg-[#b5b891] hover:bg-[#a4a77d] text-white h-14 rounded-full text-lg" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-5 h-5 mr-2" /> Confirmar Reserva</>}</Button>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Booking;