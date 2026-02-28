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
    const { data, error } = await supabase
      .from('admissions')
      .select('status')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    setAdmissionStatus(data?.status || 'NOT_STARTED');
    if (data?.status !== 'APPROVED') {
      navigate('/dashboard');
    }
  };

  const generateSlots = (date: Date, availability: any[], appointments: any[]) => {
    const slots = [];
    availability.forEach(avail => {
      const start = new Date(date);
      const [startHour, startMin] = avail.start_time.split(':').map(Number);
      start.setHours(startHour, startMin, 0, 0);

      const end = new Date(date);
      const [endHour, endMin] = avail.end_time.split(':').map(Number);
      end.setHours(endHour, endMin, 0, 0);

      let current = new Date(start);
      while (current < end) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + 60 * 60 * 1000); // 1 hora

        if (slotEnd <= end) {
          const isBooked = appointments.some(app => {
            const appStart = new Date(app.start_time);
            const appEnd = new Date(app.end_time);
            return (slotStart >= appStart && slotStart < appEnd) || (slotEnd > appStart && slotEnd <= appEnd) || (slotStart <= appStart && slotEnd >= appEnd);
          });

          if (!isBooked) {
            slots.push({
              start: format(slotStart, 'HH:mm'),
              end: format(slotEnd, 'HH:mm'),
              startDate: slotStart,
              endDate: slotEnd
            });
          }
          current = slotEnd;
        } else {
          break;
        }
      }
    });
    return slots;
  };

  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true);
    try {
      const dayOfWeek = date.getDay();
      const { data: availability, error: availError } = await supabase
        .from('availability')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (availError) throw availError;

      const startOfDayDate = startOfDay(date);
      const endOfDayDate = addDays(startOfDayDate, 1);
      const { data: appointments, error: appError } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .gte('start_time', startOfDayDate.toISOString())
        .lt('start_time', endOfDayDate.toISOString());

      if (appError) throw appError;

      const slots = generateSlots(date, availability || [], appointments || []);
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
          status: 'SCHEDULED',
          payment_status: 'PENDING'
        })
        .select()
        .single();

      if (appError) throw appError;

      // Invocar la Edge Function para crear la sala de Daily.co
      const functionUrl = `https://remnvakjvujygcdwnsgn.supabase.co/functions/v1/create-daily-room`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ appointmentId: appointment.id })
      });

      if (!response.ok) {
        throw new Error('Error al crear la sala de videollamada');
      }

      const { url } = await response.json();

      await supabase
        .from('appointments')
        .update({ video_room_url: url })
        .eq('id', appointment.id);

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
        
        <h1 className="text-2xl font-light text-slate-800 mb-6">Reservar una Cita</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CalendarDays className="w-5 h-5 mr-2 text-sky-500" /> Selecciona una fecha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                locale={es}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Clock className="w-5 h-5 mr-2 text-sky-500" /> Horarios disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-slate-500">Cargando horarios...</div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No hay horarios disponibles para esta fecha</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
                  {availableSlots.map((slot, index) => (
                    <Button
                      key={index}
                      variant={selectedSlot?.start === slot.start ? "default" : "outline"}
                      className={selectedSlot?.start === slot.start ? "bg-sky-600 hover:bg-sky-700" : ""}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      {slot.start} - {slot.end}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedSlot && (
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleBooking} 
              disabled={loading}
              className="bg-sky-600 hover:bg-sky-700"
            >
              {loading ? 'Reservando...' : 'Confirmar Reserva'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;