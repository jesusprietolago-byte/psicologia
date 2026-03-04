"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, ArrowRight, Leaf, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Blog = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6]"><Loader2 className="animate-spin text-[#c17d60]" /></div>;

  return (
    <div className="min-h-screen bg-[#fdfaf6] font-sans">
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-[#c17d60] rounded-full flex items-center justify-center">
            <Leaf className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-serif font-medium text-[#4a3f35]">Alma Psychology</span>
        </Link>
        <Button asChild variant="ghost" className="text-[#7a6f64] hover:text-[#c17d60]">
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio</Link>
        </Button>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <header className="text-center mb-20 space-y-4">
          <h1 className="text-5xl font-serif text-[#4a3f35]">Blog de Bienestar</h1>
          <p className="text-xl text-[#7a6f64]">Reflexiones y herramientas para tu salud mental.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {posts.map((post) => (
            <Card key={post.id} className="border-none shadow-xl shadow-[#c17d60]/5 bg-white rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all group">
              {post.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <CardHeader className="p-8 pb-0">
                <div className="flex items-center text-xs text-[#c17d60] font-bold uppercase tracking-widest mb-3">
                  <Calendar className="w-3 h-3 mr-2" /> {format(new Date(post.created_at), 'd MMMM, yyyy', { locale: es })}
                </div>
                <CardTitle className="text-2xl font-serif text-[#4a3f35] group-hover:text-[#c17d60] transition-colors">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-6">
                <p className="text-[#7a6f64] line-clamp-3 leading-relaxed">
                  {post.content.replace(/<[^>]*>/g, '')}
                </p>
                <Button asChild variant="link" className="p-0 text-[#c17d60] font-bold h-auto">
                  <Link to={`/blog/${post.slug}`}>Leer más <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-[#e8e1d5] rounded-[3rem]">
            <p className="text-[#7a6f64] italic">Próximamente publicaremos nuevos artículos.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Blog;