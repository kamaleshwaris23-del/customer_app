import { useState, useEffect } from 'react';

export const TEAM_STORAGE_KEY = 'door2life_team_v1';
export const EVENT_TEAM_UPDATED = 'door2life_team_updated';

export type TeamMemberStatus = 'Active' | 'On Field' | 'Inactive';

export interface TeamMember {
  id: string; // e.g. TM-01
  name: string;
  role: string;
  email: string;
  phone: string;
  initials: string;
  status: TeamMemberStatus;
  customersHandled: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberInput {
  name: string;
  role: string;
  email: string;
  phone: string;
  status?: TeamMemberStatus;
}

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'TM-01',
    name: 'Sarah Jenkins',
    role: 'Platform Administrator',
    email: 'sarah.j@door2life.io',
    phone: '+91 98765 00001',
    initials: 'SJ',
    customersHandled: 420,
    status: 'Active',
    createdAt: '2026-01-10T08:00:00.000Z',
    updatedAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'TM-02',
    name: 'David Miller',
    role: 'Senior Field Representative',
    email: 'david.m@door2life.io',
    phone: '+91 98765 00002',
    initials: 'DM',
    customersHandled: 312,
    status: 'On Field',
    createdAt: '2026-01-15T09:30:00.000Z',
    updatedAt: '2026-01-15T09:30:00.000Z',
  },
  {
    id: 'TM-03',
    name: 'Lisa Ray',
    role: 'Customer Success & Intake Specialist',
    email: 'lisa.r@door2life.io',
    phone: '+91 98765 00003',
    initials: 'LR',
    customersHandled: 284,
    status: 'Active',
    createdAt: '2026-02-01T10:15:00.000Z',
    updatedAt: '2026-02-01T10:15:00.000Z',
  },
  {
    id: 'TM-04',
    name: 'James Thornton',
    role: 'Field Verification Officer',
    email: 'james.t@door2life.io',
    phone: '+91 98765 00004',
    initials: 'JT',
    customersHandled: 268,
    status: 'Inactive',
    createdAt: '2026-02-15T11:45:00.000Z',
    updatedAt: '2026-02-15T11:45:00.000Z',
  },
];

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Safely retrieve all team members from localStorage.
 * Seeds with default members if storage is completely uninitialized.
 */
export function getStoredTeamMembers(): TeamMember[] {
  try {
    const raw = localStorage.getItem(TEAM_STORAGE_KEY);
    if (!raw) {
      // First-time initialization
      localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(DEFAULT_TEAM_MEMBERS));
      return DEFAULT_TEAM_MEMBERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is TeamMember =>
        Boolean(m) &&
        typeof m === 'object' &&
        typeof m.id === 'string' &&
        typeof m.name === 'string'
    );
  } catch (error) {
    console.error('Door2Life: Failed to read team members from localStorage:', error);
    return [];
  }
}

/**
 * Persist team members to localStorage and dispatch update events.
 */
export function saveTeamMembers(members: TeamMember[]): boolean {
  try {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(members));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_TEAM_UPDATED));
    }
    return true;
  } catch (error) {
    console.error('Door2Life: Failed to save team members to localStorage:', error);
    return false;
  }
}

/**
 * Generate sequential Team Member ID (e.g. TM-05).
 */
export function generateTeamMemberId(): string {
  const members = getStoredTeamMembers();
  if (members.length === 0) return 'TM-01';

  const numbers = members
    .map((m) => {
      const match = m.id.match(/^TM-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n) && n > 0);

  const maxId = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNum = maxId + 1;
  return `TM-${nextNum < 10 ? `0${nextNum}` : nextNum}`;
}

/**
 * Add a new team member.
 */
export function addTeamMember(input: TeamMemberInput): {
  success: boolean;
  member?: TeamMember;
  error?: string;
} {
  if (!input.name || !input.name.trim()) {
    return { success: false, error: 'Member name is required.' };
  }
  if (!input.role || !input.role.trim()) {
    return { success: false, error: 'Member role is required.' };
  }
  if (!input.email || !input.email.trim()) {
    return { success: false, error: 'Email address is required.' };
  }

  const now = new Date().toISOString();
  const newMember: TeamMember = {
    id: generateTeamMemberId(),
    name: input.name.trim(),
    role: input.role.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || '',
    initials: deriveInitials(input.name),
    status: input.status || 'Active',
    customersHandled: 0,
    createdAt: now,
    updatedAt: now,
  };

  const members = getStoredTeamMembers();
  const updated = [...members, newMember];
  const saved = saveTeamMembers(updated);

  if (!saved) {
    return { success: false, error: 'Failed to write team member to localStorage.' };
  }
  return { success: true, member: newMember };
}

/**
 * Update an existing team member.
 */
export function updateTeamMember(
  id: string,
  updates: Partial<Omit<TeamMember, 'id' | 'createdAt'>>
): { success: boolean; member?: TeamMember; error?: string } {
  const members = getStoredTeamMembers();
  const index = members.findIndex((m) => m.id === id);
  if (index === -1) {
    return { success: false, error: `Team member ${id} was not found.` };
  }

  const existing = members[index];
  const updatedName = updates.name !== undefined ? updates.name.trim() : existing.name;
  const updatedMember: TeamMember = {
    ...existing,
    ...updates,
    name: updatedName,
    initials: updates.name ? deriveInitials(updatedName) : existing.initials,
    updatedAt: new Date().toISOString(),
  };

  members[index] = updatedMember;
  const saved = saveTeamMembers(members);

  return { success: saved, member: updatedMember, error: saved ? undefined : 'Failed to update member.' };
}

/**
 * Update the active status of a team member.
 */
export function updateTeamMemberStatus(
  id: string,
  status: TeamMemberStatus
): { success: boolean; member?: TeamMember; error?: string } {
  return updateTeamMember(id, { status });
}

/**
 * Delete a team member by ID.
 */
export function deleteTeamMember(id: string): boolean {
  const members = getStoredTeamMembers();
  const filtered = members.filter((m) => m.id !== id);
  if (filtered.length === members.length) return false;
  return saveTeamMembers(filtered);
}

/**
 * Return only active or on-field team members for task assignment.
 */
export function getActiveTeamMembers(): TeamMember[] {
  const members = getStoredTeamMembers();
  return members.filter((m) => m.status !== 'Inactive');
}

/**
 * React hook for live reactive team member updates.
 */
export function useTeamMembers() {
  const [team, setTeam] = useState<TeamMember[]>(getStoredTeamMembers);

  useEffect(() => {
    const handleUpdate = () => {
      setTeam(getStoredTeamMembers());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_TEAM_UPDATED, handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(EVENT_TEAM_UPDATED, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, []);

  const activeMembers = team.filter((m) => m.status !== 'Inactive');

  return {
    team,
    totalCount: team.length,
    activeCount: activeMembers.length,
    activeMembers,
    refresh: () => setTeam(getStoredTeamMembers()),
  };
}
