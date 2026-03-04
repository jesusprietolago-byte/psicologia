"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { showSuccess, showError } from '@/utils/toast';
import { 
  Save, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Type, 
  Layout, 
  Loader2,
  Sparkles,
  Heart,
  Leaf,
  Coffee,
  User
} from 'lucide-react';

const ContentManager = () => {
  const [settings, setSettings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, servicesRes] = await Promise.all([
        supabase.from('site_settings').select('*').order('key'),
        supabase.from('services').select('*').order('created_at')
      ]);
      
      if (settingsRes.error) throw settingsRes.error;
      if (servicesRes.error) throw servicesRes.error;

      setSettings(settingsRes.data || []);
      setServices(servicesRes.data || []);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    setSaving(key);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw error;
      showSuccess("Cambio guardado");
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSaving(null);
    }
  };

  const addService = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          title: 'Nuevo Servicio',
          description: 'Descripción del servicio...',
          icon_name: 'Sparkles'
        })
        .select()
        .single();

      if (error) throw error;
      setServices([...services, data]);
      showSuccess("Servicio añadido");
    } catch (error: any) {
      showError(error.message);
    }
  };

  const updateService = async (id: string, updates: any) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setServices(services.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSaving(null);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      setServices(services.filter(s => s.id !== id));
      showSuccess("Servicio eliminado");
    } catch (error: any) {
      showError(error.message);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-10 h-10 animate-spin text-[#c17d60]" />
    </div>
  );

  return (
    <div className="space-y-12">
      {/* Textos Globales */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3">
          <Type className="text-[#c17d60] w-6 h-6" />
          <h2 className="text-2xl font-serif text-[#4a3f35]">Textos de la Web</h2>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {settings.filter(s => !s.key.includes('image')).map((s) => (
            <Card key={s.key} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2rem] overflow-hidden">
              <CardContent className="p-8 space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest">{s.description}</Label>
                  {saving === s.key && <Loader2 className="w-4 h-4 animate-spin text-[#c17d60]" />}
                </div>
                {s.key === 'hero_description' ? (
                  <Textarea 
                    defaultValue={s.value}
                    onBlur={(e) => updateSetting(s.key, e.target.value)}
                    className="min-h-[100px] bg-[#fdfaf6] border-[#e8e1d5] rounded-2xl focus:ring-[#c17d60] resize-none"
                  />
                ) : (
                  <Input 
                    defaultValue={s.value}
                    onBlur={(e) => updateSetting(s.key, e.target.value)}
                    className="h-12 bg-[#fdfaf6] border-[#e8e1d5] rounded-xl focus:ring-[#c17d60]"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Imágenes */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3">
          <ImageIcon className="text-[#c17d60] w-6 h-6" />
          <h2 className="text-2xl font-serif text-[#4a3f35]">Imágenes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settings.filter(s => s.key.includes('image')).map((s) => (
            <Card key={s.key} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2rem] overflow-hidden">
              <CardContent className="p-8 space-y-4">
                <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest">{s.description}</Label>
                <div className="aspect-video rounded-2xl overflow-hidden border border-[#e8e1d5] bg-[#fdfaf6] mb-4">
                  <img src={s.value} alt={s.description} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-[#7a6f64]">URL de la imagen (o ruta local)</Label>
                  <Input 
                    defaultValue={s.value}
                    onBlur={(e) => updateSetting(s.key, e.target.value)}
                    className="h-10 bg-[#fdfaf6] border-[#e8e1d5] rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Servicios */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Layout className="text-[#c17d60] w-6 h-6" />
            <h2 className="text-2xl font-serif text-[#4a3f35]">Especialidades y Servicios</h2>
          </div>
          <Button onClick={addService} className="bg-[#b5b891] hover:bg-[#a4a77d] text-white rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Añadir Especialidad
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2rem] overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-4 flex-1 mr-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest">Título</Label>
                      <Input 
                        defaultValue={service.title}
                        onBlur={(e) => updateService(service.id, { title: e.target.value })}
                        className="h-10 bg-[#fdfaf6] border-[#e8e1d5] rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest">Descripción</Label>
                      <Textarea 
                        defaultValue={service.description}
                        onBlur={(e) => updateService(service.id, { description: e.target.value })}
                        className="min-h-[80px] bg-[#fdfaf6] border-[#e8e1d5] rounded-xl resize-none"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteService(service.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center space-x-4 pt-2 border-t border-[#fdfaf6]">
                  <div className="flex-1 space-y-2">
                    <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest">Icono</Label>
                    <select 
                      className="w-full h-10 bg-[#fdfaf6] border-[#e8e1d5] rounded-xl px-3 text-sm"
                      defaultValue={service.icon_name}
                      onChange={(e) => updateService(service.id, { icon_name: e.target.value })}
                    >
                      <option value="Sparkles">Chispas</option>
                      <option value="Heart">Corazón</option>
                      <option value="Leaf">Hoja</option>
                      <option value="Coffee">Café</option>
                      <option value="User">Usuario</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-[10px] uppercase text-[#c17d60] font-bold tracking-widest">Precio (€)</Label>
                    <Input 
                      type="number"
                      defaultValue={service.price || ''}
                      onBlur={(e) => updateService(service.id, { price: parseFloat(e.target.value) || null })}
                      className="h-10 bg-[#fdfaf6] border-[#e8e1d5] rounded-xl"
                      placeholder="Ej: 60"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ContentManager;