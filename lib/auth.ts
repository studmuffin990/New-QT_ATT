import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { Role } from './profiles';
import type { Session, User } from '@supabase/supabase-js';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

let globalSession: Session | null = null;
let globalUser: User | null = null;
let globalLoading = true;
let listeners: Set<() => void> = new Set();
let initialized = false;
let authSubscription: { unsubscribe: () => void } | null = null;
const AUTH_INIT_TIMEOUT_MS = 3000;

async function initializeAuth() {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), AUTH_INIT_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([
      supabase.auth.getSession().then(({ data }) => data.session),
      timeout,
    ]);
    setAuth(result);
  } catch {
    setAuth(null);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function notify() {
  listeners.forEach((l) => l());
}

export function setAuth(session: Session | null) {
  globalSession = session;
  globalUser = session?.user ?? null;
  globalLoading = false;
  notify();
}

export function useAuth(): AuthState {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => forceRender((n) => n + 1);
    listeners.add(listener);

    if (!initialized) {
      initialized = true;
      void initializeAuth();
    }

    if (!authSubscription) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuth(session);
      });
      authSubscription = data.subscription;
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    session: globalSession,
    user: globalUser,
    loading: globalLoading,
  };
}

export type SignUpProfile = {
  full_name: string;
  role: Role;
};

export async function signUp(
  email: string,
  password: string,
  profile?: SignUpProfile
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: profile
      ? {
          data: {
            full_name: profile.full_name,
            role: profile.role,
          },
        }
      : undefined,
  });
  if (!error && data.session && profile) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', data.session.user.id);

    if (profileError) {
      return { data, error: profileError };
    }
  }
  if (!error && data.session) {
    setAuth(data.session);
  }
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error && data.user) {
    const metadataRole = data.user.user_metadata?.role;
    const metadataName = data.user.user_metadata?.full_name;
    if (metadataRole === 'student' || metadataRole === 'teacher') {
      await supabase
        .from('profiles')
        .update({
          role: metadataRole,
          ...(typeof metadataName === 'string' && metadataName.trim()
            ? { full_name: metadataName.trim() }
            : {}),
        })
        .eq('id', data.user.id);
    }
  }
  if (!error && data.session) {
    setAuth(data.session);
  }
  return { data, error };
}

export async function signOut() {
  setAuth(null);
  supabase.auth.signOut().catch(() => {});
  return { error: null };
}
