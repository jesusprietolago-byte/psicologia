"use client";

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { 
  ArrowLeft, 
  Leaf, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  Heart, 
  Home, 
  Plus, 
  Trash2, 
  Phone,
  Stethoscope
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AttentionType = 'individual' | 'parejas' | 'familiar';

interface Adult {
  fullName: string;
  phone: string;
}

interface Child {
  fullName: string;
  age: string;
}

const BooleanButtons = ({ label, value, onChange }: { label: string, value: boolean, onChange: (v: boolean) => void }) => (
  <div className="space-y-3">
    <Label className="text-[#4a3f35] font-medium">{label}</Label>
    <div className="flex gap-4">
      <Button 
        type="button"
        variant={value ? "default" : "outline"}
        onClick={() => onChange(true)}
        className={cn(
          "flex-1 h-12 rounded-2xl transition-all",
          value ? "bg-[#c17d60] text-white border-none shadow-md" : "border-[#e8e1d5] text-[#7a6f64]"
        )}
      >
        Sí
      </Button>
      <Button 
        type="button"
        variant={!value ? "default" : "outline"}
        onClick={() => onChange(false)}
        className={cn(
          "flex-1 h-12 rounded-2xl transition-all",
          !value ? "bg-[#c17d60] text-white border-none shadow-md" : "border-[#e8e1d5] text-[#7a6f64]"
        )}
      >
        No
      </Button>
    </div>
  </div>
);

const AdmissionForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attentionType, setAttentionType] = useState<AttentionType | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    reason: '',
    previousTherapy: false,
    medication: '',
    isMinor: false,
    // Datos de pareja
    partnerName: '',
    partnerPhone: '',
    // Datos familiares (Adulto 1 son los campos de arriba)
    additionalAdults: [] as Adult[],
    children: [{ fullName: '', age: '' }] as Child[]
  });

  const addAdult = () => setFormData({ ...formData, additionalAdults: [...formData.additionalAdults, { fullName: '', phone: '' }] });
  const removeAdult = (index: number) => setFormData({ ...formData, additionalAdults: formData.additionalAdults.filter((_, i) => i !== index) });
  
  const addChild = () => setFormData({ ...formData, children: [...formData.children, { fullName: '', age: '' }] });
  const removeChild = (index: number) => setFormData({ ...formData, children: formData.children.filter((_, i) => i !== index) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attentionType) return;
    if (formData.password.length < 6) {
      showError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario.");

      const additionalData: any = { attention_type: attentionType };
      if (attentionType === 'parejas') {
        additionalData.partner = { fullName: formData.partnerName, phone: formData.partnerPhone };
      } else if (attentionType === 'familiar') {
        additionalData.family = { 
          adults: [{ fullName: formData.fullName, phone: formData.phone }, ...formData.additionalAdults],
          children: formData.children 
        };
      }

      const { error: admissionError } = await supabase.from('admissions').insert({
        patient_id: authData.user.id,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        reason_for_consultation: formData.reason,
        previous_therapy: formData.previousTherapy,
        medication: (attentionType === 'parejas' || attentionType === 'familiar') ? '' : formData.medication,
        is_minor: (attentionType === 'parejas' || attentionType === 'familiar') ? false : formData.isMinor,
        status: 'PENDING_APPROVAL',
        additional_data: additionalData
      });

      if (admissionError) throw admissionError;

      showSuccess("¡Solicitud enviada! Revisa tu email para confirmar tu cuenta.");
      navigate('/login');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfaf6] p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 text-[#7a6f64] hover:text-[#c17d60] rounded-full">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
        </Button>

        <Card className="border-none shadow-2xl shadow-[#c17d60]/5 bg-white rounded-[3rem] overflow-hidden">
          <CardHeader className="text-center border-b border-[#fdfaf6] pb-10 pt-12">
            <div className="w-16 h-16 bg-[#c17d60]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Leaf className="text-[#c17d60] w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-serif text-[#4a3f35]">Solicitud de Admisión</CardTitle>
            <CardDescription className="text-[#7a6f64] mt-2">Cuéntanos qué necesitas para ofrecerte la mejor atención.</CardDescription>
          </CardHeader>

          <CardContent className="pt-10 px-8 md:px-12 pb-12">
            {!attentionType ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-xl font-serif text-[#4a3f35] text-center">¿Qué tipo de atención estás buscando?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { id: 'individual', label: 'Individual', icon: <User className="w-6 h-6" />, desc: 'Para ti' },
                    { id: 'parejas', label: 'Parejas', icon: <Heart className="w-6 h-6" />, desc: 'Para los dos' },
                    { id: 'familiar', label: 'Familiar', icon: <Home className="w-6 h-6" />, desc: 'Para el hogar' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAttentionType(opt.id as AttentionType)}
                      className="flex flex-col items-center p-8 bg-[#fdfaf6] border-2 border-transparent hover:border-[#c17d60] rounded-[2.5rem] transition-all group"
                    >
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#c17d60] mb-4 shadow-sm group-hover:scale-110 transition-transform">
                        {opt.icon}
                      </div>
                      <span className="font-serif text-lg text-[#4a3f35]">{opt.label}</span>
                      <span className="text-xs text-[#7a6f64] mt-1">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between bg-[#fdfaf6] p-4 rounded-2xl border border-[#e8e1d5]">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg text-[#c17d60]">
                      {attentionType === 'individual' ? <User className="w-4 h-4" /> : attentionType === 'parejas' ? <Heart className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                    </div>
                    <span className="font-medium text-[#4a3f35]">Atención {attentionType.charAt(0).toUpperCase() + attentionType.slice(1)}</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAttentionType(null)} className="text-[#c17d60] hover:bg-white">Cambiar</Button>
                </div>

                <div className="space-y-6">
                  <h3 className="text-lg font-serif text-[#c17d60] border-b border-[#fdfaf6] pb-2">
                    {attentionType === 'familiar' ? "Datos del Adulto 1 (Contacto Principal)" : "Datos de Contacto"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Nombre y Apellidos</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a6f64]" />
                        <Input required className="pl-12 h-12 rounded-2xl" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono de contacto</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a6f64]" />
                        <Input required type="tel" className="pl-12 h-12 rounded-2xl" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a6f64]" />
                        <Input required type="email" className="pl-12 h-12 rounded-2xl" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Contraseña para tu panel</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a6f64]" />
                        <Input required type={showPassword ? "text" : "password"} className="pl-12 pr-12 h-12 rounded-2xl" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a6f64]">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                      </div>
                    </div>
                  </div>
                </div>

                {attentionType === 'parejas' && (
                  <div className="space-y-6 p-8 bg-[#fdfaf6] rounded-[2.5rem] border border-[#e8e1d5]">
                    <h3 className="text-lg font-serif text-[#c17d60] flex items-center"><Heart className="w-5 h-5 mr-2" /> Datos de la Pareja</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Nombre y Apellidos</Label>
                        <Input required className="h-12 rounded-2xl bg-white" value={formData.partnerName} onChange={(e) => setFormData({...formData, partnerName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Teléfono de contacto</Label>
                        <Input required type="tel" className="h-12 rounded-2xl bg-white" value={formData.partnerPhone} onChange={(e) => setFormData({...formData, partnerPhone: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}

                {attentionType === 'familiar' && (
                  <div className="space-y-10">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-serif text-[#c17d60]">Otros Adultos</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addAdult} className="rounded-full border-[#c17d60] text-[#c17d60]"><Plus className="w-4 h-4 mr-2" /> Añadir Adulto</Button>
                      </div>
                      {formData.additionalAdults.map((adult, idx) => (
                        <div key={idx} className="p-6 bg-[#fdfaf6] rounded-[2rem] border border-[#e8e1d5] relative">
                          <button type="button" onClick={() => removeAdult(idx)} className="absolute top-4 right-4 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          <p className="text-xs font-bold text-[#c17d60] uppercase tracking-widest mb-4">Adulto {idx + 2}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input placeholder="Nombre y Apellidos" className="h-11 rounded-xl bg-white" value={adult.fullName} onChange={(e) => {
                              const newAdults = [...formData.additionalAdults];
                              newAdults[idx].fullName = e.target.value;
                              setFormData({...formData, additionalAdults: newAdults});
                            }} />
                            <Input placeholder="Teléfono" className="h-11 rounded-xl bg-white" value={adult.phone} onChange={(e) => {
                              const newAdults = [...formData.additionalAdults];
                              newAdults[idx].phone = e.target.value;
                              setFormData({...formData, additionalAdults: newAdults});
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-serif text-[#c17d60]">Hijos</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addChild} className="rounded-full border-[#c17d60] text-[#c17d60]"><Plus className="w-4 h-4 mr-2" /> Añadir Hijo</Button>
                      </div>
                      {formData.children.map((child, idx) => (
                        <div key={idx} className="p-6 bg-[#fdfaf6] rounded-[2rem] border border-[#e8e1d5] relative space-y-4">
                          {idx > 0 && <button type="button" onClick={() => removeChild(idx)} className="absolute top-4 right-4 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                          <p className="text-xs font-bold text-[#c17d60] uppercase tracking-widest">Hijo {idx + 1}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <Input placeholder="Nombre y Apellidos" className="h-11 rounded-xl bg-white" value={child.fullName} onChange={(e) => {
                                const newChildren = [...formData.children];
                                newChildren[idx].fullName = e.target.value;
                                setFormData({...formData, children: newChildren});
                              }} />
                            </div>
                            <Input placeholder="Edad" type="number" className="h-11 rounded-xl bg-white" value={child.age} onChange={(e) => {
                              const newChildren = [...formData.children];
                              newChildren[idx].age = e.target.value;
                              setFormData({...formData, children: newChildren});
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-8">
                  <h3 className="text-lg font-serif text-[#c17d60] border-b border-[#fdfaf6] pb-2">Información Clínica</h3>
                  <div className="space-y-3">
                    <Label className="text-[#4a3f35] font-medium">
                      {attentionType === 'individual' ? "¿Cuál es el motivo principal de tu consulta?" : "¿Cuál es el motivo principal de vuestra consulta?"}
                    </Label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-4 w-4 h-4 text-[#7a6f64]" />
                      <Textarea required className="pl-12 min-h-[120px] rounded-2xl bg-[#fdfaf6] border-[#e8e1d5] resize-none" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
                    </div>
                  </div>

                  <BooleanButtons 
                    label={attentionType === 'parejas' ? "¿Habéis realizado terapia de pareja anteriormente?" : attentionType === 'familiar' ? "¿Habéis realizado terapia familiar anteriormente?" : "¿Has realizado terapia anteriormente?"} 
                    value={formData.previousTherapy} 
                    onChange={(v) => setFormData({...formData, previousTherapy: v})} 
                  />

                  {(attentionType === 'individual') && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-[#4a3f35] font-medium">¿Tomas alguna medicación actualmente?</Label>
                        <Textarea className="min-h-[80px] rounded-2xl bg-[#fdfaf6] border-[#e8e1d5] resize-none" value={formData.medication} onChange={(e) => setFormData({...formData, medication: e.target.value})} />
                      </div>

                      <BooleanButtons label="¿Eres menor de edad?" value={formData.isMinor} onChange={(v) => setFormData({...formData, isMinor: v})} />
                    </>
                  )}
                </div>

                <Button type="submit" className="w-full bg-[#c17d60] hover:bg-[#a66a51] h-14 text-lg rounded-full shadow-lg shadow-[#c17d60]/20" disabled={loading}>
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Procesando...</> : "Enviar solicitud de admisión"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdmissionForm;