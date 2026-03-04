"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Check,
  Layout,
  FileText,
  Files
} from 'lucide-react';
import PageManager from './PageManager';

const VisualEditor = () => {
  const [settings, setSettings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, servicesRes, sectionsRes] = await Promise.all([
        supabase.from('site_settings').select('*').order('key'),
        supabase.from('services').select('*').order('created_at'),
        supabase.from('sections').select('*').order('order_index')
      ]);
      setSettings(settingsRes.data || []);
      setServices(servicesRes.data || []);
      setSections(sectionsRes.data || []);
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

  const handleUpdateSection = async (id: string, updates: any) => {
    setSaving(id);
    const { error } = await supabase.from('sections').update(updates).eq('id', id);
    if (error) showError(error.message);
    else {
      setSections(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
    setSaving(null);
  };

  const addSection = async () => {
    const { data, error } = await supabase.from('sections').insert({
      title: 'Nueva Sección',
      content: 'Escribe aquí el contenido de la sección...',
      order_index: sections.length
    }).select().single();
    if (data) setSections([...sections, data]);
  };

  const deleteSection = async (id: string) => {
    if (!confirm("¿Eliminar esta sección?")) return;
    await supabase.from('sections').delete().eq('id', id);
    setSections(sections.filter(s => s.id !== id));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#c17d60]" /></div>;

  return (
    <div className="space-y-20 pb-20">
      
      <div className="bg-[#b5b891] text-white p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between shadow-lg shadow-[#b5b891]/20 gap-6">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-2xl"><Sparkles className="w-6 h-6" /></div>
          <div>
            <p className="font-serif text-xl">Editor Visual de la Home</p>
            <p className="text-sm opacity-80">Haz clic en cualquier texto para editarlo.</p>
          </div>
        </div>
        
        {/* Interruptor del Blog */}
        <div className="bg-white/10 p-4 rounded-2xl flex items-center space-x-4 border border-white/20">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5" />
            <Label htmlFor="blog-toggle" className="font-medium cursor-pointer">Mostrar Blog en la web</Label>
          </div>
          <Switch 
            id="blog-toggle"
            checked={getSetting('show_blog') === 'true'}
            onCheckedChange={(checked) => handleUpdateSetting('show_blog', checked.toString())}
            className="data-[state=checked]:bg-white data-[state=checked]:text-[#b5b891]"
          />
        </div>
      </div>

      {/* GESTIÓN DE PÁGINAS ADICIONALES */}
      <section className="p-10 border-2 border-dashed border-[#e8e1d5] rounded-[3rem] bg-white/30 relative">
        <div className="absolute -top-4 left-10 bg-[#4a3f35] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Estructura de la Web</div>
        <PageManager />
      </section>

      {/* HERO SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center border-2 border-dashed border-[#e8e1d5] p-10 rounded-[3rem] bg-white/50 relative">
        <div className="absolute -top-4 left-10 bg-[#c17d60] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Cabecera Principal</div>
        
        <div className="space-y-8">
          <textarea 
            className="w-full text-6xl md:text-7xl font-serif text-[#4a3f35] leading-[1.1] bg-transparent border-none focus:ring-2 focus:ring-[#c17d60]/20 rounded-2xl resize-none p-2 h-auto min-h-[150px]"
            defaultValue={getSetting('hero_title')}
            onBlur={(e) => handleUpdateSetting('hero_title', e.target.value)}
          />
          <textarea 
            className="w-full text-xl text-[#7a6f64] leading-relaxed bg-transparent border-none focus:ring-2 focus:ring-[#c17d60]/20 rounded-2xl resize-none p-2 min-h-[100px]"
            defaultValue={getSetting('hero_description')}
            onBlur={(e) => handleUpdateSetting('hero_description', e.target.value)}
          />
        </div>
        
        <div className="relative group/img">
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
            <img src={getSetting('hero_image_url')} alt="Hero" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-[3rem]">
            <div className="bg-white p-6 rounded-[2rem] shadow-xl space-y-4 w-64">
              <p className="text-xs font-bold text-[#4a3f35] uppercase text-center">URL de la Imagen</p>
              <Input 
                defaultValue={getSetting('hero_image_url')}
                onBlur={(e) => handleUpdateSetting('hero_image_url', e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ESPECIALIDADES */}
      <section className="space-y-12 border-2 border-dashed border-[#e8e1d5] p-10 rounded-[3rem] bg-white/50 relative">
        <div className="absolute -top-4 left-10 bg-[#b5b891] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Especialidades</div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service) => (
            <div key={service.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all text-center space-y-6 border border-[#e8e1d5]/50 relative group/card">
              <div className="absolute top-4 right-4 opacity-0 group-hover/card:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => deleteService(service.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full">
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
              <input 
                className="w-full text-2xl font-serif text-[#4a3f35] text-center bg-transparent border-none focus:ring-2 focus:ring-[#c17d60]/20 rounded-xl"
                defaultValue={service.title}
                onBlur={(e) => handleUpdateService(service.id, { title: e.target.value })}
              />
              <textarea 
                className="w-full text-[#7a6f64] leading-relaxed text-center bg-transparent border-none focus:ring-2 focus:ring-[#c17d60]/20 rounded-xl resize-none min-h-[80px]"
                defaultValue={service.description}
                onBlur={(e) => handleUpdateService(service.id, { description: e.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      {/* SECCIONES DINÁMICAS */}
      <div className="space-y-12">
        {sections.map((section) => (
          <section key={section.id} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center border-2 border-dashed border-[#e8e1d5] p-10 rounded-[3rem] bg-white/50 relative group">
            <div className="absolute -top-4 left-10 bg-[#4a3f35] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Sección Personalizada</div>
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" onClick={() => deleteSection(section.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-6">
              <input 
                className="w-full text-4xl font-serif text-[#4a3f35] bg-transparent border-none focus:ring-2 focus:ring-[#c17d60]/20 rounded-xl p-2"
                defaultValue={section.title}
                onBlur={(e) => handleUpdateSection(section.id, { title: e.target.value })}
              />
              <textarea 
                className="w-full text-lg text-[#7a6f64] leading-relaxed bg-transparent border-none focus:ring-2 focus:ring-[#c17d60]/20 rounded-xl resize-none p-2 min-h-[150px]"
                defaultValue={section.content}
                onBlur={(e) => handleUpdateSection(section.id, { content: e.target.value })}
              />
            </div>

            <div className="relative group/img">
              <div className="aspect-video rounded-[2rem] overflow-hidden shadow-xl border-4 border-white bg-[#fdfaf6] flex items-center justify-center">
                {section.image_url ? (
                  <img src={section.image_url} alt="Sección" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-[#e8e1d5]" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]">
                <div className="bg-white p-6 rounded-[2rem] shadow-xl space-y-4 w-64">
                  <p className="text-xs font-bold text-[#4a3f35] uppercase text-center">URL de la Imagen</p>
                  <Input 
                    defaultValue={section.image_url || ''}
                    onBlur={(e) => handleUpdateSection(section.id, { image_url: e.target.value })}
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>
          </section>
        ))}

        <Button onClick={addSection} className="w-full h-24 border-2 border-dashed border-[#e8e1d5] bg-white/50 hover:bg-white text-[#7a6f64] hover:text-[#c17d60] rounded-[3rem] text-xl font-serif">
          <Plus className="w-6 h-6 mr-3" /> Añadir Nueva Sección a la Home
        </Button>
      </div>
    </div>
  );
};

export default VisualEditor;