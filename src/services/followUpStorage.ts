import { useState, useEffect } from 'react';
import { getStoredCustomerById } from './customerStorage.ts';

export const FOLLOWUPS_STORAGE_KEY = 'door2life_followups_v1';
export const EVENT_FOLLOWUPS_UPDATED = 'door2life_followups_updated';

export type FollowUpChannel = 'Phone Call' | 'In-Person Visit' | 'Email';
export type FollowUpPriority = 'High' | 'Medium' | 'Normal';
export type FollowUpStatus = 'Due Today' | 'Upcoming' | 'Completed';

export interface FollowUp {
  id: string; // e.g. FU-1001
  customerId: string; // e.g. D2L-1001
  customerName: string;
  customerPhone?: string;
  taskTitle: string;
  dueDate: string; // YYYY-MM-DD format
  dueTime?: string; // HH:mm format (optional)
  channel: FollowUpChannel;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  notes?: string;
  agent?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface FollowUpInput {
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  taskTitle: string;
  dueDate: string;
  dueTime?: string;
  channel: FollowUpChannel;
  priority: FollowUpPriority;
  status?: FollowUpStatus;
  notes?: string;
  agent?: string;
}

/**
 * Safely parse and retrieve all follow-ups from localStorage.
 */
export function getStoredFollowUps(): FollowUp[] {
  try {
    const raw = localStorage.getItem(FOLLOWUPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FollowUp =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.customerId === 'string' &&
        typeof item.taskTitle === 'string'
    );
  } catch (error) {
    console.error('Door2Life: Failed to read follow-ups from localStorage:', error);
    return [];
  }
}

/**
 * Persist follow-ups list to localStorage and dispatch update events.
 */
export function saveFollowUps(followUps: FollowUp[]): boolean {
  try {
    localStorage.setItem(FOLLOWUPS_STORAGE_KEY, JSON.stringify(followUps));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_FOLLOWUPS_UPDATED));
    }
    return true;
  } catch (error) {
    console.error('Door2Life: Failed to save follow-ups to localStorage:', error);
    return false;
  }
}

/**
 * Generate a sequential follow-up ID (e.g. FU-1001).
 */
export function generateFollowUpId(): string {
  const followUps = getStoredFollowUps();
  if (followUps.length === 0) return 'FU-1001';

  const numericIds = followUps
    .map((f) => {
      const match = f.id.match(/^FU-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n) && n > 0);

  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 1000;
  return `FU-${maxId + 1}`;
}

/**
 * Helper to compute status ('Due Today' vs 'Upcoming' vs 'Completed') based on date.
 */
export function computeFollowUpStatus(dueDate: string, explicitStatus?: FollowUpStatus): FollowUpStatus {
  if (explicitStatus === 'Completed') return 'Completed';

  const todayStr = new Date().toISOString().split('T')[0];
  if (dueDate === todayStr) {
    return 'Due Today';
  } else if (dueDate < todayStr) {
    // Overdue tasks are prioritized with Due Today
    return 'Due Today';
  }
  return 'Upcoming';
}

/**
 * Add a new follow-up record linked to a customer.
 */
export function addFollowUp(input: FollowUpInput): { success: boolean; followUp?: FollowUp; error?: string } {
  if (!input.customerId || !input.customerId.trim()) {
    return { success: false, error: 'Customer association is required.' };
  }
  if (!input.taskTitle || !input.taskTitle.trim()) {
    return { success: false, error: 'Follow-up task title is required.' };
  }
  if (!input.dueDate || !input.dueDate.trim()) {
    return { success: false, error: 'Due date is required.' };
  }

  // Resolve customer details if not supplied
  let customerName = input.customerName || '';
  let customerPhone = input.customerPhone || '';
  if (!customerName) {
    const customer = getStoredCustomerById(input.customerId.trim());
    if (customer) {
      customerName = customer.fullName;
      customerPhone = customer.primaryContact;
    } else {
      customerName = `Customer ${input.customerId}`;
    }
  }

  const status = computeFollowUpStatus(input.dueDate.trim(), input.status);
  const now = new Date().toISOString();

  const newFollowUp: FollowUp = {
    id: generateFollowUpId(),
    customerId: input.customerId.trim(),
    customerName,
    customerPhone: customerPhone || undefined,
    taskTitle: input.taskTitle.trim(),
    dueDate: input.dueDate.trim(),
    dueTime: input.dueTime?.trim() || undefined,
    channel: input.channel || 'Phone Call',
    priority: input.priority || 'Normal',
    status,
    notes: input.notes?.trim() || undefined,
    agent: input.agent?.trim() || 'Lead Admin',
    createdAt: now,
    updatedAt: now,
  };

  const followUps = getStoredFollowUps();
  const updated = [newFollowUp, ...followUps];
  const saved = saveFollowUps(updated);

  if (!saved) {
    return { success: false, error: 'Failed to save follow-up to localStorage.' };
  }
  return { success: true, followUp: newFollowUp };
}

/**
 * Update an existing follow-up.
 */
export function updateFollowUp(
  id: string,
  updates: Partial<Omit<FollowUp, 'id' | 'createdAt'>>
): { success: boolean; followUp?: FollowUp; error?: string } {
  const followUps = getStoredFollowUps();
  const index = followUps.findIndex((f) => f.id === id);
  if (index === -1) {
    return { success: false, error: `Follow-up ${id} was not found.` };
  }

  const existing = followUps[index];
  const updatedDueDate = updates.dueDate !== undefined ? updates.dueDate : existing.dueDate;
  const updatedStatus = updates.status !== undefined
    ? updates.status
    : computeFollowUpStatus(updatedDueDate, existing.status);

  const updatedItem: FollowUp = {
    ...existing,
    ...updates,
    dueDate: updatedDueDate,
    status: updatedStatus,
    updatedAt: new Date().toISOString(),
    completedAt: updatedStatus === 'Completed' ? existing.completedAt || new Date().toISOString() : undefined,
  };

  followUps[index] = updatedItem;
  const saved = saveFollowUps(followUps);
  return { success: saved, followUp: updatedItem, error: saved ? undefined : 'Failed to update follow-up.' };
}

/**
 * Mark a follow-up as completed.
 */
export function completeFollowUp(id: string): boolean {
  const result = updateFollowUp(id, {
    status: 'Completed',
    completedAt: new Date().toISOString(),
  });
  return result.success;
}

/**
 * Delete a follow-up.
 */
export function deleteFollowUp(id: string): boolean {
  const followUps = getStoredFollowUps();
  const filtered = followUps.filter((f) => f.id !== id);
  if (filtered.length === followUps.length) return false;
  return saveFollowUps(filtered);
}

/**
 * Retrieve all follow-ups linked to a specific customer ID.
 */
export function getFollowUpsByCustomerId(customerId: string): FollowUp[] {
  const followUps = getStoredFollowUps();
  return followUps.filter((f) => f.customerId === customerId);
}

/**
 * React hook to stay reactively in sync with follow-ups across all views.
 */
export function useFollowUps() {
  const [followUps, setFollowUps] = useState<FollowUp[]>(getStoredFollowUps);

  useEffect(() => {
    const handleUpdate = () => {
      setFollowUps(getStoredFollowUps());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_FOLLOWUPS_UPDATED, handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(EVENT_FOLLOWUPS_UPDATED, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, []);

  const pendingCount = followUps.filter((f) => f.status !== 'Completed').length;
  const dueTodayCount = followUps.filter((f) => f.status === 'Due Today').length;

  return {
    followUps,
    totalCount: followUps.length,
    pendingCount,
    dueTodayCount,
    refresh: () => setFollowUps(getStoredFollowUps()),
  };
}
