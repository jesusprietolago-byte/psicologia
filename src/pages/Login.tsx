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
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Leaf, ArrowLeft, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const Login = () => {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isInvite, setIsInvite] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      console.log("Detectado hash en Login:", hash);
      if (hash && (hash.includes("type=invite") || hash.includes("type=recovery") || hash.includes("access_token="))) {
        setIsInvite(true);
      }
    };

    checkHash();
    // También escuchamos cambios en el hash por si acaso
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
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
      // Intentamos actualizar la contraseña del usuario actual (que debería tener sesión por el hash)
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;
      
      showSuccess("¡Contraseña establecida con éxito!");
      setIsSuccess(true);
      
      // Limpiamos el hash de la URL para evitar bucles
      window.location.hash = "";
      
      // Pequeña pausa para que el usuario vea el éxito antes de redirigir
      setTimeout(() => {
        navigate(role === 'admin' ? '/admin' : '/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error("Error actualizando contraseña:", error);
      showError("No se pudo establecer la contraseña: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfaf6]">
      <Loader2 className="w-10 h-10 animate-spin text-[#c17d60]" />
    </div>
  );

  // Si ya está logueado y NO estamos en proceso de invitación/éxito, redirigimos
  if (user && !isInvite && !isSuccess) {
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
                  autoComplete="new-password"
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
                  autoComplete="new-password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#c17d60] hover:bg-[#a66a51] h-12 rounded-full text-white shadow-lg shadow-[#c17d60]/20"
                disabled={updating}
              >
                {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-4 h-4 mr-2" /> Activar y Entrar</>}
              </Button>
              <p className="text-xs text-center text-[#7a6f64] px-4">
                Al hacer clic en activar, tu cuenta quedará vinculada a este correo y podrás acceder a tu panel.
              </p>
            </form>
          ) : (
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