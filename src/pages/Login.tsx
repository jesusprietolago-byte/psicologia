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
  const { user, role, loading } = useAuth();
  const [view, setView] = useState<"sign_in" | "sign_up" | "forgotten_password" | "update_password">("sign_in");
  const [isInvite, setIsInvite] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    // Detectamos si es una invitación ANTES de cualquier otra cosa
    if (hash && (hash.includes("type=invite") || hash.includes("type=recovery") || hash.includes("access_token="))) {
      setView("update_password");
      setIsInvite(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("update_password");
        setIsInvite(true);
      }
      if (event === "USER_UPDATED" || event === "SIGNED_IN") {
        // Una vez actualizada la contraseña o logueado, permitimos la redirección
        setIsInvite(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Si está cargando el estado de auth, esperamos
  if (loading) return null;

  // REDIRECCIÓN: Solo si el usuario está logueado Y NO estamos en medio de una invitación/recuperación
  if (user && !isInvite) {
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
            {view === "update_password" ? "Crea tu contraseña" : "Bienvenido de nuevo"}
          </CardTitle>
          <p className="text-[#7a6f64] mt-2">
            {view === "update_password" 
              ? "Establece una contraseña segura para activar tu cuenta" 
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
                  link_text: '¿Ya tienes cuenta? Inicia sesión',
                },
                update_password: {
                  password_label: 'Nueva contraseña',
                  password_input_placeholder: 'Mínimo 6 caracteres',
                  button_label: 'Activar mi cuenta y entrar',
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