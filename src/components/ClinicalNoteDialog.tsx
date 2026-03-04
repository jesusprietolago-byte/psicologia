"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Save, Loader2, AlertCircle } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClinicalNoteDialogProps {
  appointmentId: string;
  patientId: string;
  appointmentDate: string;
  onSuccess?: () => void;
}

const ClinicalNoteDialog = ({ appointmentId, patientId, appointmentDate, onSuccess }: ClinicalNoteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchNote();
    }
  }, [open]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clinical_notes')
        .select('content')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (error) throw error;
      setContent(data?.content || '');
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clinical_notes')
        .upsert({
          appointment_id: appointmentId,
          patient_id: patientId,
          content: content,
          updated_at: new Date().toISOString()
        }, { onConflict: 'appointment_id' });

      if (error) throw error;
      showSuccess("Nota guardada");
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-[#c17d60] hover:text-[#a66a51] hover:bg-[#c17d60]/10 rounded-full">
          <FileText className="w-4 h-4 mr-2" /> Notas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-[#c17d60] p-8 text-white">
          <DialogTitle className="text-2xl font-serif">Notas de la Sesión</DialogTitle>
          <p className="text-white/80 font-sans">
            {format(new Date(appointmentDate), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
          </p>
        </DialogHeader>
        <div className="p-8 space-y-6">
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">Estas notas son privadas. El paciente no tiene acceso a ellas.</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#c17d60]" />
            </div>
          ) : (
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe aquí la evolución de la sesión, observaciones, tareas..."
              className="min-h-[300px] bg-[#fdfaf6] border-[#e8e1d5] rounded-[2rem] p-6 focus:ring-[#c17d60] resize-none text-base"
            />
          )}
        </div>
        <DialogFooter className="p-8 pt-0">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-[#b5b891] hover:bg-[#a4a77d] text-white rounded-full h-12 text-lg shadow-lg shadow-[#b5b891]/20"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Guardar Notas</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClinicalNoteDialog;