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
import { ArrowLeft, Leaf, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const AdmissionForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    reason: '',
    previousTherapy: false,
    medication: '',
    isMinor: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      showError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    setLoading(true);

    try {
      // 1. Registrar al usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      // 2. Insertar los datos de admisión vinculados al nuevo ID de usuario
      const { error: admissionError } = await supabase.from('admissions').insert({
        patient_id: authData.user.id,
        full_name: formData.fullName,
        email: formData.email,
        reason_for_consultation: formData.reason,
        previous_therapy: formData.previousTherapy,
        medication: formData.medication,
        is_minor: formData.isMinor,
        status: 'PENDING_APPROVAL'
      });

      if (admissionError) throw admissionError;

      showSuccess("¡Cuenta creada y solicitud enviada! Revisa tu email para confirmar tu cuenta.");
      navigate('/login');
    } catch (error: any) {
      showError("Error: " + error.message);
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
            <CardTitle className="text-3xl font-serif text-[#4a3f35]">Comienza tu proceso</CardTitle>
            <CardDescription className="text-[#7a6f64] mt-2">Crea tu cuenta y cuéntanos un poco sobre ti.</CardDescription>
          </CardHeader>
          <CardContent className="pt-10 px-8 md:px-12 pb-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="space-y-6">
                <h3 className="text-lg font-serif text-[#c17d60] border-b border-[#fdfaf6] pb-2">Datos de Acceso</h3>
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
                  <Label htmlFor="pass" className="text-[#4a3f35] font-medium">Contraseña para tu cuenta</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a6f64]" />
                    <Input 
                      id="pass"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      className="pl-12 pr-12 h-12 bg-[#fdfaf6] border-[#e8e1d5] rounded-2xl focus:ring-[#c17d60]"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a6f64] hover:text-[#c17d60]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-serif text-[#c17d60] border-b border-[#fdfaf6] pb-2">Información Clínica</h3>
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
                  </div>
                  <Switch 
                    checked={formData.isMinor}
                    onCheckedChange={(checked) => setFormData({...formData, isMinor: checked})}
                    className="data-[state=checked]:bg-[#c17d60]"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#c17d60] hover:bg-[#a66a51] h-14 text-lg rounded-full shadow-lg shadow-[#c17d60]/20" disabled={loading}>
                {loading ? "Creando cuenta..." : "Crear cuenta y enviar solicitud"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdmissionForm;