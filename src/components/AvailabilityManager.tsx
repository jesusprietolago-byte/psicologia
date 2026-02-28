"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { showSuccess, showError } from '@/utils/toast';
import { Plus, Trash2, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AvailabilityManager = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSlot, setNewSlot] = useState({ start: '09:00', end: '10:00' });

  useEffect(() => {
    if (selectedDate) {
      fetchSlotsForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchSlotsForDate = async (date: Date) => {
    setLoading(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('date', dateStr)
      .order('start_time', { ascending: true });
    
    if (error) showError(error.message);
    else setSlots(data || []);
    setLoading(false);
  };

  const addSlot = async () => {
    if (!selectedDate) return;
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { error } = await supabase.from('availability').insert({
      date: dateStr,
      start_time: newSlot.start,
      end_time: newSlot.end,
      is_active: true
    });

    if (error) showError(error.message);
    else {
      showSuccess("Horario añadido correctamente");
      fetchSlotsForDate(selectedDate);
    }
  };

  const deleteSlot = async (id: string) => {
    const { error } = await supabase.from('availability').delete().eq('id', id);
    if (error) showError(error.message);
    else {
      showSuccess("Horario eliminado");
      if (selectedDate) fetchSlotsForDate(selectedDate);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[3rem] overflow-hidden">
        <CardHeader className="p-10 border-b border-[#fdfaf6]">
          <CardTitle className="flex items-center text-2xl font-serif text-[#4a3f35]">
            <CalendarIcon className="w-6 h-6 mr-3 text-[#c17d60]" /> Gestión de Disponibilidad
          </CardTitle>
        </CardHeader>
        <CardContent className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <Label className="text-lg font-serif text-[#4a3f35]">1. Selecciona el día</Label>
            <div className="border border-[#e8e1d5] rounded-[2rem] p-6 bg-[#fdfaf6]/50">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                className="rounded-md"
              />
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-6">
              <Label className="text-lg font-serif text-[#4a3f35]">
                2. Horarios para el {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : '...'}
              </Label>
              
              <div className="p-8 bg-[#fdfaf6] rounded-[2.5rem] border border-[#e8e1d5] space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest">Inicio</Label>
                    <Input 
                      type="time" 
                      value={newSlot.start} 
                      onChange={(e) => setNewSlot({...newSlot, start: e.target.value})}
                      className="h-12 bg-white border-[#e8e1d5] rounded-xl focus:ring-[#c17d60]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest">Fin</Label>
                    <Input 
                      type="time" 
                      value={newSlot.end} 
                      onChange={(e) => setNewSlot({...newSlot, end: e.target.value})}
                      className="h-12 bg-white border-[#e8e1d5] rounded-xl focus:ring-[#c17d60]"
                    />
                  </div>
                </div>
                <Button onClick={addSlot} className="w-full bg-[#c17d60] hover:bg-[#a66a51] h-12 rounded-full text-white shadow-lg shadow-[#c17d60]/20">
                  <Plus className="w-4 h-4 mr-2" /> Añadir Tramo
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {loading ? (
                <p className="text-center text-[#7a6f64] py-8 animate-pulse">Cargando horarios...</p>
              ) : slots.length > 0 ? (
                slots.map((slot) => (
                  <div key={slot.id} className="group flex items-center justify-between p-5 bg-white border border-[#e8e1d5] rounded-2xl hover:border-[#c17d60]/30 transition-all shadow-sm">
                    <div className="flex items-center text-lg text-[#4a3f35]">
                      <Clock className="w-4 h-4 mr-3 text-[#b5b891]" />
                      <span className="font-medium">{slot.start_time.slice(0, 5)}</span>
                      <span className="mx-3 text-[#e8e1d5]">—</span>
                      <span className="font-medium">{slot.end_time.slice(0, 5)}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteSlot(slot.id)} 
                      className="h-10 w-10 p-0 text-[#7a6f64] hover:text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-[#e8e1d5] rounded-[2rem] bg-[#fdfaf6]/30">
                  <Clock className="w-10 h-10 mx-auto mb-4 text-[#e8e1d5]" />
                  <p className="text-[#7a6f64]">No hay disponibilidad para este día</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvailabilityManager;