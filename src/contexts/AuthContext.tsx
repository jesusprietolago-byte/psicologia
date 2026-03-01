import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

type Role = 'admin' | 'patient' | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

const ADMIN_EMAIL = "jesusprietolago@gmail.com"; 

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  const updateProfileInDB = async (currentUser: User) => {
    const userRole = currentUser.email === ADMIN_EMAIL ? 'admin' : 'patient';
    setRole(userRole);
    
    try {
      // Intentamos actualizar el perfil. 
      // Si falla por RLS (ej: el usuario no tiene permiso para actualizarse a sí mismo aún), 
      // el rol en memoria (setRole) sigue siendo válido para la navegación.
      const { error } = await supabase.from('profiles').upsert({
        id: currentUser.id,
        email: currentUser.email,
        role: userRole,
        full_name: currentUser.user_metadata.full_name || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) {
        console.warn("Aviso: No se pudo sincronizar el perfil en DB (posible RLS), pero el rol en memoria es:", userRole);
      }
    } catch (error) {
      console.error("Error crítico actualizando perfil en AuthProvider:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await updateProfileInDB(session.user);
          } else {
            setUser(null);
            setRole(null);
          }
        }
      } catch (error) {
        console.error("Error inicializando sesión:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await updateProfileInDB(session.user);
      } else {
        setUser(null);
        setRole(null);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);