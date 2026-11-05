/**
 * Core Role-Based Access Control (RBAC) and Authentication Types
 * Strictly implements three roles: super_admin, admin, team_member
 */

export type UserRole = 'super_admin' | 'admin' | 'team_member';

export type UserStatus = 'active' | 'inactive';

export interface UserProfile {
  id: string; // references Supabase auth.users(id)
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  team_member: 'Team Member',
};

export const ROLE_BADGE_VARIANTS: Record<UserRole, 'primary' | 'warning' | 'info'> = {
  super_admin: 'primary',
  admin: 'warning',
  team_member: 'info',
};

export type AuditAction =
  | 'login'
  | 'logout'
  | 'customer_create'
  | 'customer_update'
  | 'customer_delete'
  | 'customer_assign'
  | 'user_create'
  | 'user_update'
  | 'user_role_change'
  | 'user_deactivate'
  | 'user_activate'
  | 'import'
  | 'export'
  | 'settings_update';

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_role?: UserRole;
  actor_name?: string;
  actor_role?: UserRole;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

/**
 * Pure permission checking helpers based on authenticated profile role
 */
export function isSuperAdmin(role?: UserRole | null): boolean {
  return role === 'super_admin';
}

export function isAdminOrSuperAdmin(role?: UserRole | null): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function canManageUsers(role?: UserRole | null): boolean {
  return role === 'super_admin';
}

export function canDeleteCustomer(role?: UserRole | null): boolean {
  return role === 'super_admin';
}

export function canAssignCustomer(role?: UserRole | null): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function canAccessSettings(role?: UserRole | null): boolean {
  return role === 'super_admin';
}

export function canAccessImportExport(role?: UserRole | null): boolean {
  return role === 'super_admin';
}

export function canViewAuditLogs(role?: UserRole | null): boolean {
  return role === 'super_admin';
}

export function canAccessAuditLogs(role?: UserRole | null): boolean {
  return role === 'super_admin';
}

export function isTeamMemberUser(role?: UserRole | null): boolean {
  return role === 'team_member';
}

export function canAccessTeamManagement(role?: UserRole | null): boolean {
  return role === 'super_admin' || role === 'admin';
}
