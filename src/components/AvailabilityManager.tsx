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
    <div className="space-y-6">
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg font-semibold text-slate-800">
            <CalendarIcon className="w-5 h-5 mr-2 text-sky-500" /> Gestión de Disponibilidad
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label className="text-sm font-medium text-slate-600">1. Selecciona el día</Label>
            <div className="border rounded-xl p-2 bg-slate-50/50">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                className="rounded-md"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-sm font-medium text-slate-600">
                2. Horarios para el {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: es }) : '...'}
              </Label>
              
              <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-sky-700 font-bold">Inicio</Label>
                    <Input 
                      type="time" 
                      value={newSlot.start} 
                      onChange={(e) => setNewSlot({...newSlot, start: e.target.value})}
                      className="h-9 bg-white border-sky-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase text-sky-700 font-bold">Fin</Label>
                    <Input 
                      type="time" 
                      value={newSlot.end} 
                      onChange={(e) => setNewSlot({...newSlot, end: e.target.value})}
                      className="h-9 bg-white border-sky-200"
                    />
                  </div>
                </div>
                <Button onClick={addSlot} className="w-full bg-sky-600 hover:bg-sky-700 h-9 text-sm">
                  <Plus className="w-4 h-4 mr-2" /> Añadir Tramo
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {loading ? (
                <p className="text-center text-slate-400 text-sm py-4">Cargando...</p>
              ) : slots.length > 0 ? (
                slots.map((slot) => (
                  <div key={slot.id} className="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-sky-200 transition-all">
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" />
                      <span className="font-medium">{slot.start_time.slice(0, 5)}</span>
                      <span className="mx-2 text-slate-300">-</span>
                      <span className="font-medium">{slot.end_time.slice(0, 5)}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteSlot(slot.id)} 
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-xs text-slate-400">No hay disponibilidad para este día</p>
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