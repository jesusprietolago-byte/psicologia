"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Leaf, ArrowLeft, Loader2 } from 'lucide-react';

const Login = () => {
  const { user, role, loading: authLoading } = useAuth();

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6]">
      <Loader2 className="w-10 h-10 animate-spin text-[#c17d60]" />
    </div>
  );

  if (user) {
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
            <Leaf className="text-white w-8 h-8" />
          </div>
        </div>

        <CardHeader className="text-center pt-8 pb-2">
          <CardTitle className="text-3xl font-serif text-[#4a3f35]">Bienvenido</CardTitle>
          <p className="text-[#7a6f64] mt-2">Accede a tu espacio personal de bienestar</p>
        </CardHeader>

        <CardContent className="p-8">
          <Auth
            supabaseClient={supabase}
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
                  },
                  radii: {
                    buttonBorderRadius: '9999px',
                    inputBorderRadius: '1rem',
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
                forgotten_password: {
                  link_text: '¿Olvidaste tu contraseña?',
                  button_label: 'Enviar instrucciones',
                }
              }
            }}
          />
          <div className="mt-6 text-center">
            <p className="text-sm text-[#7a6f64]">
              ¿Aún no eres paciente? <Link to="/admission" className="text-[#c17d60] font-medium hover:underline">Solicita tu admisión aquí</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;