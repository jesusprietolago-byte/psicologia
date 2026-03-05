"use client";

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Leaf, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (error || !data) {
        navigate('/404');
        return;
      }

      setPost(data);
      setLoading(false);
    };

    fetchPost();
  }, [slug, navigate]);

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
          <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" /> Volver al blog</Link>
        </Button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <article className="space-y-8">
          <header className="space-y-6 text-center">
            <div className="flex items-center justify-center text-sm text-[#c17d60] font-bold uppercase tracking-widest">
              <Calendar className="w-4 h-4 mr-2" /> {format(new Date(post.created_at), 'd MMMM, yyyy', { locale: es })}
            </div>
            <h1 className="text-5xl md:text-6xl font-serif text-[#4a3f35] leading-tight">{post.title}</h1>
            <div className="h-1 w-20 bg-[#c17d60] rounded-full mx-auto" />
          </header>

          {post.image_url && (
            <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="prose prose-stone max-w-none">
            <div className="text-lg md:text-xl text-[#4a3f35] leading-relaxed whitespace-pre-line">
              {post.content}
            </div>
          </div>
        </article>
      </main>

      <footer className="max-w-3xl mx-auto px-6 py-20 border-t border-[#e8e1d5] mt-20 text-center">
        <p className="text-[#7a6f64] mb-8 italic">¿Sientes que es el momento de empezar tu propio proceso?</p>
        <Button asChild className="bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-10 h-14 text-lg shadow-lg shadow-[#c17d60]/20">
          <Link to="/admission">Solicitar primera cita</Link>
        </Button>
      </footer>
    </div>
  );
};

export default BlogPost;