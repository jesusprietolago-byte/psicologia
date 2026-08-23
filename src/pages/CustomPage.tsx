"use client";

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Leaf, Loader2 } from 'lucide-react';

const CustomPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        navigate('/404');
        return;
      }

      setPage(data);
      setLoading(false);
    };

    fetchPage();
  }, [slug, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6]"><Loader2 className="animate-spin text-[#c17d60]" /></div>;

  return (
    <div className="min-h-screen bg-[#fdfaf6] font-sans">
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-[#c17d60] rounded-full flex items-center justify-center">
            <Leaf className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-serif font-medium text-[#4a3f35]">Alma Psicologia</span>
        </Link>
        <Button asChild variant="ghost" className="text-[#7a6f64] hover:text-[#c17d60]">
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio</Link>
        </Button>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-5xl font-serif text-[#4a3f35] mb-6">{page.title}</h1>
          <div className="h-1 w-20 bg-[#c17d60] rounded-full" />
        </header>

        <div className="prose prose-stone max-w-none">
          <div className="text-lg text-[#7a6f64] leading-relaxed whitespace-pre-line">
            {page.content}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomPage;
