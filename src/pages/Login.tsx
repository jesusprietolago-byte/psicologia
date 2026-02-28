"use client";

import { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Leaf, ArrowLeft, Sparkles } from 'lucide-react';

const Login = () => {
  const { user, role } = useAuth();
  const [view, setView] = useState<"sign_in" | "sign_up" | "forgotten_password" | "update_password">("sign_in");

  useEffect(() => {
    // Detectar si el usuario viene de un enlace de recuperación o invitación
    const hash = window.location.hash;
    if (hash && (hash.includes("type=recovery") || hash.includes("type=invite"))) {
      setView("update_password");
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("update_password");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Si el usuario ya está logueado y NO está actualizando contraseña, redirigir
  if (user && view !== "update_password") {
    return <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6] p-4 font-sans">
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center text-[#7a6f64] hover:text-[#c17d60] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
        </Link>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden">
        <div className="h-32 bg-[#c17d60] flex items-center justify-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
            {view === "update_password" ? <Sparkles className="text-white w-8 h-8" /> : <Leaf className="text-white w-8 h-8" />}
          </div>
        </div>
        <CardHeader className="text-center pt-8 pb-2">
          <CardTitle className="text-3xl font-serif text-[#4a3f35]">
            {view === "update_password" ? "Completa tu registro" : "Bienvenido de nuevo"}
          </CardTitle>
          <p className="text-[#7a6f64] mt-2">
            {view === "update_password" 
              ? "Establece tu contraseña para acceder a tu espacio" 
              : "Accede a tu espacio personal de bienestar"}
          </p>
        </CardHeader>
        <CardContent className="p-8">
          <Auth
            supabaseClient={supabase}
            view={view}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#c17d60',
                    brandAccent: '#a66a51',
                    inputBackground: '#fdfaf6',
                    inputText: '#4a3f35',
                    inputBorder: '#e8e1d5',
                    inputPlaceholder: '#7a6f64',
                  },
                  radii: {
                    buttonRadius: '9999px',
                    inputRadius: '1rem',
                  }
                }
              }
            }}
            providers={[]}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Correo electrónico',
                  password_label: 'Contraseña',
                  button_label: 'Iniciar sesión',
                },
                update_password: {
                  password_label: 'Nueva contraseña',
                  button_label: 'Guardar contraseña y entrar',
                }
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;