import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Sparkles, Leaf, Coffee } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#fdfaf6] font-sans">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-[#c17d60] rounded-full flex items-center justify-center">
            <Leaf className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-serif font-medium text-[#4a3f35]">Alma Psychology</span>
        </div>
        <div className="flex items-center space-x-8">
          <Link to="/login" className="text-[#4a3f35] hover:text-[#c17d60] transition-colors font-medium">Acceso Pacientes</Link>
          <Button asChild className="bg-[#c17d60] hover:bg-[#a66a51] text-white rounded-full px-8">
            <Link to="/admission">Solicitar Cita</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 pt-12 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#b5b891]/20 text-[#6b6e4d] text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-2" /> Tu espacio de calma y bienestar
          </div>
          <h1 className="text-6xl md:text-7xl font-serif text-[#4a3f35] leading-[1.1]">
            Laura P. L. <br />
            <span className="text-[#c17d60] italic">Psicología Cercana</span>
          </h1>
          <p className="text-xl text-[#7a6f64] leading-relaxed max-w-lg">
            Un refugio seguro donde trabajar en tu salud mental con empatía, profesionalidad y calidez humana.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-[#c17d60] hover:bg-[#a66a51] text-white px-10 rounded-full text-lg h-14 shadow-lg shadow-[#c17d60]/20">
              <Link to="/admission">Comenzar Proceso</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-[#e8e1d5] text-[#4a3f35] hover:bg-[#e8e1d5]/30 px-10 rounded-full text-lg h-14">
              <Link to="/login">Ya soy paciente</Link>
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
            <img 
              src="https://images.unsplash.com/photo-1523908511403-7fc7b25592f4?auto=format&fit=crop&q=80&w=1000" 
              alt="Espacio de terapia acogedor" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </header>

      {/* Specialties */}
      <section className="bg-[#f7f3ed] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-serif text-[#4a3f35]">¿Cómo podemos ayudarte?</h2>
            <p className="text-[#7a6f64] max-w-xl mx-auto">Especialidades diseñadas para acompañarte en cada etapa de tu proceso personal.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Ansiedad", icon: <Sparkles />, desc: "Herramientas para gestionar el estrés y encontrar la paz interior." },
              { title: "Depresión", icon: <Heart />, desc: "Acompañamiento empático para recuperar la ilusión y el bienestar." },
              { title: "Autoestima", icon: <Leaf />, desc: "Fortalece tu relación contigo mismo y descubre tu potencial." }
            ].map((item, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow text-center space-y-6 border border-[#e8e1d5]/50">
                <div className="w-16 h-16 bg-[#fdfaf6] rounded-2xl flex items-center justify-center mx-auto text-[#c17d60] border border-[#e8e1d5]">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-serif text-[#4a3f35]">{item.title}</h3>
                <p className="text-[#7a6f64] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#fdfaf6] border-t border-[#e8e1d5] py-16">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#c17d60] rounded-full flex items-center justify-center">
              <Leaf className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-serif text-[#4a3f35]">Alma Psychology</span>
          </div>
          <p className="text-[#7a6f64] text-sm">© 2024 Consulta de Psicología. Tu bienestar es nuestra prioridad.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;