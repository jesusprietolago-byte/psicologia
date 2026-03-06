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

// Lista de correos con acceso de administrador
const ADMIN_EMAILS = [
  "jesusprietolago@gmail.com",
  "laprila88@hotmail.com"
]; 

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  const handleUserSession = async (currentUser: User | null) => {
    if (!currentUser) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    const userRole = ADMIN_EMAILS.includes(currentUser.email || '') ? 'admin' : 'patient';
    setUser(currentUser);
    setRole(userRole);
    setLoading(false);

    // Sincronizar perfil en background
    try {
      await supabase.from('profiles').upsert({
        id: currentUser.id,
        email: currentUser.email,
        role: userRole,
        full_name: currentUser.user_metadata.full_name || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn("Sync perfil falló (normal si es RLS), continuando...");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session?.user || null);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);