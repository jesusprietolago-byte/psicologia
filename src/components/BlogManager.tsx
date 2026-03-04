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
import { Plus, Trash2, Save, Loader2, FileText, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

const BlogManager = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const addPost = async () => {
    const title = "Nuevo artículo";
    const slug = `articulo-${Date.now()}`;
    const { data, error } = await supabase.from('posts').insert({
      title,
      slug,
      content: 'Escribe aquí el contenido...',
      is_published: false
    }).select().single();

    if (error) showError(error.message);
    else setPosts([data, ...posts]);
  };

  const updatePost = async (id: string, updates: any) => {
    setSaving(id);
    const { error } = await supabase.from('posts').update(updates).eq('id', id);
    if (error) showError(error.message);
    else {
      setPosts(posts.map(p => p.id === id ? { ...p, ...updates } : p));
      showSuccess("Artículo actualizado");
    }
    setSaving(null);
  };

  const deletePost = async (id: string) => {
    if (!confirm("¿Eliminar este artículo?")) return;
    await supabase.from('posts').delete().eq('id', id);
    setPosts(posts.filter(p => p.id !== id));
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#c17d60]" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-[#4a3f35]">Gestión del Blog</h2>
        <Button onClick={addPost} className="bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Artículo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-start gap-6">
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-[#c17d60]">Título</Label>
                      <Input 
                        defaultValue={post.title} 
                        onBlur={(e) => updatePost(post.id, { title: e.target.value })}
                        className="rounded-xl border-[#e8e1d5]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-[#c17d60]">Slug (URL)</Label>
                      <Input 
                        defaultValue={post.slug} 
                        onBlur={(e) => updatePost(post.id, { slug: e.target.value })}
                        className="rounded-xl border-[#e8e1d5]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-[#c17d60]">Imagen URL</Label>
                    <Input 
                      defaultValue={post.image_url || ''} 
                      onBlur={(e) => updatePost(post.id, { image_url: e.target.value })}
                      placeholder="https://..."
                      className="rounded-xl border-[#e8e1d5]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-[#c17d60]">Contenido</Label>
                    <Textarea 
                      defaultValue={post.content} 
                      onBlur={(e) => updatePost(post.id, { content: e.target.value })}
                      className="min-h-[200px] rounded-2xl border-[#e8e1d5] resize-none"
                    />
                  </div>
                </div>

                <div className="w-48 space-y-6 shrink-0">
                  <div className="flex items-center justify-between p-4 bg-[#fdfaf6] rounded-2xl border border-[#e8e1d5]">
                    <Label className="text-xs font-bold text-[#4a3f35]">Publicado</Label>
                    <Switch 
                      checked={post.is_published} 
                      onCheckedChange={(checked) => updatePost(post.id, { is_published: checked })}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => deletePost(post.id)}
                    className="w-full text-red-500 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                  </Button>
                  {saving === post.id && <div className="flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-[#c17d60]" /></div>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BlogManager;