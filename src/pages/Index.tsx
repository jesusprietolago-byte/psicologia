import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, Shield, Video, Calendar } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-6">
          <Heart className="w-4 h-4 mr-2" /> Tu bienestar es la prioridad
        </div>
        <h1 className="text-5xl md:text-6xl font-light text-slate-900 mb-6 tracking-tight">
          Terapia Online Profesional
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Un espacio seguro y confidencial para trabajar en tu salud mental desde la comodidad de tu hogar.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" className="bg-sky-600 hover:bg-sky-700 text-white px-8 rounded-full text-lg">
            <Link to="/login">Empezar ahora</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-slate-200 text-slate-600 px-8 rounded-full text-lg">
            <Link to="/login">Acceso Pacientes</Link>
          </Button>
        </div>
      </header>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="text-sky-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-3">100% Confidencial</h3>
            <p className="text-slate-500">Cumplimos con los más altos estándares de protección de datos y ética profesional.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Video className="text-indigo-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-3">Videollamada HD</h3>
            <p className="text-slate-500">Sesiones fluidas sin necesidad de instalar aplicaciones externas.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="text-emerald-600 w-8 h-8" />
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-3">Gestión Ágil</h3>
            <p className="text-slate-500">Reserva y gestiona tus citas y facturas de forma totalmente autónoma.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10 text-center text-slate-400 text-sm">
        <p>© 2024 Consulta de Psicología. Todos los derechos reservados.</p>
        <p className="mt-2">Servicios sanitarios exentos de IVA (Art. 20 Ley 37/1992).</p>
      </footer>
    </div>
  );
};

export default Index;