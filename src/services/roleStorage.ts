import { useState, useEffect } from 'react';

export const ROLE_STORAGE_KEY = 'door2life_role_v1';
export const EVENT_ROLE_UPDATED = 'door2life_role_updated';

export type DemoRole = 'Admin' | 'Team Member';

/**
 * Get current demo role from localStorage.
 * Defaults to 'Admin' if not set.
 */
export function getStoredRole(): DemoRole {
  try {
    const raw = localStorage.getItem(ROLE_STORAGE_KEY);
    if (raw === 'Team Member' || raw === 'Admin') {
      return raw;
    }
    return 'Admin';
  } catch {
    return 'Admin';
  }
}

/**
 * Persist selected demo role to localStorage and dispatch custom update event.
 */
export function setStoredRole(role: DemoRole): void {
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_ROLE_UPDATED, { detail: { role } }));
    }
  } catch (error) {
    console.error('Door2Life: Failed to save demo role:', error);
  }
}

/**
 * React hook to access and toggle demo role reactively across all UI components.
 */
export function useDemoRole() {
  const [role, setRole] = useState<DemoRole>(getStoredRole);

  useEffect(() => {
    const handleUpdate = () => {
      setRole(getStoredRole());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_ROLE_UPDATED, handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(EVENT_ROLE_UPDATED, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, []);

  const setDemoRole = (newRole: DemoRole) => {
    setStoredRole(newRole);
    setRole(newRole);
  };

  const isAdmin = role === 'Admin';

  return {
    role,
    isAdmin,
    setDemoRole,
    toggleRole: () => setDemoRole(role === 'Admin' ? 'Team Member' : 'Admin'),
  };
}
