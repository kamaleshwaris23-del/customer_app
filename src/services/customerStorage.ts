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
  input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>,
  customId?: string
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

  const customers = getStoredCustomers();
  const targetId = customId ? customId.trim() : generateCustomerId();

  if (customId && customers.some((c) => c.id === targetId)) {
    return {
      success: false,
      error: `Customer with ID ${targetId} already exists in storage.`,
    };
  }

  const now = new Date().toISOString();
  const newCustomer: Customer = {
    ...input,
    id: targetId,
    primaryContact: cleanContact,
    createdAt: now,
    updatedAt: now,
  };

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
 * Export actual saved customer records as a formatted .json file download with rich metadata.
 */
export function exportCustomersToJSON(): {
  count: number;
  success: boolean;
  payload: import('../types/customer').CustomerExportPayload;
} {
  const customers = getStoredCustomers();
  const exportPayload: import('../types/customer').CustomerExportPayload = {
    app: 'Door2Life',
    version: '1.0',
    exportVersion: '1.0',
    exportedAt: new Date().toISOString(),
    totalRecords: customers.length,
    data: customers,
  };

  if (typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
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
  }

  return { count: customers.length, success: true, payload: exportPayload };
}

/**
 * Safely format a cell value for CSV (RFC-4180).
 * If value contains comma, quotes, or newlines, wrap in quotes and escape internal quotes by doubling.
 */
function escapeCSVValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export actual saved customer records as an RFC-4180 compliant CSV file download.
 */
export function exportCustomersToCSV(): {
  count: number;
  success: boolean;
  csvString: string;
} {
  const customers = getStoredCustomers();
  const headers = [
    'Customer ID',
    'Full Name',
    'Age',
    'Gender',
    'Primary Contact',
    'Email',
    'Occupation',
    'Category',
    'Location',
    'Interests',
    'Notes',
    'Created At',
    'Last Updated',
  ];

  const rows = customers.map((c) => [
    escapeCSVValue(c.id),
    escapeCSVValue(c.fullName),
    escapeCSVValue(c.age),
    escapeCSVValue(c.gender),
    escapeCSVValue(c.primaryContact),
    escapeCSVValue(c.email || ''),
    escapeCSVValue(c.occupation),
    escapeCSVValue(c.category),
    escapeCSVValue(c.location || ''),
    escapeCSVValue(c.interests || ''),
    escapeCSVValue(c.notes || ''),
    escapeCSVValue(c.createdAt),
    escapeCSVValue(c.updatedAt),
  ]);

  const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  if (typeof document !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    const blob = new Blob([csvString], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `door2life_customers_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { count: customers.length, success: true, csvString };
}

/**
 * RFC-4180 compliant CSV parser.
 * Handles quoted fields, escaped quotes (""), commas inside quotes, and embedded newlines.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRecord.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRecord.push(currentField);
        records.push(currentRecord);
        currentRecord = [];
        currentField = '';
        i++;
        continue;
      } else if (char === '\n') {
        currentRecord.push(currentField);
        records.push(currentRecord);
        currentRecord = [];
        currentField = '';
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  if (currentField.length > 0 || currentRecord.length > 0) {
    currentRecord.push(currentField);
    records.push(currentRecord);
  }

  const nonEmptyRecords = records.filter((r) => r.some((field) => field.trim().length > 0));

  if (nonEmptyRecords.length < 2) {
    return [];
  }

  const headerRow = nonEmptyRecords[0].map((h) => h.trim().toLowerCase());
  const headerMap: Record<number, string> = {};

  headerRow.forEach((h, idx) => {
    if (h.includes('id')) {
      headerMap[idx] = 'id';
    } else if (h.includes('full') || h.includes('name')) {
      headerMap[idx] = 'fullName';
    } else if (h === 'age') {
      headerMap[idx] = 'age';
    } else if (h === 'gender') {
      headerMap[idx] = 'gender';
    } else if (h.includes('contact') || h.includes('phone') || h.includes('mobile')) {
      headerMap[idx] = 'primaryContact';
    } else if (h.includes('email')) {
      headerMap[idx] = 'email';
    } else if (h.includes('occupation') || h.includes('job') || h.includes('profession')) {
      headerMap[idx] = 'occupation';
    } else if (h.includes('category')) {
      headerMap[idx] = 'category';
    } else if (h.includes('location') || h.includes('address')) {
      headerMap[idx] = 'location';
    } else if (h.includes('interest')) {
      headerMap[idx] = 'interests';
    } else if (h.includes('note')) {
      headerMap[idx] = 'notes';
    } else if (h.includes('created')) {
      headerMap[idx] = 'createdAt';
    } else if (h.includes('updated')) {
      headerMap[idx] = 'updatedAt';
    }
  });

  const parsedObjects: Record<string, string>[] = [];
  for (let r = 1; r < nonEmptyRecords.length; r++) {
    const row = nonEmptyRecords[r];
    const rowObj: Record<string, string> = {};
    row.forEach((val, colIdx) => {
      const key = headerMap[colIdx];
      if (key) {
        rowObj[key] = val;
      }
    });
    parsedObjects.push(rowObj);
  }

  return parsedObjects;
}

/**
 * Validates raw CSV text for customer import, parsing and checking schema,
 * within-file uniqueness, and duplicates against localStorage.
 */
export function validateCustomerCSVImport(
  csvText: string
): import('../types/customer').CustomerImportValidationResult {
  try {
    const parsedRows = parseCSV(csvText);
    if (parsedRows.length === 0) {
      return {
        isValid: false,
        error: 'CSV file contains no valid rows or header columns could not be recognized.',
        parsedRecords: [],
        validRecords: [],
        invalidRecords: [],
        duplicateIdCount: 0,
        duplicatePhoneCount: 0,
        duplicateIds: [],
        duplicatePhones: [],
        newUniqueRecords: [],
      };
    }

    const validation = validateCustomerImport(parsedRows);
    return {
      ...validation,
      fileMetadata: {
        app: 'Door2Life',
        version: 'CSV-1.0',
        totalRecordsInFile: parsedRows.length,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to parse CSV.';
    return {
      isValid: false,
      error: `CSV Parsing Error: ${msg}`,
      parsedRecords: [],
      validRecords: [],
      invalidRecords: [],
      duplicateIdCount: 0,
      duplicatePhoneCount: 0,
      duplicateIds: [],
      duplicatePhones: [],
      newUniqueRecords: [],
    };
  }
}

const VALID_CATEGORIES: import('../types/customer').CustomerCategory[] = [
  'Business Owner',
  'Entrepreneur',
  'Student',
  'Professional',
  'Self-employed',
  'Investor',
  'General Customer',
];

export function getValidCategories(): string[] {
  try {
    const raw = localStorage.getItem('door2life_settings_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
        return parsed.categories;
      }
    }
  } catch {}
  return VALID_CATEGORIES;
}

const VALID_GENDERS: import('../types/customer').Gender[] = ['Female', 'Male', 'Prefer not to say'];

/**
 * Validates parsed JSON for importing customer records.
 * Performs deep schema checks, duplicate detection against localStorage,
 * and within-file uniqueness validation.
 */
export function validateCustomerImport(
  rawJson: unknown
): import('../types/customer').CustomerImportValidationResult {
  if (!rawJson || typeof rawJson !== 'object') {
    return {
      isValid: false,
      error: 'Invalid file format: JSON content must be an object or an array of customer records.',
      parsedRecords: [],
      validRecords: [],
      invalidRecords: [],
      duplicateIdCount: 0,
      duplicatePhoneCount: 0,
      duplicateIds: [],
      duplicatePhones: [],
      newUniqueRecords: [],
    };
  }

  let fileMetadata: import('../types/customer').CustomerImportValidationResult['fileMetadata'] = undefined;
  let rawList: unknown[] = [];

  if (Array.isArray(rawJson)) {
    rawList = rawJson;
  } else {
    const obj = rawJson as Record<string, unknown>;
    fileMetadata = {
      app: typeof obj.app === 'string' ? obj.app : undefined,
      version: typeof obj.version === 'string' ? obj.version : undefined,
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : undefined,
      totalRecordsInFile: typeof obj.totalRecords === 'number' ? obj.totalRecords : undefined,
    };

    if (Array.isArray(obj.data)) {
      rawList = obj.data;
    } else if (Array.isArray(obj.customers)) {
      rawList = obj.customers;
    } else {
      return {
        isValid: false,
        error: 'JSON structure must contain a "data" or "customers" array of records, or be an array directly.',
        parsedRecords: [],
        validRecords: [],
        invalidRecords: [],
        duplicateIdCount: 0,
        duplicatePhoneCount: 0,
        duplicateIds: [],
        duplicatePhones: [],
        newUniqueRecords: [],
      };
    }
  }

  if (rawList.length === 0) {
    return {
      isValid: false,
      error: 'The imported file contains zero customer records.',
      fileMetadata,
      parsedRecords: [],
      validRecords: [],
      invalidRecords: [],
      duplicateIdCount: 0,
      duplicatePhoneCount: 0,
      duplicateIds: [],
      duplicatePhones: [],
      newUniqueRecords: [],
    };
  }

  const existingCustomers = getStoredCustomers();
  const existingIdSet = new Set(existingCustomers.map((c) => c.id));
  const existingPhoneMap = new Map<string, string>(); // normalized phone -> customer ID
  existingCustomers.forEach((c) => {
    const p = c.primaryContact.replace(/\D/g, '').slice(-10);
    if (p) existingPhoneMap.set(p, c.id);
  });

  const validRecords: Customer[] = [];
  const invalidRecords: { index: number; data: unknown; error: string }[] = [];
  const seenFileIds = new Set<string>();
  const seenFilePhones = new Set<string>();

  const duplicateIds: string[] = [];
  const duplicatePhones: { phone: string; existingId: string; importId: string }[] = [];
  const newUniqueRecords: Customer[] = [];

  rawList.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      invalidRecords.push({ index, data: item, error: 'Record is not an object.' });
      return;
    }

    const rec = item as Record<string, unknown>;

    // 1. Full name validation
    if (typeof rec.fullName !== 'string' || rec.fullName.trim().length < 2) {
      invalidRecords.push({ index, data: item, error: 'Full name is required and must be at least 2 characters.' });
      return;
    }

    // 2. Age validation
    const parsedAge = Number(rec.age);
    if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      invalidRecords.push({ index, data: item, error: 'Age must be an integer between 1 and 120.' });
      return;
    }

    // 3. Gender validation
    if (!rec.gender || !VALID_GENDERS.includes(rec.gender as import('../types/customer').Gender)) {
      invalidRecords.push({ index, data: item, error: `Gender must be one of: ${VALID_GENDERS.join(', ')}.` });
      return;
    }

    // 4. Primary contact validation
    if (typeof rec.primaryContact !== 'string' && typeof rec.primaryContact !== 'number') {
      invalidRecords.push({ index, data: item, error: 'Primary contact number is required.' });
      return;
    }
    const phoneRes = validateIndianMobile(String(rec.primaryContact));
    if (!phoneRes.isValid) {
      invalidRecords.push({ index, data: item, error: phoneRes.error || 'Invalid 10-digit Indian mobile number.' });
      return;
    }
    const cleanPhone = phoneRes.normalized;

    // Check duplicate phone within this file itself
    if (seenFilePhones.has(cleanPhone)) {
      invalidRecords.push({ index, data: item, error: `Duplicate phone number ${cleanPhone} appears multiple times in file.` });
      return;
    }
    seenFilePhones.add(cleanPhone);

    // 5. Occupation
    if (typeof rec.occupation !== 'string' || !rec.occupation.trim()) {
      invalidRecords.push({ index, data: item, error: 'Occupation is required.' });
      return;
    }

    // 6. Category
    const allowedCategories = getValidCategories();
    if (
      typeof rec.category !== 'string' ||
      !rec.category.trim() ||
      !allowedCategories.includes(rec.category.trim())
    ) {
      invalidRecords.push({
        index,
        data: item,
        error: `Category must be one of: ${allowedCategories.join(', ')}.`,
      });
      return;
    }

    // 7. Optional Email validation
    if (typeof rec.email === 'string' && rec.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(rec.email.trim())) {
        invalidRecords.push({ index, data: item, error: `Invalid email address format: "${rec.email}".` });
        return;
      }
    }

    // Validated ID handling
    let targetId = typeof rec.id === 'string' && rec.id.trim() ? rec.id.trim() : '';
    if (targetId && seenFileIds.has(targetId)) {
      invalidRecords.push({ index, data: item, error: `Duplicate ID "${targetId}" appears multiple times in file.` });
      return;
    }
    if (targetId) {
      seenFileIds.add(targetId);
    }

    const now = new Date().toISOString();
    const validCustomer: Customer = {
      id: targetId || 'TEMP', // Temp if absent, assigned later
      fullName: rec.fullName.trim(),
      age: parsedAge,
      gender: rec.gender as import('../types/customer').Gender,
      primaryContact: cleanPhone,
      email: typeof rec.email === 'string' && rec.email.trim() ? rec.email.trim() : undefined,
      location: typeof rec.location === 'string' && rec.location.trim() ? rec.location.trim() : undefined,
      occupation: rec.occupation.trim(),
      category: rec.category as import('../types/customer').CustomerCategory,
      interests: typeof rec.interests === 'string' && rec.interests.trim() ? rec.interests.trim() : undefined,
      notes: typeof rec.notes === 'string' && rec.notes.trim() ? rec.notes.trim() : undefined,
      createdAt: typeof rec.createdAt === 'string' && rec.createdAt ? rec.createdAt : now,
      updatedAt: typeof rec.updatedAt === 'string' && rec.updatedAt ? rec.updatedAt : now,
    };

    validRecords.push(validCustomer);

    // Check against existing localStorage
    const hasDuplicateId = targetId && existingIdSet.has(targetId);
    const hasDuplicatePhone = existingPhoneMap.has(cleanPhone);

    if (hasDuplicateId) {
      duplicateIds.push(targetId);
    }

    if (hasDuplicatePhone) {
      const existingId = existingPhoneMap.get(cleanPhone) || '';
      duplicatePhones.push({ phone: cleanPhone, existingId, importId: targetId });
    }

    if (!hasDuplicateId && !hasDuplicatePhone) {
      newUniqueRecords.push(validCustomer);
    }
  });

  return {
    isValid: validRecords.length > 0,
    fileMetadata,
    parsedRecords: validRecords,
    validRecords,
    invalidRecords,
    duplicateIdCount: duplicateIds.length,
    duplicatePhoneCount: duplicatePhones.length,
    duplicateIds,
    duplicatePhones,
    newUniqueRecords,
  };
}

/**
 * Imports validated customer records using chosen safe merge strategy.
 * - 'skip-duplicates': Adds only records with unique ID and unique phone. Never touches existing.
 * - 'merge-overwrite': Overwrites existing records matching on ID, appends new ones.
 * - 'full-replace': Completely replaces all records with valid imported records.
 */
export function importCustomers(
  validRecords: Customer[],
  strategy: import('../types/customer').ImportMergeStrategy
): import('../types/customer').CustomerImportExecutionResult {
  const existing = getStoredCustomers();

  if (strategy === 'full-replace') {
    // Generate IDs for any records missing an ID
    const generatedList: Customer[] = [];
    const usedIds = new Set<string>();

    validRecords.forEach((rec) => {
      let finalId = rec.id && rec.id !== 'TEMP' ? rec.id : '';
      if (!finalId || usedIds.has(finalId)) {
        let nextNum = 1001;
        while (usedIds.has(`D2L-${nextNum}`)) {
          nextNum++;
        }
        finalId = `D2L-${nextNum}`;
      }
      usedIds.add(finalId);
      generatedList.push({ ...rec, id: finalId });
    });

    const success = saveCustomers(generatedList);
    return {
      success,
      strategy,
      totalImported: generatedList.length,
      addedCount: generatedList.length,
      updatedCount: 0,
      skippedCount: 0,
      error: success ? undefined : 'Failed to write full dataset to localStorage.',
    };
  }

  if (strategy === 'skip-duplicates') {
    const existingIdSet = new Set(existing.map((c) => c.id));
    const existingPhoneSet = new Set(existing.map((c) => c.primaryContact.replace(/\D/g, '').slice(-10)));

    let addedCount = 0;
    let skippedCount = 0;
    const toAdd: Customer[] = [];

    // Helper to get next sequential ID avoiding collisions with existing and newly added
    const currentAllIds = new Set([...existingIdSet]);

    const getNextSafeId = () => {
      const numericIds = Array.from(currentAllIds)
        .map((id) => {
          const match = id.match(/^D2L-(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n) => !isNaN(n) && n > 0);
      const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 1000;
      let nextId = `D2L-${maxId + 1}`;
      let counter = 1;
      while (currentAllIds.has(nextId)) {
        nextId = `D2L-${maxId + 1 + counter}`;
        counter++;
      }
      currentAllIds.add(nextId);
      return nextId;
    };

    validRecords.forEach((rec) => {
      const cleanPhone = rec.primaryContact.replace(/\D/g, '').slice(-10);
      const isIdDup = rec.id && rec.id !== 'TEMP' && existingIdSet.has(rec.id);
      const isPhoneDup = existingPhoneSet.has(cleanPhone);

      if (isIdDup || isPhoneDup) {
        skippedCount++;
        return;
      }

      let finalId = rec.id && rec.id !== 'TEMP' ? rec.id : getNextSafeId();
      if (currentAllIds.has(finalId)) {
        finalId = getNextSafeId();
      } else {
        currentAllIds.add(finalId);
      }

      existingPhoneSet.add(cleanPhone);
      toAdd.push({ ...rec, id: finalId });
      addedCount++;
    });

    const updatedList = [...toAdd, ...existing];
    const success = saveCustomers(updatedList);

    return {
      success,
      strategy,
      totalImported: addedCount,
      addedCount,
      updatedCount: 0,
      skippedCount,
      error: success ? undefined : 'Failed to save merged records to localStorage.',
    };
  }

  if (strategy === 'merge-overwrite') {
    const customerMap = new Map<string, Customer>();
    existing.forEach((c) => customerMap.set(c.id, c));

    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    validRecords.forEach((rec) => {
      if (rec.id && rec.id !== 'TEMP' && customerMap.has(rec.id)) {
        // Overwrite existing record with imported fields
        const existingRec = customerMap.get(rec.id)!;
        customerMap.set(rec.id, {
          ...existingRec,
          ...rec,
          id: rec.id,
          updatedAt: new Date().toISOString(),
        });
        updatedCount++;
      } else {
        // Check phone duplicate with another existing record
        const cleanPhone = rec.primaryContact.replace(/\D/g, '').slice(-10);
        const phoneConflict = Array.from(customerMap.values()).some(
          (c) => c.primaryContact.replace(/\D/g, '').slice(-10) === cleanPhone
        );

        if (phoneConflict) {
          skippedCount++;
        } else {
          let finalId = rec.id && rec.id !== 'TEMP' ? rec.id : '';
          if (!finalId || customerMap.has(finalId)) {
            const numericIds = Array.from(customerMap.keys())
              .map((id) => {
                const match = id.match(/^D2L-(\d+)$/);
                return match ? parseInt(match[1], 10) : 0;
              })
              .filter((n) => !isNaN(n) && n > 0);
            const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 1000;
            finalId = `D2L-${maxId + 1}`;
          }
          customerMap.set(finalId, { ...rec, id: finalId });
          addedCount++;
        }
      }
    });

    const updatedList = Array.from(customerMap.values());
    const success = saveCustomers(updatedList);

    return {
      success,
      strategy,
      totalImported: addedCount + updatedCount,
      addedCount,
      updatedCount,
      skippedCount,
      error: success ? undefined : 'Failed to save updated records to localStorage.',
    };
  }

  return {
    success: false,
    strategy,
    totalImported: 0,
    addedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    error: 'Unrecognized merge strategy.',
  };
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

