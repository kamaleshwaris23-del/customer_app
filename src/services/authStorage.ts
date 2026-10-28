import { useState, useEffect } from 'react';
import { setStoredRole, getStoredRole, type DemoRole } from './roleStorage.ts';
import { getStoredTeamMembers } from './teamStorage.ts';

export const AUTH_STORAGE_KEY = 'door2life_session_v1';
export const EVENT_AUTH_UPDATED = 'door2life_auth_updated';

export interface AuthUser {
  email: string;
  name: string;
  role: DemoRole;
  loginTime: string;
  authType: 'local-session';
}

/**
 * Demo Admin credentials for development and local testing only.
 * IMPORTANT: This demo login is strictly for local testing and offline prototype evaluation.
 * It is NOT secure authentication for a production deployment.
 */
export const DEMO_ADMIN_CREDENTIALS = {
  email: 'admin@door2life.local',
  password: 'D2L-Demo-2026!',
  name: 'Sarah Jenkins',
  role: 'Admin' as DemoRole,
};

/**
 * Known system credentials for local demo/testing authentication.
 */
const SYSTEM_CREDENTIALS: Record<string, { password: string[]; name: string; role: DemoRole }> = {
  'admin@door2life.local': {
    password: ['D2L-Demo-2026!', 'demo1234', 'admin123', 'door2life2026'],
    name: 'Sarah Jenkins',
    role: 'Admin',
  },
  'operator@door2life.local': {
    password: ['D2L-Demo-2026!', 'demo1234', 'door2life2026'],
    name: 'Field Operator',
    role: 'Team Member',
  },
};

/**
 * Check whether real Google OAuth or external provider is configured.
 */
export function isGoogleOAuthAvailable(): boolean {
  try {
    const supabaseUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : undefined;
    const supabaseKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : undefined;
    const googleClientId = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GOOGLE_CLIENT_ID : undefined;
    return Boolean((supabaseUrl && supabaseKey) || googleClientId);
  } catch {
    return false;
  }
}

/**
 * Handle Google authentication attempt.
 * Does not simulate authentication or create a fake session when real OAuth is not configured.
 */
export function authenticateWithGoogle(): { success: boolean; session?: AuthUser; error?: string } {
  if (!isGoogleOAuthAvailable()) {
    return {
      success: false,
      error: 'Google authentication is not configured. Setup with an authentication provider is required.',
    };
  }

  return {
    success: false,
    error: 'Google OAuth provider initialization failed.',
  };
}

/**
 * Authenticate user with email and password credentials.
 * Rejects arbitrary credentials.
 */
export function authenticateWithCredentials(
  emailInput: string,
  passwordInput: string
): { success: boolean; session?: AuthUser; error?: string } {
  const email = (emailInput || '').trim().toLowerCase();
  const password = (passwordInput || '').trim();

  if (!email || !password) {
    return {
      success: false,
      error: 'Please enter both email and password.',
    };
  }

  // 1. Check system default credentials
  const systemAccount = SYSTEM_CREDENTIALS[email];
  if (systemAccount) {
    if (!systemAccount.password.includes(password)) {
      return {
        success: false,
        error: 'Invalid email or password. Please check your credentials and try again.',
      };
    }
    const session = loginLocalSession(email, systemAccount.name, systemAccount.role);
    return { success: true, session };
  }

  // 2. Check registered team members from teamStorage
  try {
    const teamMembers = getStoredTeamMembers();
    const matchingMember = teamMembers.find(
      (m) => m.email.trim().toLowerCase() === email
    );

    if (matchingMember) {
      if (matchingMember.status === 'Inactive') {
        return {
          success: false,
          error: 'This account has been deactivated. Please contact your system administrator.',
        };
      }

      if (password === 'demo1234' || password === 'door2life2026') {
        const role: DemoRole = matchingMember.role.toLowerCase().includes('admin')
          ? 'Admin'
          : 'Team Member';
        const session = loginLocalSession(matchingMember.email, matchingMember.name, role);
        return { success: true, session };
      }

      return {
        success: false,
        error: 'Invalid email or password. Please check your credentials and try again.',
      };
    }
  } catch {
    // Continue to rejection
  }

  // 3. Reject any arbitrary / unregistered credentials
  return {
    success: false,
    error: 'Invalid email or password. Please check your credentials and try again.',
  };
}

/**
 * Backend authentication architectural requirements for production deployment.
 */
export const AUTH_BACKEND_REQUIREMENTS = {
  architectureStatus: 'Offline LocalStorage Prototype Mode',
  summary:
    'Door2Life currently runs as a client-side offline application with data persisted exclusively in browser LocalStorage. No remote backend or secure authentication service is currently attached.',
  productionPrerequisites: [
    {
      title: 'Backend Auth Provider',
      description:
        'A dedicated server-side authentication service (e.g. Supabase Auth, Firebase Auth, Auth0, or custom OAuth 2.0 / OIDC API) is required to authenticate user credentials securely.',
    },
    {
      title: 'Cryptographic Hashing & Secure Tokens',
      description:
        'Passwords must be salted and hashed on the server (bcrypt/Argon2id). Sessions must be maintained via signed HTTP-only secure cookies or short-lived JWT tokens with rotating refresh tokens.',
    },
    {
      title: 'Database Row Level Security (RLS)',
      description:
        'Server-side access control policies must be enforced at the database layer so users can only access records permitted by their verified identity.',
    },
    {
      title: 'Network & API Transport Security',
      description:
        'Encrypted HTTPS transport, CORS restriction, and rate limiting against brute-force attacks must be configured on the server endpoints.',
    },
  ],
};

/**
 * Retrieve current active local session from localStorage.
 */
export function getStoredSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === 'string' && (parsed.role === 'Admin' || parsed.role === 'Team Member')) {
      return parsed as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check whether a valid local session is currently active.
 */
export function isAuthenticated(): boolean {
  return getStoredSession() !== null;
}

/**
 * Establish a local session with specified credentials and role.
 */
export function loginLocalSession(
  email = 'admin@door2life.local',
  name = 'Sarah Jenkins',
  role: DemoRole = 'Admin'
): AuthUser {
  const session: AuthUser = {
    email: email.trim() || 'admin@door2life.local',
    name: name.trim() || (role === 'Admin' ? 'Sarah Jenkins' : 'Field Operator'),
    role,
    loginTime: new Date().toISOString(),
    authType: 'local-session',
  };

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    // Synchronize selected role with roleStorage
    setStoredRole(role);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_AUTH_UPDATED, { detail: { session } }));
    }
  } catch (error) {
    console.error('Door2Life: Failed to persist auth session:', error);
  }

  return session;
}

/**
 * Terminate the current local session and remove the session token.
 */
export function logoutLocalSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_AUTH_UPDATED, { detail: { session: null } }));
    }
  } catch (error) {
    console.error('Door2Life: Failed to clear auth session:', error);
  }
}

/**
 * React hook to reactively track authentication state and perform login/logout.
 */
export function useAuth() {
  const [session, setSession] = useState<AuthUser | null>(getStoredSession);

  useEffect(() => {
    const handleUpdate = () => {
      setSession(getStoredSession());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_AUTH_UPDATED, handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(EVENT_AUTH_UPDATED, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, []);

  return {
    session,
    isAuthenticated: session !== null,
    user: session,
    role: session?.role ?? getStoredRole(),
    login: loginLocalSession,
    logout: logoutLocalSession,
  };
}
