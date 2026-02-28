"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { Clock, Plus, Trash2 } from 'lucide-react';

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const AvailabilityManager = () => {
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({ day: 1, start: '09:00', end: '14:00' });

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    const { data, error } = await supabase.from('availability').select('*').order('day_of_week', { ascending: true });
    if (error) showError(error.message);
    else setAvailability(data || []);
    setLoading(false);
  };

  const addSlot = async () => {
    const { error } = await supabase.from('availability').insert({
      day_of_week: newSlot.day,
      start_time: newSlot.start,
      end_time: newSlot.end
    });

    if (error) showError(error.message);
    else {
      showSuccess("Horario añadido");
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
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Clock className="w-5 h-5 mr-2 text-sky-500" /> Mi Disponibilidad Semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
          <div className="space-y-2">
            <Label>Día</Label>
            <select 
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={newSlot.day}
              onChange={(e) => setNewSlot({...newSlot, day: parseInt(e.target.value)})}
            >
              {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Inicio</Label>
            <Input type="time" value={newSlot.start} onChange={(e) => setNewSlot({...newSlot, start: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Fin</Label>
            <Input type="time" value={newSlot.end} onChange={(e) => setNewSlot({...newSlot, end: e.target.value})} />
          </div>
          <div className="flex items-end">
            <Button onClick={addSlot} className="w-full bg-sky-600 hover:bg-sky-700">
              <Plus className="w-4 h-4 mr-2" /> Añadir
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {availability.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-slate-700 w-24">{DAYS[slot.day_of_week]}</span>
                <span className="text-slate-500">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteSlot(slot.id)} className="text-slate-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {availability.length === 0 && !loading && <p className="text-center text-slate-400 py-4">No has definido horarios aún.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityManager;