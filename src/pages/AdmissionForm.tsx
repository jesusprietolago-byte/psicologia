"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { showSuccess, showError } from '@/utils/toast';
import { ClipboardCheck, ArrowLeft } from 'lucide-react';

const AdmissionForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    previousTherapy: false,
    medication: '',
    isMinor: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('admissions').insert({
        patient_id: user.id,
        reason_for_consultation: formData.reason,
        previous_therapy: formData.previousTherapy,
        medication: formData.medication,
        is_minor: formData.isMinor,
        status: 'PENDING_APPROVAL'
      });

      if (error) throw error;

      showSuccess("Formulario enviado correctamente. Revisaremos tu solicitud pronto.");
      navigate('/dashboard');
    } catch (error: any) {
      showError("Error al enviar el formulario: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>

        <Card className="border-none shadow-xl bg-white">
          <CardHeader className="text-center border-b border-slate-50 pb-8">
            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="text-sky-600" />
            </div>
            <CardTitle className="text-2xl font-light text-slate-800">Formulario de Admisión</CardTitle>
            <CardDescription>Cuéntanos un poco sobre ti para poder ayudarte mejor.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reason">¿Cuál es el motivo principal de tu consulta?</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Describe brevemente qué te trae por aquí..."
                  className="min-h-[120px] resize-none"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label>¿Has realizado terapia anteriormente?</Label>
                  <p className="text-sm text-slate-500">Ayuda a entender tu experiencia previa.</p>
                </div>
                <Switch 
                  checked={formData.previousTherapy}
                  onCheckedChange={(checked) => setFormData({...formData, previousTherapy: checked})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medication">¿Tomas alguna medicación actualmente?</Label>
                <Textarea 
                  id="medication" 
                  placeholder="Indica el nombre y dosis si es relevante..."
                  className="min-h-[80px] resize-none"
                  value={formData.medication}
                  onChange={(e) => setFormData({...formData, medication: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label>¿Eres menor de edad?</Label>
                  <p className="text-sm text-slate-500">Los menores requieren consentimiento legal.</p>
                </div>
                <Switch 
                  checked={formData.isMinor}
                  onCheckedChange={(checked) => setFormData({...formData, isMinor: checked})}
                />
              </div>

              <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 h-12 text-lg" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Solicitud"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdmissionForm;