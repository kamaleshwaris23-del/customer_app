import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';
import type { AuditLog, AuditAction, UserRole } from '../types/auth.ts';

export const AUDIT_STORAGE_KEY = 'door2life_audit_logs_v1';
export const EVENT_AUDIT_UPDATED = 'door2life_audit_updated';

/**
 * Safely parse local audit logs
 */
export function getStoredAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AuditLog[]) : [];
  } catch {
    return [];
  }
}

/**
 * Clear all local audit logs (e.g. testing or reset)
 */
export function clearAuditLogs(): void {
  try {
    localStorage.removeItem(AUDIT_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_AUDIT_UPDATED, { detail: null }));
    }
  } catch {
    // Ignore
  }
}

/**
 * Record a new audit log entry
 */
export async function recordAuditLog(entry: {
  userId?: string;
  userEmail?: string;
  userRole?: UserRole;
  actor?: { id?: string; email?: string; name?: string; role?: UserRole };
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}): Promise<AuditLog> {
  const logItem: AuditLog = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: entry.userId || entry.actor?.id,
    user_email: entry.userEmail || entry.actor?.email,
    user_role: entry.userRole || entry.actor?.role,
    actor_name: entry.actor?.name,
    actor_role: entry.actor?.role,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    details: entry.details,
    created_at: new Date().toISOString(),
  };

  // 1. If Supabase is configured, write to audit_logs table
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('audit_logs').insert([logItem]);
    } catch (err) {
      console.warn('Door2Life: Supabase audit log insert failed:', err);
    }
  }

  // 2. Also record to local store for reliability and fast UI feedback
  try {
    const current = getStoredAuditLogs();
    const updated = [logItem, ...current].slice(0, 500); // retain last 500
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_AUDIT_UPDATED, { detail: { log: logItem } }));
    }
  } catch (err) {
    console.error('Door2Life: Failed to save audit log locally:', err);
  }

  return logItem;
}

/**
 * Hook to fetch and listen to audit logs (Super Admin views all, others view their own)
 */
export function useAuditLogs(currentUserRole?: UserRole | null, currentUserId?: string) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
        // If not super_admin, filter to own records
        if (currentUserRole !== 'super_admin' && currentUserId) {
          query = query.eq('user_id', currentUserId);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          setLogs(data as AuditLog[]);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Door2Life: Supabase audit log query failed, using local store:', err);
      }
    }

    // Local fallback
    const local = getStoredAuditLogs();
    if (currentUserRole !== 'super_admin' && currentUserId) {
      setLogs(local.filter((l) => l.user_id === currentUserId));
    } else {
      setLogs(local);
    }
    setLoading(false);
  }, [currentUserRole, currentUserId]);

  useEffect(() => {
    fetchLogs();

    const handleUpdate = () => {
      fetchLogs();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_AUDIT_UPDATED, handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(EVENT_AUDIT_UPDATED, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [fetchLogs]);

  return { logs, loading, refreshLogs: fetchLogs };
}
