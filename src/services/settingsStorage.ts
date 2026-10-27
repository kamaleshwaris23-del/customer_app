import { useState, useEffect } from 'react';
import { getStoredCustomers, saveCustomers, STORAGE_KEY as CUSTOMERS_KEY } from './customerStorage.ts';
import { getStoredFollowUps, saveFollowUps, FOLLOWUPS_STORAGE_KEY } from './followUpStorage.ts';
import { getStoredTeamMembers, saveTeamMembers, TEAM_STORAGE_KEY } from './teamStorage.ts';

export const SETTINGS_STORAGE_KEY = 'door2life_settings_v1';
export const EVENT_SETTINGS_UPDATED = 'door2life_settings_updated';

export interface CustomFieldDefinition {
  id: string; // e.g. "field_alt_id"
  label: string; // e.g. "National ID / Voter ID"
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[]; // for select
  required: boolean;
  placeholder?: string;
}

export interface OrganizationSettings {
  orgName: string;
  supportEmail: string;
  hotline: string;
  locale: string;
  timezone: string;
  followUpReminderDays: number;
}

export interface AppSettings {
  organization: OrganizationSettings;
  categories: string[];
  customFields: CustomFieldDefinition[];
  updatedAt: string;
}

export interface CompleteBackupPayload {
  app: 'Door2Life';
  backupVersion: '2.0';
  exportedAt: string;
  storage: {
    customers: unknown[];
    followUps: unknown[];
    team: unknown[];
    settings: AppSettings;
  };
}

export interface CompleteBackupSummary {
  customerCount: number;
  followUpCount: number;
  teamCount: number;
  categoriesCount: number;
  customFieldsCount: number;
  exportedAt: string;
}

const DEFAULT_CATEGORIES = [
  'Business Owner',
  'Entrepreneur',
  'Student',
  'Professional',
  'Self-employed',
  'Investor',
  'General Customer',
];

const DEFAULT_CUSTOM_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'field_alt_id',
    label: 'Alternative ID (Voter / Aadhaar / Passport)',
    type: 'text',
    required: false,
    placeholder: 'e.g. ABC1234567',
  },
  {
    id: 'field_emergency_contact',
    label: 'Emergency Contact Person & Phone',
    type: 'text',
    required: false,
    placeholder: 'e.g. S. Kumar (Brother) - 9876543210',
  },
  {
    id: 'field_family_size',
    label: 'Household Size & Dependents',
    type: 'number',
    required: false,
    placeholder: 'e.g. 4',
  },
  {
    id: 'field_referral_source',
    label: 'Intake Referral Channel',
    type: 'select',
    required: false,
    options: ['Community Outreach', 'Field Agent Door-to-Door', 'Partner NGO', 'Online Portal', 'Word of Mouth'],
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  organization: {
    orgName: 'Door2Life Global Foundation',
    supportEmail: 'support@door2life.io',
    hotline: '+91 (800) 555-D2L',
    locale: 'en-IN',
    timezone: 'Asia/Kolkata (UTC+5:30)',
    followUpReminderDays: 3,
  },
  categories: DEFAULT_CATEGORIES,
  customFields: DEFAULT_CUSTOM_FIELDS,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

/**
 * Retrieve saved settings from localStorage, seeded with defaults if missing.
 */
export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;

    return {
      organization: {
        ...DEFAULT_SETTINGS.organization,
        ...(parsed.organization || {}),
      },
      categories: Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories
        : DEFAULT_CATEGORIES,
      customFields: Array.isArray(parsed.customFields)
        ? parsed.customFields
        : DEFAULT_CUSTOM_FIELDS,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Door2Life: Failed to read settings from localStorage:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to localStorage and dispatch update events.
 */
export function saveSettings(settings: AppSettings): boolean {
  try {
    const payload = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_SETTINGS_UPDATED));
    }
    return true;
  } catch (error) {
    console.error('Door2Life: Failed to save settings to localStorage:', error);
    return false;
  }
}

/**
 * Update organization parameters.
 */
export function updateOrganizationSettings(updates: Partial<OrganizationSettings>): boolean {
  const current = getStoredSettings();
  const updated: AppSettings = {
    ...current,
    organization: {
      ...current.organization,
      ...updates,
    },
  };
  return saveSettings(updated);
}

/**
 * Retrieve current category list.
 */
export function getCategories(): string[] {
  return getStoredSettings().categories;
}

/**
 * Check whether a category is currently in use by any customer in storage.
 */
export function isCategoryInUse(categoryName: string): { inUse: boolean; count: number } {
  const customers = getStoredCustomers();
  const count = customers.filter((c) => c.category === categoryName).length;
  return { inUse: count > 0, count };
}

/**
 * Add a new category.
 */
export function addCategory(name: string): { success: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, error: 'Category name cannot be empty.' };
  }
  const current = getStoredSettings();
  if (current.categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
    return { success: false, error: `Category "${trimmed}" already exists.` };
  }

  const updated: AppSettings = {
    ...current,
    categories: [...current.categories, trimmed],
  };
  const saved = saveSettings(updated);
  return { success: saved, error: saved ? undefined : 'Failed to save new category.' };
}

/**
 * Rename/edit an existing category.
 * Automatically updates existing customer records assigned to this category so data is preserved!
 */
export function updateCategory(
  oldName: string,
  newName: string
): { success: boolean; affectedCount?: number; error?: string } {
  const trimmedNew = newName.trim();
  if (!trimmedNew) {
    return { success: false, error: 'Category name cannot be empty.' };
  }
  const current = getStoredSettings();
  const index = current.categories.findIndex((c) => c === oldName);
  if (index === -1) {
    return { success: false, error: `Category "${oldName}" was not found.` };
  }

  if (oldName !== trimmedNew && current.categories.some((c) => c.toLowerCase() === trimmedNew.toLowerCase())) {
    return { success: false, error: `Category "${trimmedNew}" already exists.` };
  }

  // Update in settings
  const updatedCategories = [...current.categories];
  updatedCategories[index] = trimmedNew;

  // Migrate existing customer records
  const customers = getStoredCustomers();
  let affectedCount = 0;
  const updatedCustomers = customers.map((c) => {
    if (c.category === (oldName as any)) {
      affectedCount++;
      return { ...c, category: trimmedNew as any, updatedAt: new Date().toISOString() };
    }
    return c;
  });

  if (affectedCount > 0) {
    saveCustomers(updatedCustomers);
  }

  const saved = saveSettings({ ...current, categories: updatedCategories });
  return { success: saved, affectedCount, error: saved ? undefined : 'Failed to update category.' };
}

/**
 * Delete a category.
 * Prevents deletion if customers are using this category unless an explicit reassignTo is provided.
 */
export function deleteCategory(
  name: string,
  reassignTo?: string
): { success: boolean; affectedCount?: number; error?: string } {
  const current = getStoredSettings();
  if (!current.categories.includes(name)) {
    return { success: false, error: `Category "${name}" not found.` };
  }
  if (current.categories.length <= 1) {
    return { success: false, error: 'Cannot delete the only remaining category. At least one must exist.' };
  }

  const { inUse, count } = isCategoryInUse(name);
  if (inUse && !reassignTo) {
    return {
      success: false,
      error: `Category "${name}" is currently used by ${count} customer record(s). Please specify a category to reassign them to before deleting.`,
    };
  }

  let affectedCount = 0;
  if (inUse && reassignTo) {
    const customers = getStoredCustomers();
    const updatedCustomers = customers.map((c) => {
      if (c.category === (name as any)) {
        affectedCount++;
        return { ...c, category: reassignTo as any, updatedAt: new Date().toISOString() };
      }
      return c;
    });
    saveCustomers(updatedCustomers);
  }

  const filtered = current.categories.filter((c) => c !== name);
  const saved = saveSettings({ ...current, categories: filtered });
  return { success: saved, affectedCount, error: saved ? undefined : 'Failed to delete category.' };
}

/**
 * Add a new custom field definition.
 */
export function addCustomField(field: Omit<CustomFieldDefinition, 'id'>): {
  success: boolean;
  field?: CustomFieldDefinition;
  error?: string;
} {
  const trimmed = field.label.trim();
  if (!trimmed) {
    return { success: false, error: 'Custom field label is required.' };
  }
  const current = getStoredSettings();
  const id = `field_${Date.now()}`;
  const newField: CustomFieldDefinition = {
    ...field,
    id,
    label: trimmed,
  };

  const updated: AppSettings = {
    ...current,
    customFields: [...current.customFields, newField],
  };
  const saved = saveSettings(updated);
  return { success: saved, field: newField, error: saved ? undefined : 'Failed to add custom field.' };
}

/**
 * Update a custom field definition.
 */
export function updateCustomField(
  id: string,
  updates: Partial<Omit<CustomFieldDefinition, 'id'>>
): { success: boolean; error?: string } {
  const current = getStoredSettings();
  const index = current.customFields.findIndex((f) => f.id === id);
  if (index === -1) {
    return { success: false, error: `Custom field ${id} was not found.` };
  }

  const updatedList = [...current.customFields];
  updatedList[index] = { ...updatedList[index], ...updates };

  const saved = saveSettings({ ...current, customFields: updatedList });
  return { success: saved, error: saved ? undefined : 'Failed to update custom field.' };
}

/**
 * Delete a custom field definition.
 */
export function deleteCustomField(id: string): boolean {
  const current = getStoredSettings();
  const filtered = current.customFields.filter((f) => f.id !== id);
  if (filtered.length === current.customFields.length) return false;
  return saveSettings({ ...current, customFields: filtered });
}

/**
 * Calculate approximate localStorage usage for Door2Life keys.
 */
export function calculateLocalStorageUsage(): {
  totalBytes: number;
  totalKb: string;
  breakdown: { key: string; bytes: number; count: number }[];
} {
  try {
    const keys = [CUSTOMERS_KEY, FOLLOWUPS_STORAGE_KEY, TEAM_STORAGE_KEY, SETTINGS_STORAGE_KEY];
    let totalBytes = 0;
    const breakdown: { key: string; bytes: number; count: number }[] = [];

    keys.forEach((key) => {
      const val = localStorage.getItem(key) || '';
      const bytes = new Blob([val]).size;
      totalBytes += bytes;

      let count = 0;
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) count = parsed.length;
        else if (parsed && typeof parsed === 'object') count = 1;
      } catch {
        count = 0;
      }

      breakdown.push({ key, bytes, count });
    });

    const totalKb = (totalBytes / 1024).toFixed(2);
    return { totalBytes, totalKb, breakdown };
  } catch (error) {
    console.error('Door2Life: Failed to compute localStorage usage:', error);
    return { totalBytes: 0, totalKb: '0.00', breakdown: [] };
  }
}

/**
 * Generate a complete system backup JSON object.
 */
export function createCompleteBackup(): CompleteBackupPayload {
  const customers = getStoredCustomers();
  const followUps = getStoredFollowUps();
  const team = getStoredTeamMembers();
  const settings = getStoredSettings();

  return {
    app: 'Door2Life',
    backupVersion: '2.0',
    exportedAt: new Date().toISOString(),
    storage: {
      customers,
      followUps,
      team,
      settings,
    },
  };
}

/**
 * Download complete system backup file.
 */
export function downloadCompleteBackup(): { success: boolean; filename: string } {
  const payload = createCompleteBackup();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `door2life_full_backup_${dateStr}.json`;

  if (typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { success: true, filename };
}

/**
 * Validate an uploaded full system backup file before restoration.
 */
export function validateCompleteBackup(rawJson: unknown): {
  isValid: boolean;
  summary?: CompleteBackupSummary;
  payload?: CompleteBackupPayload;
  error?: string;
} {
  if (!rawJson || typeof rawJson !== 'object') {
    return { isValid: false, error: 'Backup file must contain a valid JSON object.' };
  }
  const obj = rawJson as Record<string, unknown>;

  if (obj.app !== 'Door2Life' && !obj.storage) {
    return { isValid: false, error: 'File is not a recognized Door2Life system backup file.' };
  }

  const storage = obj.storage as Record<string, unknown> | undefined;
  if (!storage || typeof storage !== 'object') {
    return { isValid: false, error: 'Backup file is missing storage container.' };
  }

  const customers = Array.isArray(storage.customers) ? storage.customers : [];
  const followUps = Array.isArray(storage.followUps) ? storage.followUps : [];
  const team = Array.isArray(storage.team) ? storage.team : [];
  const settings = (storage.settings && typeof storage.settings === 'object' ? storage.settings : DEFAULT_SETTINGS) as AppSettings;

  const summary: CompleteBackupSummary = {
    customerCount: customers.length,
    followUpCount: followUps.length,
    teamCount: team.length,
    categoriesCount: settings.categories?.length || 0,
    customFieldsCount: settings.customFields?.length || 0,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
  };

  const payload: CompleteBackupPayload = {
    app: 'Door2Life',
    backupVersion: '2.0',
    exportedAt: summary.exportedAt,
    storage: {
      customers,
      followUps,
      team,
      settings,
    },
  };

  return { isValid: true, summary, payload };
}

/**
 * Restore complete system backup into localStorage.
 */
export function restoreCompleteBackup(payload: CompleteBackupPayload): { success: boolean; error?: string } {
  try {
    if (!payload.storage) {
      return { success: false, error: 'Backup payload has no storage section.' };
    }

    if (Array.isArray(payload.storage.customers)) {
      saveCustomers(payload.storage.customers as any);
    }
    if (Array.isArray(payload.storage.followUps)) {
      saveFollowUps(payload.storage.followUps as any);
    }
    if (Array.isArray(payload.storage.team)) {
      saveTeamMembers(payload.storage.team as any);
    }
    if (payload.storage.settings && typeof payload.storage.settings === 'object') {
      saveSettings(payload.storage.settings);
    }

    return { success: true };
  } catch (error) {
    console.error('Door2Life: Failed to restore backup:', error);
    return { success: false, error: 'Unexpected error occurred while writing restored backup.' };
  }
}

/**
 * Destructive factory reset of all localStorage keys with explicit safety checks.
 */
export function resetAllLocalStorage(): { success: boolean } {
  try {
    localStorage.removeItem(CUSTOMERS_KEY);
    localStorage.removeItem(FOLLOWUPS_STORAGE_KEY);
    localStorage.removeItem(TEAM_STORAGE_KEY);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);

    // Re-initialize default settings and empty customer/follow-up lists
    saveSettings(DEFAULT_SETTINGS);
    saveCustomers([]);
    saveFollowUps([]);

    return { success: true };
  } catch (error) {
    console.error('Door2Life: Failed factory reset:', error);
    return { success: false };
  }
}

/**
 * React hook to access and update application settings reactively.
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getStoredSettings());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_SETTINGS_UPDATED, handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(EVENT_SETTINGS_UPDATED, handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, []);

  return {
    settings,
    categories: settings.categories,
    customFields: settings.customFields,
    organization: settings.organization,
    refresh: () => setSettings(getStoredSettings()),
  };
}
