"use client";

import { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Leaf, ArrowLeft, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Login = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [isInvite, setIsInvite] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    // Detectamos si el usuario viene de un email de invitación o recuperación
    if (hash && (hash.includes("type=invite") || hash.includes("type=recovery") || hash.includes("access_token="))) {
      setIsInvite(true);
    }
  }, []);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Las contraseñas no coinciden");
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      showSuccess("¡Cuenta activada con éxito!");
      setIsInvite(false); // Esto permitirá la redirección al Dashboard
    } catch (error: any) {
      showError("Error al activar la cuenta: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading) return null;

  // Si ya está logueado y NO es una invitación pendiente de contraseña, redirigimos
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
            {isInvite ? <Sparkles className="text-white w-8 h-8" /> : <Leaf className="text-white w-8 h-8" />}
          </div>
        </div>

        <CardHeader className="text-center pt-8 pb-2">
          <CardTitle className="text-3xl font-serif text-[#4a3f35]">
            {isInvite ? "Activa tu cuenta" : "Bienvenido de nuevo"}
          </CardTitle>
          <p className="text-[#7a6f64] mt-2">
            {isInvite 
              ? "Establece tu contraseña para acceder a tu espacio" 
              : "Accede a tu espacio personal de bienestar"}
          </p>
        </CardHeader>

        <CardContent className="p-8">
          {isInvite ? (
            /* FORMULARIO MANUAL PARA INVITADOS (EVITA ERRORES DE SUPABASE UI) */
            <form onSubmit={handleSetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pass" className="text-[#4a3f35]">Nueva Contraseña</Label>
                <Input 
                  id="pass"
                  type="password" 
                  placeholder="Mínimo 6 caracteres"
                  className="h-12 bg-[#fdfaf6] border-[#e8e1d5] rounded-xl"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-[#4a3f35]">Confirmar Contraseña</Label>
                <Input 
                  id="confirm"
                  type="password" 
                  placeholder="Repite tu contraseña"
                  className="h-12 bg-[#fdfaf6] border-[#e8e1d5] rounded-xl"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#c17d60] hover:bg-[#a66a51] h-12 rounded-full text-white shadow-lg shadow-[#c17d60]/20"
                disabled={updating}
              >
                {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-4 h-4 mr-2" /> Activar y Entrar</>}
              </Button>
            </form>
          ) : (
            /* LOGIN NORMAL PARA USUARIOS YA REGISTRADOS */
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
                  }
                }
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;