"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Sparkles, Leaf, Coffee, User, Loader2, ArrowRight } from "lucide-react";
import { cn } from '@/lib/utils';

const iconMap: Record<string, any> = {
  Sparkles: <Sparkles />,
  Heart: <Heart />,
  Leaf: <Leaf />,
  Coffee: <Coffee />,
  User: <User />
};

const Index = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [services, setServices] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [customPages, setCustomPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const [settingsRes, servicesRes, sectionsRes, pagesRes] = await Promise.all([
          supabase.from('site_settings').select('key, value'),
          supabase.from('services').select('*').eq('is_active', true).order('created_at'),
          supabase.from('sections').select('*').eq('is_active', true).order('order_index'),
          supabase.from('custom_pages').select('*').eq('is_active', true).eq('show_in_nav', true)
        ]);

        if (settingsRes.data) {
          const settingsMap = settingsRes.data.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
          setSettings(settingsMap);
        }
        setServices(servicesRes.data || []);
        setSections(sectionsRes.data || []);
        setCustomPages(pagesRes.data || []);
      } catch (error) {
        console.error("Error loading content:", error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6]"><Loader2 className="w-10 h-10 animate-spin text-[#c17d60]" /></div>;

  const showBlog = settings.show_blog === 'true';

  return (
    <div className="min-h-screen bg-[#fdfaf6] font-sans">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-[#c17d60] rounded-full flex items-center justify-center">
            <Leaf className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-serif font-medium text-[#4a3f35]">{settings.site_name || 'Alma Psicologia'}</span>
        </div>
        <div className="flex items-center space-x-8">
          {/* Páginas Dinámicas */}
          {customPages.map(page => (
            <Link key={page.id} to={`/p/${page.slug}`} className="text-[#4a3f35] hover:text-[#c17d60] transition-colors font-medium">
              {page.title}
            </Link>
          ))}
          
          {showBlog && (
            <Link to="/blog" className="text-[#4a3f35] hover:text-[#c17d60] transition-colors font-medium">Blog</Link>
          )}
          <Link to="/login" className="text-[#4a3f35] hover:text-[#c17d60] transition-colors font-medium">Acceso Pacientes</Link>
          <Button asChild className="bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-8">
            <Link to="/admission">Solicitar Cita</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <h1 className="text-6xl md:text-7xl font-serif text-[#4a3f35] leading-[1.1] whitespace-pre-line">
            {settings.hero_title}
          </h1>
          <p className="text-xl text-[#7a6f64] leading-relaxed max-w-lg">
            {settings.hero_description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-[#c17d60] hover:bg-[#a66a51] text-white px-10 rounded-full text-lg h-14 shadow-lg shadow-[#c17d60]/20">
              <Link to="/admission">Comenzar Proceso</Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl rotate-2">
            <img src={settings.hero_image_url} alt="Hero" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>

      {/* Specialties */}
      <section className="bg-[#f7f3ed] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-serif text-[#4a3f35]">Especialidades</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-sm text-center space-y-6 border border-[#e8e1d5]/50">
                <div className="w-16 h-16 bg-[#fdfaf6] rounded-2xl flex items-center justify-center mx-auto text-[#c17d60] border border-[#e8e1d5]">
                  {iconMap[service.icon_name] || <Sparkles />}
                </div>
                <h3 className="text-2xl font-serif text-[#4a3f35]">{service.title}</h3>
                <p className="text-[#7a6f64] leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      {sections.map((section, i) => (
        <section key={section.id} className={cn("py-24", i % 2 === 0 ? "bg-[#fdfaf6]" : "bg-white")}>
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className={cn("space-y-8", i % 2 !== 0 && "lg:order-2")}>
              <h2 className="text-5xl font-serif text-[#4a3f35]">{section.title}</h2>
              <p className="text-xl text-[#7a6f64] leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
            {section.image_url && (
              <div className={cn("relative", i % 2 !== 0 && "lg:order-1")}>
                <div className="aspect-video rounded-[3rem] overflow-hidden shadow-xl">
                  <img src={section.image_url} alt={section.title} className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        </section>
      ))}

      {/* Footer */}
      <footer className="bg-[#fdfaf6] border-t border-[#e8e1d5] py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#c17d60] rounded-full flex items-center justify-center">
              <Leaf className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-serif text-[#4a3f35]">{settings.site_name}</span>
          </div>
          <p className="text-[#7a6f64] text-sm">© 2024 Consulta de Psicología. Tu bienestar es nuestra prioridad.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
