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

  // Función para determinar el rol de forma inmediata y sincronizar en segundo plano
  const handleUserSession = async (currentUser: User | null) => {
    if (!currentUser) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    // 1. Determinamos el rol inmediatamente por el email (sin esperar a la DB)
    const userRole = currentUser.email === ADMIN_EMAIL ? 'admin' : 'patient';
    
    setUser(currentUser);
    setRole(userRole);
    
    // 2. Marcamos como "cargado" YA. No esperamos a la base de datos.
    setLoading(false);

    // 3. Sincronizamos con la DB en segundo plano (background)
    // Si falla, no bloqueamos al usuario.
    try {
      supabase.from('profiles').upsert({
        id: currentUser.id,
        email: currentUser.email,
        role: userRole,
        full_name: currentUser.user_metadata.full_name || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' }).then(({ error }) => {
        if (error) console.warn("Sincronización de perfil en background falló (RLS), pero el usuario puede continuar.");
      });
    } catch (e) {
      console.error("Error silencioso en sync de perfil:", e);
    }
  };

  useEffect(() => {
    // Inicializar sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session?.user || null);
    }).catch(() => {
      setLoading(false);
    });

    // Escuchar cambios de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserSession(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setRole(null);
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