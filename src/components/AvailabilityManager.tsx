"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { CalendarDays, Plus, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = [
  { id: 1, name: "Lunes" },
  { id: 2, name: "Martes" },
  { id: 3, name: "Miércoles" },
  { id: 4, name: "Jueves" },
  { id: 5, name: "Viernes" },
  { id: 6, name: "Sábado" },
  { id: 0, name: "Domingo" }
];

const AvailabilityManager = () => {
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);
  const [newSlot, setNewSlot] = useState({ start: '09:00', end: '14:00' });

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) showError(error.message);
    else setAvailability(data || []);
    setLoading(false);
  };

  const addSlot = async () => {
    const { error } = await supabase.from('availability').insert({
      day_of_week: selectedDay,
      start_time: newSlot.start,
      end_time: newSlot.end
    });

    if (error) showError(error.message);
    else {
      showSuccess("Horario añadido a la agenda");
      fetchAvailability();
    }
  };

  const deleteSlot = async (id: string) => {
    const { error } = await supabase.from('availability').delete().eq('id', id);
    if (error) showError(error.message);
    else {
      showSuccess("Horario eliminado");
      fetchAvailability();
    }
  };

  return (
    <Card className="border-none shadow-sm bg-white sticky top-24">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg font-semibold text-slate-800">
          <CalendarDays className="w-5 h-5 mr-2 text-sky-500" /> Agenda Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selector de Día */}
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full transition-all",
                selectedDay === day.id 
                  ? "bg-sky-600 text-white shadow-sm" 
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {day.name.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Añadir Nuevo Tramo */}
        <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-sky-700 font-bold">Inicio</Label>
              <Input 
                type="time" 
                value={newSlot.start} 
                onChange={(e) => setNewSlot({...newSlot, start: e.target.value})}
                className="h-9 bg-white border-sky-200 focus:ring-sky-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase text-sky-700 font-bold">Fin</Label>
              <Input 
                type="time" 
                value={newSlot.end} 
                onChange={(e) => setNewSlot({...newSlot, end: e.target.value})}
                className="h-9 bg-white border-sky-200 focus:ring-sky-500"
              />
            </div>
          </div>
          <Button onClick={addSlot} className="w-full bg-sky-600 hover:bg-sky-700 h-9 text-sm">
            <Plus className="w-4 h-4 mr-2" /> Añadir Tramo
          </Button>
        </div>

        {/* Listado de Agenda */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {DAYS.map((day) => {
            const daySlots = availability.filter(s => s.day_of_week === day.id);
            if (daySlots.length === 0) return null;

            return (
              <div key={day.id} className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <span className="w-1.5 h-1.5 bg-sky-400 rounded-full mr-2" />
                  {day.name}
                </h4>
                <div className="space-y-1.5">
                  {daySlots.map((slot) => (
                    <div key={slot.id} className="group flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg hover:border-sky-200 transition-all">
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
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {availability.length === 0 && !loading && (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 mx-auto mb-2 text-slate-100" />
              <p className="text-xs text-slate-400">No hay horarios configurados</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityManager;