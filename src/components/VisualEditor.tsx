"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { showSuccess, showError } from '@/utils/toast';
import { 
  Sparkles, 
  Heart, 
  Leaf, 
  Coffee, 
  User, 
  Loader2, 
  Image as ImageIcon,
  Plus,
  Trash2,
  Save,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, any> = {
  Sparkles: <Sparkles />,
  Heart: <Heart />,
  Leaf: <Leaf />,
  Coffee: <Coffee />,
  User: <User />
};

const VisualEditor = () => {
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
      setSettings(settingsRes.data || []);
      setServices(servicesRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string) => settings.find(s => s.key === key)?.value || '';

  const handleUpdateSetting = async (key: string, value: string) => {
    if (getSetting(key) === value) return;
    setSaving(key);
    const { error } = await supabase.from('site_settings').update({ value }).eq('key', key);
    if (error) showError(error.message);
    else {
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
      showSuccess("Guardado");
    }
    setSaving(null);
  };

  const handleUpdateService = async (id: string, updates: any) => {
    setSaving(id);
    const { error } = await supabase.from('services').update(updates).eq('id', id);
    if (error) showError(error.message);
    else {
      setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
    setSaving(null);
  };

  const addService = async () => {
    const { data, error } = await supabase.from('services').insert({
      title: 'Nueva Especialidad',
      description: 'Haz clic para editar la descripción...',
      icon_name: 'Sparkles'
    }).select().single();
    if (data) setServices([...services, data]);
  };

  const deleteService = async (id: string) => {
    if (!confirm("¿Eliminar esta especialidad?")) return;
    await supabase.from('services').delete().eq('id', id);
    setServices(services.filter(s => s.id !== id));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#c17d60]" /></div>;

  return (
    <div className="space-y-20 pb-20">
      
      {/* Banner Informativo */}
      <div className="bg-[#b5b891] text-white p-4 rounded-3xl flex items-center justify-between shadow-lg shadow-[#b5b891]/20">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-xl"><Sparkles className="w-5 h-5" /></div>
          <p className="font-medium">Modo Edición Visual: Haz clic en cualquier texto para cambiarlo.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs opacity-80">
          <Check className="w-4 h-4" /> Los cambios se guardan automáticamente al salir del campo.
        </div>
      </div>

      {/* HERO SECTION EDITABLE */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center border-2 border-dashed border-[#e8e1d5] p-10 rounded-[3rem] bg-white/50 relative group">
        <div className="absolute -top-4 left-10 bg-[#c17d60] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Sección Principal</div>
        
        <div className="space-y-8">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#b5b891]/20 text-[#6b6e4d] text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-2" /> Tu espacio de calma y bienestar
          </div>
          
          <div className="relative group/text">
            <textarea 
              className="w-full text-6xl md:text-7xl font-serif text-[#4a3f35] leading-[1.1] bg-transparent border-none focus:ring-2 focus:ring-[#c17d60]/20 rounded-2xl resize-none p-2 h-auto min-h-[150px]"
              defaultValue={getSetting('hero_title')}
              onBlur={(e) => handleUpdateSetting('hero_title', e.target.value)}
            />
            {saving === 'hero_title' && <Loader2 className="absolute top-2 right-2 w-4 h-4 animate-spin text-[#c17d60]" />}
          </div>

          <div className="relative group/text">
            <textarea 
              className="w-full text-xl text-[#7a6f64] leading-relaxed bg-transparent border-none focus:ring-2 focus:ring-[#c17d60]/20 rounded-2xl resize-none p-2 min-h-[100px]"
              defaultValue={getSetting('hero_description')}
              onBlur={(e) => handleUpdateSetting('hero_description', e.target.value)}
            />
            {saving === 'hero_description' && <Loader2 className="absolute top-2 right-2 w-4 h-4 animate-spin text-[#c17d60]" />}
          </div>
        </div>
        
        <div className="relative group/img">
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
            <img 
              src={getSetting('hero_image_url')} 
              alt="Hero" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-[3rem]">
            <div className="bg-white p-6 rounded-[2rem] shadow-xl space-y-4 w-64">
              <p className="text-xs font-bold text-[#4a3f35] uppercase text-center">Cambiar Imagen</p>
              <Input 
                placeholder="Pega aquí la URL de la imagen"
                defaultValue={getSetting('hero_image_url')}
                onBlur={(e) => handleUpdateSetting('hero_image_url', e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ESPECIALIDADES EDITABLES */}
      <section className="space-y-12 border-2 border-dashed border-[#e8e1d5] p-10 rounded-[3rem] bg-white/50 relative">
        <div className="absolute -top-4 left-10 bg-[#b5b891] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Especialidades</div>
        
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-serif text-[#4a3f35]">¿Cómo podemos ayudarte?</h2>
          <p className="text-[#7a6f64]">Gestiona aquí tus servicios y precios.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all text-center space-y-6 border border-[#e8e1d5]/50 relative group/card">
              <div className="absolute top-4 right-4 opacity-0 group-hover/card:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteService(service.id)}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="w-16 h-16 bg-[#fdfaf6] rounded-2xl flex items-center justify-center mx-auto text-[#c17d60] border border-[#e8e1d5]">
                <select 
                  className="bg-transparent border-none focus:ring-0 cursor-pointer"
                  value={service.icon_name}
                  onChange={(e) => handleUpdateService(service.id, { icon_name: e.target.value })}
                >
                  <option value="Sparkles">✨</option>
                  <option value="Heart">❤️</option>
                  <option value="Leaf">🍃</option>
                  <option value="Coffee">☕</option>
                  <option value="User">👤</option>
                </select>
              </div>

              <div className="space-y-2">
                <input 
                  className="w-full text-2xl font-serif text-[#4a3f35] text-center bg-transparent border-none focus:ring-2 focus:ring-[#c17d60]/20 rounded-xl"
                  defaultValue={service.title}
                  onBlur={(e) => handleUpdateService(service.id, { title: e.target.value })}
                />
                <div className="flex items-center justify-center space-x-2">
                  <input 
                    type="number"
                    className="w-16 text-[#c17d60] font-medium text-center bg-transparent border-none focus:ring-2 focus:ring-[#c17d60]/20 rounded-xl"
                    defaultValue={service.price || ''}
                    onBlur={(e) => handleUpdateService(service.id, { price: parseFloat(e.target.value) || null })}
                  />
                  <span className="text-[#c17d60] font-medium">€ / sesión</span>
                </div>
              </div>

              <textarea 
                className="w-full text-[#7a6f64] leading-relaxed text-center bg-transparent border-none focus:ring-2 focus:ring-[#c17d60]/20 rounded-xl resize-none min-h-[80px]"
                defaultValue={service.description}
                onBlur={(e) => handleUpdateService(service.id, { description: e.target.value })}
              />
              
              {saving === service.id && <Loader2 className="absolute bottom-4 right-4 w-4 h-4 animate-spin text-[#c17d60]" />}
            </div>
          ))}
          
          <button 
            onClick={addService}
            className="bg-[#fdfaf6] p-10 rounded-[2.5rem] border-2 border-dashed border-[#e8e1d5] hover:border-[#c17d60] hover:bg-white transition-all flex flex-col items-center justify-center space-y-4 group"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <Plus className="text-[#c17d60] w-6 h-6" />
            </div>
            <span className="font-serif text-[#7a6f64] group-hover:text-[#c17d60]">Añadir Especialidad</span>
          </button>
        </div>
      </section>

      {/* FOOTER EDITABLE */}
      <footer className="bg-white p-10 rounded-[3rem] border-2 border-dashed border-[#e8e1d5] flex flex-col md:flex-row justify-between items-center gap-8 relative">
        <div className="absolute -top-4 left-10 bg-[#4a3f35] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Pie de Página</div>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#c17d60] rounded-full flex items-center justify-center">
            <Leaf className="text-white w-5 h-5" />
          </div>
          <input 
            className="text-xl font-serif text-[#4a3f35] bg-transparent border-none focus:ring-2 focus:ring-[#c17d60]/20 rounded-xl"
            defaultValue={getSetting('site_name')}
            onBlur={(e) => handleUpdateSetting('site_name', e.target.value)}
          />
        </div>
        <p className="text-[#7a6f64] text-sm">© 2024 Consulta de Psicología. Tu bienestar es nuestra prioridad.</p>
      </footer>
    </div>
  );
};

export default VisualEditor;