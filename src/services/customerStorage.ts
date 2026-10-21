import { useState, useEffect } from 'react';
import type { Customer } from '../types/customer';

export const STORAGE_KEY = 'door2life_customers_v1';
const EVENT_CUSTOMERS_UPDATED = 'door2life_customers_updated';

/**
 * Safely parse and retrieve customers from localStorage.
 * Handles corrupt or invalid JSON gracefully.
 */
export function getStoredCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('Door2Life: Stored data is not an array, resetting to empty list.');
      return [];
    }
    // Validate record schema to prevent broken data from throwing runtime errors
    return parsed.filter(
      (item): item is Customer =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.fullName === 'string' &&
        typeof item.primaryContact === 'string'
    );
  } catch (error) {
    console.error('Door2Life: Failed to read from localStorage:', error);
    return [];
  }
}

/**
 * Find a specific customer by ID.
 */
export function getStoredCustomerById(id: string): Customer | null {
  const customers = getStoredCustomers();
  return customers.find((c) => c.id === id) || null;
}

/**
 * Persist customers list to localStorage and dispatch custom update event.
 */
export function saveCustomers(customers: Customer[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    window.dispatchEvent(new CustomEvent(EVENT_CUSTOMERS_UPDATED));
    return true;
  } catch (error) {
    console.error('Door2Life: Failed to save to localStorage:', error);
    return false;
  }
}

/**
 * Generate a sequential, professional customer ID (e.g. D2L-1001).
 */
export function generateCustomerId(): string {
  const customers = getStoredCustomers();
  if (customers.length === 0) {
    return 'D2L-1001';
  }
  const numericIds = customers
    .map((c) => {
      const match = c.id.match(/^D2L-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n) && n > 0);

  const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 1000;
  return `D2L-${maxId + 1}`;
}

/**
 * Validation result interface for Indian mobile numbers.
 */
export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Validates and normalizes Indian mobile phone numbers.
 * Supports raw 10 digits, formatted (spaces/hyphens), +91 prefix, and leading 0.
 * Enforces /^[6-9]\d{9}$/.
 */
export function validateIndianMobile(raw: string): PhoneValidationResult {
  if (!raw || !raw.trim()) {
    return {
      isValid: false,
      normalized: '',
      error: 'Primary contact number is required.',
    };
  }

  const trimmed = raw.trim();

  // Reject alphabetic characters
  if (/[a-zA-Z]/.test(trimmed)) {
    return {
      isValid: false,
      normalized: '',
      error: 'Primary contact cannot contain letters.',
    };
  }

  let working = trimmed;

  // Handle leading country code if provided with '+'
  if (working.startsWith('+')) {
    // Only +91 is permitted
    if (/^\+91(?:[\s-]|\d|$)/.test(working)) {
      working = working.replace(/^\+91/, '');
    } else {
      return {
        isValid: false,
        normalized: '',
        error: 'Only Indian mobile numbers (+91) are supported.',
      };
    }
  }

  // Remove spaces and hyphens
  working = working.replace(/[\s-]/g, '');

  // Handle leading 0 (trunk prefix) if followed by 10 digits
  if (working.startsWith('0') && working.length === 11) {
    working = working.slice(1);
  }

  // Reject if any non-digits remain
  if (/\D/.test(working)) {
    return {
      isValid: false,
      normalized: '',
      error: 'Primary contact must contain only digits, spaces, hyphens, and optional +91 prefix.',
    };
  }

  // Check digit count
  if (working.length < 10) {
    return {
      isValid: false,
      normalized: working,
      error: 'Must be exactly 10 digits for Indian mobile numbers (e.g. 9876543210).',
    };
  }

  if (working.length > 10) {
    return {
      isValid: false,
      normalized: working,
      error: 'Primary contact contains too many digits. Expected a 10-digit number.',
    };
  }

  // Validate Indian mobile starting digit: must begin with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(working)) {
    return {
      isValid: false,
      normalized: working,
      error: 'Indian mobile numbers must start with 6, 7, 8, or 9.',
    };
  }

  return {
    isValid: true,
    normalized: working,
  };
}

/**
 * Check whether a primary contact number already exists.
 * Optionally exclude a customer ID during update checks.
 * Uses normalized 10-digit format for comparisons.
 */
export function isContactDuplicate(contact: string, excludeId?: string): boolean {
  const phoneResult = validateIndianMobile(contact);
  const cleanContact = phoneResult.isValid ? phoneResult.normalized : contact.trim().replace(/\D/g, '');
  if (!cleanContact) return false;
  const customers = getStoredCustomers();
  return customers.some((c) => {
    const storedClean = c.primaryContact.trim().replace(/\D/g, '');
    return storedClean === cleanContact && c.id !== excludeId;
  });
}

/**
 * Add a new customer record.
 */
export function addCustomer(
  input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
): { success: boolean; customer?: Customer; error?: string } {
  const phoneResult = validateIndianMobile(input.primaryContact);
  if (!phoneResult.isValid) {
    return {
      success: false,
      error: phoneResult.error || 'Invalid primary contact number.',
    };
  }
  const cleanContact = phoneResult.normalized;
  if (isContactDuplicate(cleanContact)) {
    return {
      success: false,
      error: `Primary contact number ${cleanContact} is already registered.`,
    };
  }

  const now = new Date().toISOString();
  const newCustomer: Customer = {
    ...input,
    id: generateCustomerId(),
    primaryContact: cleanContact,
    createdAt: now,
    updatedAt: now,
  };

  const customers = getStoredCustomers();
  const updated = [newCustomer, ...customers];
  const saved = saveCustomers(updated);

  if (saved) {
    return { success: true, customer: newCustomer };
  } else {
    return { success: false, error: 'Failed to write to browser local storage.' };
  }
}

/**
 * Update an existing customer record.
 */
export function updateCustomer(
  id: string,
  updates: Partial<Omit<Customer, 'id' | 'createdAt'>>
): { success: boolean; customer?: Customer; error?: string } {
  const customers = getStoredCustomers();
  const index = customers.findIndex((c) => c.id === id);

  if (index === -1) {
    return { success: false, error: `Customer with ID ${id} was not found.` };
  }

  if (updates.primaryContact) {
    const phoneResult = validateIndianMobile(updates.primaryContact);
    if (!phoneResult.isValid) {
      return {
        success: false,
        error: phoneResult.error || 'Invalid primary contact number.',
      };
    }
    const cleanContact = phoneResult.normalized;
    if (isContactDuplicate(cleanContact, id)) {
      return {
        success: false,
        error: `Primary contact number ${cleanContact} is already registered with another customer.`,
      };
    }
    updates.primaryContact = cleanContact;
  }

  const existing = customers[index];
  const updatedCustomer: Customer = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  customers[index] = updatedCustomer;
  const saved = saveCustomers(customers);

  if (saved) {
    return { success: true, customer: updatedCustomer };
  } else {
    return { success: false, error: 'Failed to update record in local storage.' };
  }
}

/**
 * Delete a customer record by ID.
 */
export function deleteCustomer(id: string): boolean {
  const customers = getStoredCustomers();
  const filtered = customers.filter((c) => c.id !== id);
  if (filtered.length === customers.length) {
    return false;
  }
  return saveCustomers(filtered);
}

/**
 * Export actual saved customer records as a formatted .json file download.
 * Does not export hardcoded demo data.
 */
export function exportCustomersToJSON(): { count: number; success: boolean } {
  const customers = getStoredCustomers();
  const exportPayload = {
    app: 'Door2Life',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalRecords: customers.length,
    data: customers,
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `door2life_customers_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { count: customers.length, success: true };
}

/**
 * React hook to stay reactively in sync with customer data across all components.
 */
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(getStoredCustomers);

  useEffect(() => {
    const handleUpdate = () => {
      setCustomers(getStoredCustomers());
    };

    window.addEventListener(EVENT_CUSTOMERS_UPDATED, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_CUSTOMERS_UPDATED, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    customers,
    totalCount: customers.length,
    refresh: () => setCustomers(getStoredCustomers()),
  };
}
