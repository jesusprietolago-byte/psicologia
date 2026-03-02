"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay, isBefore, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarPlus, Clock, Loader2, Sparkles } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';

interface AdminBookingDialogProps {
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

const AdminBookingDialog = ({ patientId, patientName, onSuccess }: AdminBookingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [open, selectedDate]);

  const fetchAvailableSlots = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const now = new Date();
      
      // 1. Obtener disponibilidad configurada
      const { data: availability } = await supabase
        .from('availability')
        .select('*')
        .eq('date', dateStr)
        .eq('is_active', true);

      // 2. Obtener citas ya reservadas
      const { data: appointments } = await supabase
        .from('appointments')
        .select('start_time')
        .gte('start_time', startOfDay(date).toISOString())
        .lt('start_time', format(new Date(date.getTime() + 86400000), 'yyyy-MM-dd'))
        .neq('status', 'CANCELLED');

      const slots: any[] = [];
      availability?.forEach(avail => {
        const slotStart = new Date(date);
        const [h, m] = avail.start_time.split(':').map(Number);
        slotStart.setHours(h, m, 0, 0);

        // Filtrar si el hueco ya ha pasado hoy
        if (isToday(date) && isBefore(slotStart, now)) {
          return;
        }

        const isBooked = appointments?.some(app => 
          new Date(app.start_time).getTime() === slotStart.getTime()
        );

        if (!isBooked) {
          slots.push({
            id: avail.id,
            start: avail.start_time.slice(0, 5),
            end: avail.end_time.slice(0, 5),
            startDate: slotStart,
            endDate: new Date(slotStart.getTime() + 3600000) // 1 hora por defecto
          });
        }
      });

      setAvailableSlots(slots);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientId,
          start_time: selectedSlot.startDate.toISOString(),
          end_time: selectedSlot.endDate.toISOString(),
          status: 'PENDING_CONFIRMATION'
        });

      if (error) throw error;

      showSuccess(`Invitación enviada a ${patientName}`);
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full border-[#c17d60] text-[#c17d60] hover:bg-[#c17d60] hover:text-white">
          <CalendarPlus className="w-4 h-4 mr-2" /> Agendar Cita
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-[#c17d60] p-8 text-white">
          <DialogTitle className="text-2xl font-serif">Agendar para {patientName}</DialogTitle>
        </DialogHeader>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-sm font-medium text-[#7a6f64] uppercase tracking-widest">1. Selecciona el día</p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => isBefore(date, startOfDay(new Date()))}
              locale={es}
              className="rounded-2xl border border-[#e8e1d5] p-3"
            />
          </div>
          <div className="space-y-4">
            <p className="text-sm font-medium text-[#7a6f64] uppercase tracking-widest">2. Horarios disponibles</p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-[#c17d60]" /></div>
              ) : availableSlots.length > 0 ? (
                availableSlots.map((slot) => (
                  <Button
                    key={slot.id}
                    variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                    className={cn(
                      "w-full h-12 justify-start rounded-xl",
                      selectedSlot?.id === slot.id ? "bg-[#c17d60] text-white" : "border-[#e8e1d5] text-[#4a3f35]"
                    )}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <Clock className="w-4 h-4 mr-3 opacity-50" />
                    {slot.start} - {slot.end}
                  </Button>
                ))
              ) : (
                <p className="text-center py-12 text-[#7a6f64] italic">No hay disponibilidad para las horas restantes de hoy.</p>
              )}
            </div>
            {selectedSlot && (
              <Button onClick={handleBooking} disabled={loading} className="w-full bg-[#b5b891] hover:bg-[#a4a77d] text-white rounded-full h-12 mt-4">
                {loading ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" /> Enviar Invitación</>}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminBookingDialog;