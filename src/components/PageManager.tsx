"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { showSuccess, showError } from '@/utils/toast';
import { Plus, Trash2, Loader2, FileText, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const PageManager = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    const { data } = await supabase.from('custom_pages').select('*').order('created_at', { ascending: false });
    setPages(data || []);
    setLoading(false);
  };

  const addPage = async () => {
    const title = "Nueva Página";
    const slug = `pagina-${Date.now()}`;
    const { data, error } = await supabase.from('custom_pages').insert({
      title,
      slug,
      content: 'Escribe aquí el contenido de tu nueva página...',
      is_active: true,
      show_in_nav: true
    }).select().single();

    if (error) showError(error.message);
    else setPages([data, ...pages]);
  };

  const updatePage = async (id: string, updates: any) => {
    setSaving(id);
    const { error } = await supabase.from('custom_pages').update(updates).eq('id', id);
    if (error) showError(error.message);
    else {
      setPages(pages.map(p => p.id === id ? { ...p, ...updates } : p));
      showSuccess("Página actualizada");
    }
    setSaving(null);
  };

  const deletePage = async (id: string) => {
    if (!confirm("¿Eliminar esta página por completo?")) return;
    await supabase.from('custom_pages').delete().eq('id', id);
    setPages(pages.filter(p => p.id !== id));
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#c17d60]" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif text-[#4a3f35]">Páginas Adicionales</h2>
          <p className="text-sm text-[#7a6f64]">Crea nuevas secciones independientes para tu web.</p>
        </div>
        <Button onClick={addPage} className="bg-[#4a3f35] hover:bg-[#2d2620] text-white rounded-full">
          <Plus className="w-4 h-4 mr-2" /> Crear Página
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {pages.map((page) => (
          <Card key={page.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-start gap-6">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-[#c17d60]">Título de la Página</Label>
                      <Input 
                        defaultValue={page.title} 
                        onBlur={(e) => updatePage(page.id, { title: e.target.value })}
                        className="rounded-xl border-[#e8e1d5]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-[#c17d60]">URL (Slug)</Label>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-[#7a6f64]">/p/</span>
                        <Input 
                          defaultValue={page.slug} 
                          onBlur={(e) => updatePage(page.id, { slug: e.target.value })}
                          className="rounded-xl border-[#e8e1d5]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-[#c17d60]">Contenido</Label>
                    <Textarea 
                      defaultValue={page.content} 
                      onBlur={(e) => updatePage(page.id, { content: e.target.value })}
                      className="min-h-[150px] rounded-2xl border-[#e8e1d5] resize-none"
                    />
                  </div>
                </div>

                <div className="w-56 space-y-4 shrink-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#fdfaf6] rounded-xl border border-[#e8e1d5]">
                      <Label className="text-xs font-bold text-[#4a3f35]">Visible en Menú</Label>
                      <Switch 
                        checked={page.show_in_nav} 
                        onCheckedChange={(checked) => updatePage(page.id, { show_in_nav: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#fdfaf6] rounded-xl border border-[#e8e1d5]">
                      <Label className="text-xs font-bold text-[#4a3f35]">Página Activa</Label>
                      <Switch 
                        checked={page.is_active} 
                        onCheckedChange={(checked) => updatePage(page.id, { is_active: checked })}
                      />
                    </div>
                  </div>
                  
                  <Button asChild variant="outline" className="w-full rounded-full border-[#e8e1d5] text-[#7a6f64]">
                    <Link to={`/p/${page.slug}`} target="_blank">
                      <ExternalLink className="w-4 h-4 mr-2" /> Ver Página
                    </Link>
                  </Button>

                  <Button 
                    variant="ghost" 
                    onClick={() => deletePage(page.id)}
                    className="w-full text-red-500 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                  </Button>
                  {saving === page.id && <div className="flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-[#c17d60]" /></div>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PageManager;