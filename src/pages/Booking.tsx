"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay, addDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

const Booking = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [admissionStatus, setAdmissionStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user) checkAdmission();
  }, [user]);

  useEffect(() => {
    if (selectedDate && admissionStatus === 'APPROVED') fetchAvailableSlots(selectedDate);
  }, [selectedDate, admissionStatus]);

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
    if (data?.status !== 'APPROVED') {
      navigate('/dashboard');
    }
  };

  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // 1. Obtener disponibilidad configurada para esa fecha específica
      const { data: availability, error: availError } = await supabase
        .from('availability')
        .select('*')
        .eq('date', dateStr)
        .eq('is_active', true);

      if (availError) throw availError;

      // 2. Obtener citas ya reservadas para esa fecha
      const startOfDayDate = startOfDay(date);
      const endOfDayDate = addDays(startOfDayDate, 1);
      const { data: appointments, error: appError } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .gte('start_time', startOfDayDate.toISOString())
        .lt('start_time', endOfDayDate.toISOString())
        .neq('status', 'CANCELLED');

      if (appError) throw appError;

      // 3. Generar slots disponibles
      const slots: any[] = [];
      availability?.forEach(avail => {
        const slotStart = new Date(date);
        const [h, m] = avail.start_time.split(':').map(Number);
        slotStart.setHours(h, m, 0, 0);

        const slotEnd = new Date(date);
        const [eh, em] = avail.end_time.split(':').map(Number);
        slotEnd.setHours(eh, em, 0, 0);

        // Verificar si el slot está ocupado
        const isBooked = appointments?.some(app => {
          const appStart = new Date(app.start_time);
          return appStart.getTime() === slotStart.getTime();
        });

        if (!isBooked) {
          slots.push({
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
        .select()
        .single();

      if (appError) throw appError;

      // Crear sala de Daily.co (Simulado o vía Edge Function)
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

      showSuccess('Cita reservada correctamente.');
      navigate('/dashboard');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
        
        <h1 className="text-3xl font-light text-slate-800 mb-8">Reservar Sesión</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center">
                <CalendarDays className="w-5 h-5 mr-2 text-sky-500" /> 1. Selecciona el día
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                locale={es}
                className="rounded-xl border border-slate-100"
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-medium flex items-center">
                <Clock className="w-5 h-5 mr-2 text-sky-500" /> 2. Horarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-slate-400">Buscando huecos...</div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {availableSlots.map((slot, idx) => (
                    <Button
                      key={idx}
                      variant={selectedSlot?.start === slot.start ? "default" : "outline"}
                      className={cn(
                        "h-12 justify-start px-4 rounded-xl transition-all",
                        selectedSlot?.start === slot.start ? "bg-sky-600 hover:bg-sky-700 shadow-md" : "border-slate-100 hover:border-sky-200"
                      )}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <Clock className="w-4 h-4 mr-3 opacity-50" />
                      {slot.start} - {slot.end}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-50 rounded-2xl">
                  <p className="text-sm text-slate-400">No hay disponibilidad para este día.</p>
                </div>
              )}

              {selectedSlot && (
                <Button 
                  onClick={handleBooking} 
                  className="w-full mt-6 bg-sky-600 hover:bg-sky-700 h-12 rounded-xl shadow-lg shadow-sky-100"
                  disabled={loading}
                >
                  Confirmar Reserva
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Booking;