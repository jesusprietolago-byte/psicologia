"use client";

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

// EMAIL DE LA PSICÓLOGA (ADMIN) - ACTUALIZADO
const ADMIN_EMAIL = "jesusprietolago@gmail.com"; 

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const userRole = session.user.email === ADMIN_EMAIL ? 'admin' : 'patient';
        setRole(userRole);
        
        // Asegurar que el perfil existe en la DB
        await supabase.from('profiles').upsert({
          id: session.user.id,
          email: session.user.email,
          role: userRole,
          full_name: session.user.user_metadata.full_name || '',
        });
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setRole(session.user.email === ADMIN_EMAIL ? 'admin' : 'patient');
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    setData();
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);