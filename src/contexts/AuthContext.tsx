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

  const updateProfile = async (currentUser: User) => {
    const userRole = currentUser.email === ADMIN_EMAIL ? 'admin' : 'patient';
    setRole(userRole);
    
    try {
      // Intentamos actualizar el perfil. Si falla por RLS, al menos tenemos el rol en memoria.
      await supabase.from('profiles').upsert({
        id: currentUser.id,
        email: currentUser.email,
        role: userRole,
        full_name: currentUser.user_metadata.full_name || '',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (error) {
      console.error("Error updating profile in AuthProvider:", error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted && session?.user) {
          setUser(session.user);
          await updateProfile(session.user);
        }
      } catch (error) {
        console.error("Error initializing session:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await updateProfile(session.user);
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
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);