import { useSyncExternalStore } from 'react';
import { supabase } from './supabase';
import type { Role } from './profiles';
import type { Session, User } from '@supabase/supabase-js';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

let globalAuthState: AuthState = {
  session: null,
  user: null,
  loading: true,
};
const listeners = new Set<() => void>();
let initialized = false;
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
  listeners.forEach((listener) => listener());
}

export function setAuth(session: Session | null) {
  globalAuthState = {
    session,
    user: session?.user ?? null,
    loading: false,
  };
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (!initialized) {
    initialized = true;
    void initializeAuth();
    supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session);
    });
  }

  return () => {
    listeners.delete(listener);
  };
}

function getAuthState() {
  return globalAuthState;
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getAuthState, getAuthState);
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
  const { error } = await supabase.auth.signOut();
  if (!error) {
    setAuth(null);
  }
  return { error: error?.message ?? null };
}
