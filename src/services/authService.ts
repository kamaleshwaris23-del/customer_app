import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import type { UserProfile, UserRole, UserStatus } from '../types/auth.ts';
import { isSuperAdmin } from '../types/auth.ts';
import { recordAuditLog } from './auditStorage.ts';

export const AUTH_SESSION_KEY = 'door2life_auth_session_v2';
export const LOCAL_PROFILES_KEY = 'door2life_profiles_v2';
export const EVENT_RBAC_AUTH_UPDATED = 'door2life_rbac_auth_updated';

export interface AuthSession {
  user: UserProfile;
  provider: 'supabase' | 'local';
  loginTime: string;
}

/**
 * Initial Default Accounts for Local/Offline Mode & Testing
 */
const DEFAULT_LOCAL_PROFILES: UserProfile[] = [
  {
    id: 'usr_super_admin_001',
    full_name: 'System Super Admin',
    email: 'superadmin@door2life.local',
    role: 'super_admin',
    status: 'active',
    created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
  {
    id: 'usr_admin_002',
    full_name: 'Sarah Jenkins',
    email: 'admin@door2life.local',
    role: 'admin',
    status: 'active',
    created_at: new Date('2026-01-02T00:00:00Z').toISOString(),
  },
  {
    id: 'usr_team_003',
    full_name: 'Field Operator',
    email: 'operator@door2life.local',
    role: 'team_member',
    status: 'active',
    created_at: new Date('2026-01-03T00:00:00Z').toISOString(),
  },
  {
    id: 'usr_inactive_004',
    full_name: 'Deactivated User',
    email: 'deactivated@door2life.local',
    role: 'team_member',
    status: 'inactive',
    created_at: new Date('2026-01-04T00:00:00Z').toISOString(),
  },
];

const LOCAL_CREDENTIALS: Record<string, string[]> = {
  'superadmin@door2life.local': ['D2L-Super-2026!', 'superadmin123'],
  'admin@door2life.local': ['D2L-Demo-2026!', 'demo1234', 'admin123', 'door2life2026'],
  'operator@door2life.local': ['D2L-Demo-2026!', 'demo1234', 'door2life2026'],
  'deactivated@door2life.local': ['D2L-Demo-2026!', 'demo1234'],
};

/**
 * Retrieve local profiles registry
 */
export function getLocalProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(DEFAULT_LOCAL_PROFILES));
      return DEFAULT_LOCAL_PROFILES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_LOCAL_PROFILES;
  } catch {
    return DEFAULT_LOCAL_PROFILES;
  }
}

/**
 * Save local profiles registry
 */
export function saveLocalProfiles(profiles: UserProfile[]): void {
  try {
    localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(profiles));
  } catch (err) {
    console.error('Door2Life: Failed to save local profiles:', err);
  }
}

/**
 * Get current stored session
 */
export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (parsed && parsed.user && parsed.user.id && parsed.user.role && parsed.user.status === 'active') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist session and broadcast update
 */
export function setStoredSession(session: AuthSession | null): void {
  try {
    if (session) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_RBAC_AUTH_UPDATED, { detail: { session } }));
    }
  } catch (err) {
    console.error('Door2Life: Failed to set auth session:', err);
  }
}

/**
 * Core Login Function
 * Connects to Supabase Auth when configured, falls back to secure local RBAC engine
 */
export async function loginWithCredentials(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; session?: AuthSession; user?: UserProfile; error?: string }> {
  const email = (emailInput || '').trim().toLowerCase();
  const password = (passwordInput || '').trim();

  if (!email || !password) {
    return { success: false, error: 'Please enter both email and password.' };
  }

  // 1. Supabase Authentication path if configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        return { success: false, error: error?.message || 'Invalid email or password.' };
      }

      // Query secure profiles table for user role & status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profileData) {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'User profile not found in database. Contact your system administrator.',
        };
      }

      const profile = profileData as UserProfile;

      // Check account status
      if (profile.status === 'inactive') {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Your account has been deactivated. Please contact your system administrator.',
        };
      }

      const session: AuthSession = {
        user: profile,
        provider: 'supabase',
        loginTime: new Date().toISOString(),
      };

      setStoredSession(session);
      await recordAuditLog({
        userId: profile.id,
        userEmail: profile.email,
        userRole: profile.role,
        action: 'login',
        entityType: 'session',
        entityId: profile.id,
        details: { provider: 'supabase' },
      });

      return { success: true, session, user: session.user };
    } catch (err) {
      console.error('Door2Life: Supabase authentication error:', err);
      return { success: false, error: 'Authentication service encountered an unexpected error.' };
    }
  }

  // 2. Local RBAC Authentication Engine (for offline, local demo, and automated test runners)
  const profiles = getLocalProfiles();
  const matchedProfile = profiles.find((p) => p.email.toLowerCase() === email);

  if (!matchedProfile) {
    return { success: false, error: 'Invalid email or password. Please check your credentials.' };
  }

  if (matchedProfile.status === 'inactive') {
    return {
      success: false,
      error: 'Your account has been deactivated. Please contact your system administrator.',
    };
  }

  const validPasswords = LOCAL_CREDENTIALS[email] || ['D2L-Demo-2026!', 'demo1234'];
  if (!validPasswords.includes(password)) {
    return { success: false, error: 'Invalid email or password. Please check your credentials.' };
  }

  const session: AuthSession = {
    user: matchedProfile,
    provider: 'local',
    loginTime: new Date().toISOString(),
  };

  setStoredSession(session);
  await recordAuditLog({
    userId: matchedProfile.id,
    userEmail: matchedProfile.email,
    userRole: matchedProfile.role,
    action: 'login',
    entityType: 'session',
    entityId: matchedProfile.id,
    details: { provider: 'local' },
  });

  return { success: true, session, user: session.user };
}

/**
 * Logout Function
 */
export async function logout(): Promise<void> {
  const current = getStoredSession();
  if (current && current.user) {
    await recordAuditLog({
      userId: current.user.id,
      userEmail: current.user.email,
      userRole: current.user.role,
      action: 'logout',
      entityType: 'session',
      entityId: current.user.id,
      details: { provider: current.provider },
    });
  }

  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Door2Life: Supabase signOut warning:', err);
    }
  }

  setStoredSession(null);
}

/**
 * Super Admin One-Time Bootstrap
 * Grants initial super_admin to the caller ONLY if 0 super_admins exist in the database/system.
 * Once a super_admin exists, this function locks forever.
 */
export async function bootstrapInitialSuperAdmin(
  targetOrInput?: string | { email?: string; password?: string; fullName?: string }
): Promise<{ success: boolean; profile?: UserProfile; user?: UserProfile; error?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('bootstrap_initial_super_admin');
      if (error) {
        return { success: false, error: error.message };
      }
      const profile = (data as any)?.profile;
      return { success: true, profile, user: profile };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Bootstrap failed.' };
    }
  }

  // Local Engine Bootstrap
  const profiles = getLocalProfiles();
  const superCount = profiles.filter((p) => p.role === 'super_admin').length;
  if (superCount > 0) {
    return {
      success: false,
      error: 'A Super Admin account is already configured. Bootstrap is strictly one-time.',
    };
  }

  if (typeof targetOrInput === 'object' && targetOrInput !== null) {
    const cleanEmail = (targetOrInput.email || 'superadmin@door2life.local').trim().toLowerCase();
    const cleanName = (targetOrInput.fullName || 'System Super Admin').trim();
    const newProfile: UserProfile = {
      id: `usr_super_${Date.now()}`,
      full_name: cleanName,
      email: cleanEmail,
      role: 'super_admin',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    profiles.push(newProfile);
    if (targetOrInput.password) {
      LOCAL_CREDENTIALS[cleanEmail] = [targetOrInput.password];
    }
    saveLocalProfiles(profiles);
    return { success: true, profile: newProfile, user: newProfile };
  }

  const targetUserId = targetOrInput;
  const userIndex = profiles.findIndex((p) => p.id === targetUserId);
  if (userIndex === -1) {
    return { success: false, error: 'User profile not found.' };
  }

  profiles[userIndex].role = 'super_admin';
  profiles[userIndex].status = 'active';
  profiles[userIndex].updated_at = new Date().toISOString();
  saveLocalProfiles(profiles);

  return { success: true, profile: profiles[userIndex], user: profiles[userIndex] };
}

/**
 * Create a new user account (Only Super Admin permitted)
 */
export async function createUserBySuperAdmin(
  caller: UserRole | { role: UserRole; id?: string },
  input: {
    fullName: string;
    email: string;
    password?: string;
    role: UserRole;
  }
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const callerRole = typeof caller === 'object' && caller !== null ? caller.role : caller;
  if (!isSuperAdmin(callerRole)) {
    return {
      success: false,
      error: 'Permission Denied: Only Super Admin can create accounts and assign roles.',
    };
  }

  const cleanEmail = input.email.trim().toLowerCase();
  const cleanName = input.fullName.trim();

  if (!cleanEmail || !cleanName) {
    return { success: false, error: 'Full name and email are required.' };
  }

  if (isSupabaseConfigured()) {
    try {
      // In Supabase, call signup or admin API
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: input.password || 'Door2Life!2026',
        options: {
          data: { full_name: cleanName },
        },
      });

      if (authError || !authData.user) {
        return { success: false, error: authError?.message || 'Failed to create user in auth.' };
      }

      // Upsert profile with specified role
      const newProfile: UserProfile = {
        id: authData.user.id,
        full_name: cleanName,
        email: cleanEmail,
        role: input.role,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase.from('profiles').upsert([newProfile]);
      if (profileError) {
        return { success: false, error: profileError.message };
      }

      await recordAuditLog({
        action: 'user_create',
        entityType: 'profiles',
        entityId: newProfile.id,
        details: { email: cleanEmail, role: input.role },
      });

      return { success: true, user: newProfile };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'User creation failed.' };
    }
  }

  // Local Engine
  const profiles = getLocalProfiles();
  if (profiles.some((p) => p.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: `An account with email "${cleanEmail}" already exists.` };
  }

  const newProfile: UserProfile = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    full_name: cleanName,
    email: cleanEmail,
    role: input.role,
    status: 'active',
    created_at: new Date().toISOString(),
  };

  profiles.push(newProfile);
  LOCAL_CREDENTIALS[cleanEmail] = [input.password || 'D2L-Demo-2026!'];
  saveLocalProfiles(profiles);

  await recordAuditLog({
    action: 'user_create',
    entityType: 'profiles',
    entityId: newProfile.id,
    details: { email: cleanEmail, role: input.role },
  });

  return { success: true, user: newProfile };
}

/**
 * Change a user's role (Only Super Admin permitted, users cannot change own role)
 */
export async function updateUserRole(
  caller: UserRole | { role: UserRole; id?: string },
  callerIdOrTargetId: string,
  targetUserIdOrRole: string | UserRole,
  possibleRole?: UserRole
): Promise<{ success: boolean; error?: string }> {
  let callerRole: UserRole;
  let callerId: string;
  let targetUserId: string;
  let newRole: UserRole;

  if (typeof caller === 'object' && caller !== null) {
    callerRole = caller.role;
    callerId = caller.id || '';
    targetUserId = callerIdOrTargetId;
    newRole = targetUserIdOrRole as UserRole;
  } else {
    callerRole = caller;
    callerId = callerIdOrTargetId;
    targetUserId = targetUserIdOrRole as string;
    newRole = possibleRole as UserRole;
  }

  if (!isSuperAdmin(callerRole)) {
    return {
      success: false,
      error: 'Permission Denied: Only Super Admin can change user roles.',
    };
  }

  if (callerId === targetUserId) {
    return {
      success: false,
      error: 'Security Policy: You cannot modify your own Super Admin role.',
    };
  }

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', targetUserId);

      if (error) return { success: false, error: error.message };

      await recordAuditLog({
        userId: callerId,
        userRole: callerRole,
        action: 'user_role_change',
        entityType: 'profiles',
        entityId: targetUserId,
        details: { newRole },
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Role update failed.' };
    }
  }

  // Local Engine
  const profiles = getLocalProfiles();
  const target = profiles.find((p) => p.id === targetUserId);
  if (!target) return { success: false, error: 'User profile not found.' };

  target.role = newRole;
  target.updated_at = new Date().toISOString();
  saveLocalProfiles(profiles);

  await recordAuditLog({
    userId: callerId,
    userRole: callerRole,
    action: 'user_role_change',
    entityType: 'profiles',
    entityId: targetUserId,
    details: { newRole },
  });

  return { success: true };
}

/**
 * Toggle user status (Activate / Deactivate) — Only Super Admin permitted
 */
export async function updateUserStatus(
  caller: UserRole | { role: UserRole; id?: string },
  callerIdOrTargetId: string,
  targetUserIdOrStatus: string | UserStatus,
  possibleStatus?: UserStatus
): Promise<{ success: boolean; error?: string }> {
  let callerRole: UserRole;
  let callerId: string;
  let targetUserId: string;
  let newStatus: UserStatus;

  if (typeof caller === 'object' && caller !== null) {
    callerRole = caller.role;
    callerId = caller.id || '';
    targetUserId = callerIdOrTargetId;
    newStatus = targetUserIdOrStatus as UserStatus;
  } else {
    callerRole = caller;
    callerId = callerIdOrTargetId;
    targetUserId = targetUserIdOrStatus as string;
    newStatus = possibleStatus as UserStatus;
  }

  if (!isSuperAdmin(callerRole)) {
    return {
      success: false,
      error: 'Permission Denied: Only Super Admin can activate or deactivate accounts.',
    };
  }

  if (callerId === targetUserId) {
    return {
      success: false,
      error: 'Security Policy: You cannot deactivate your own account.',
    };
  }

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', targetUserId);

      if (error) return { success: false, error: error.message };

      await recordAuditLog({
        userId: callerId,
        userRole: callerRole,
        action: newStatus === 'active' ? 'user_activate' : 'user_deactivate',
        entityType: 'profiles',
        entityId: targetUserId,
        details: { newStatus },
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Status update failed.' };
    }
  }

  // Local Engine
  const profiles = getLocalProfiles();
  const target = profiles.find((p) => p.id === targetUserId);
  if (!target) return { success: false, error: 'User profile not found.' };

  target.status = newStatus;
  target.updated_at = new Date().toISOString();
  saveLocalProfiles(profiles);

  await recordAuditLog({
    userId: callerId,
    userRole: callerRole,
    action: newStatus === 'active' ? 'user_activate' : 'user_deactivate',
    entityType: 'profiles',
    entityId: targetUserId,
    details: { newStatus },
  });

  return { success: true };
}

/**
 * Fetch all profiles (Super Admin and Admin operational view)
 */
export async function fetchProfiles(): Promise<UserProfile[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
      if (!error && Array.isArray(data)) {
        return data as UserProfile[];
      }
    } catch (err) {
      console.warn('Door2Life: Supabase profiles query failed, falling back:', err);
    }
  }
  return getLocalProfiles();
}

/**
 * React Hook for Authentication & RBAC Session
 */
export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(getStoredSession);
  const [loading, _setLoading] = useState(false);

  const refreshSession = useCallback(() => {
    setSession(getStoredSession());
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      refreshSession();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_RBAC_AUTH_UPDATED, handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(EVENT_RBAC_AUTH_UPDATED, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [refreshSession]);

  const user = session?.user || null;
  const role: UserRole | null = user?.role || null;
  const isAuthenticated = session !== null && user !== null && user.status === 'active';

  return {
    session,
    user,
    role,
    isAuthenticated,
    loading,
    isSuperAdmin: role === 'super_admin',
    isAdmin: role === 'admin',
    isTeamMember: role === 'team_member',
    login: loginWithCredentials,
    logout,
    refreshSession,
  };
}
