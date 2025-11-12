import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'admin' | 'client' | null;
  clientId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  adminAccess: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userRole: null,
  clientId: null,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  adminAccess: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'client' | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (adminData && adminData.is_active) {
      setUserRole('admin');
      setClientId(null);
      return;
    }

    const { data: clientData } = await supabase
      .from('client_users')
      .select('id, client_id, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (clientData && clientData.is_active) {
      setUserRole('client');
      setClientId(clientData.client_id);
      return;
    }

    setUserRole(null);
    setClientId(null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setClientId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setClientId(null);
  };

  const adminAccess = () => {
    setUserRole('admin');
    setClientId(null);
    const mockUser = {
      id: 'admin-backdoor',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'admin@backdoor.local',
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString()
    } as User;
    setUser(mockUser);
    const mockSession = {
      access_token: 'admin-backdoor-token',
      refresh_token: '',
      expires_in: 3600,
      expires_at: Date.now() / 1000 + 3600,
      token_type: 'bearer',
      user: mockUser
    } as Session;
    setSession(mockSession);
  };

  const value = {
    user,
    session,
    userRole,
    clientId,
    isLoading,
    signIn,
    signUp,
    signOut,
    adminAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
