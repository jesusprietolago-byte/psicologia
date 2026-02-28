"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { showSuccess, showError } from '@/utils/toast';
import { ArrowLeft, Leaf, User, Mail } from 'lucide-react';

const AdmissionForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    reason: '',
    previousTherapy: false,
    medication: '',
    isMinor: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('admissions').insert({
        full_name: formData.fullName,
        email: formData.email,
        reason_for_consultation: formData.reason,
        previous_therapy: formData.previousTherapy,
        medication: formData.medication,
        is_minor: formData.isMinor,
        status: 'PENDING_APPROVAL'
      });

      if (error) throw error;

      showSuccess("Solicitud enviada con éxito. Revisaremos tu caso y te contactaremos por email.");
      navigate('/');
    } catch (error: any) {
      showError("Error al enviar el formulario: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')} 
          className="mb-6 text-[#7a6f64] hover:text-[#c17d60] hover:bg-white/50 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
        </Button>

        <Card className="border-none shadow-2xl shadow-[#c17d60]/5 bg-white rounded-[3rem] overflow-hidden">
          <CardHeader className="text-center border-b border-[#fdfaf6] pb-10 pt-12">
            <div className="w-16 h-16 bg-[#c17d60]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Leaf className="text-[#c17d60] w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-serif text-[#4a3f35]">Solicitud de Admisión</CardTitle>
            <CardDescription className="text-[#7a6f64] mt-2">Cuéntanos un poco sobre ti para poder acompañarte mejor.</CardDescription>
          </CardHeader>
          <CardContent className="pt-10 px-8 md:px-12 pb-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="fullName" className="text-[#4a3f35] font-medium">Nombre y Apellidos</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a6f64]" />
                    <Input 
                      id="fullName"
                      placeholder="Tu nombre completo"
                      className="pl-12 h-12 bg-[#fdfaf6] border-[#e8e1d5] rounded-2xl focus:ring-[#c17d60]"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-[#4a3f35] font-medium">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a6f64]" />
                    <Input 
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-12 h-12 bg-[#fdfaf6] border-[#e8e1d5] rounded-2xl focus:ring-[#c17d60]"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="reason" className="text-[#4a3f35] font-medium">¿Cuál es el motivo principal de tu consulta?</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Describe brevemente qué te trae por aquí..."
                  className="min-h-[120px] resize-none bg-[#fdfaf6] border-[#e8e1d5] rounded-2xl focus:ring-[#c17d60]"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-between p-6 bg-[#fdfaf6] rounded-[2rem] border border-[#e8e1d5]">
                <div className="space-y-1">
                  <Label className="text-[#4a3f35] font-medium">¿Has realizado terapia anteriormente?</Label>
                  <p className="text-sm text-[#7a6f64]">Ayuda a entender tu experiencia previa.</p>
                </div>
                <Switch 
                  checked={formData.previousTherapy}
                  onCheckedChange={(checked) => setFormData({...formData, previousTherapy: checked})}
                  className="data-[state=checked]:bg-[#c17d60]"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="medication" className="text-[#4a3f35] font-medium">¿Tomas alguna medicación actualmente?</Label>
                <Textarea 
                  id="medication" 
                  placeholder="Indica el nombre y dosis si es relevante..."
                  className="min-h-[80px] resize-none bg-[#fdfaf6] border-[#e8e1d5] rounded-2xl focus:ring-[#c17d60]"
                  value={formData.medication}
                  onChange={(e) => setFormData({...formData, medication: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-between p-6 bg-[#fdfaf6] rounded-[2rem] border border-[#e8e1d5]">
                <div className="space-y-1">
                  <Label className="text-[#4a3f35] font-medium">¿Eres menor de edad?</Label>
                  <p className="text-sm text-[#7a6f64]">Los menores requieren consentimiento legal.</p>
                </div>
                <Switch 
                  checked={formData.isMinor}
                  onCheckedChange={(checked) => setFormData({...formData, isMinor: checked})}
                  className="data-[state=checked]:bg-[#c17d60]"
                />
              </div>

              <Button type="submit" className="w-full bg-[#c17d60] hover:bg-[#a66a51] h-14 text-lg rounded-full shadow-lg shadow-[#c17d60]/20" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Solicitud de Admisión"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdmissionForm;