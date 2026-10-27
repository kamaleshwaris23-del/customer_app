import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage and window before importing customerStorage
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

const mockStorage = new MemoryStorage();
globalThis.localStorage = mockStorage as unknown as Storage;
globalThis.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
} as unknown as Window & typeof globalThis;

import {
  STORAGE_KEY,
  validateIndianMobile,
  isContactDuplicate,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getStoredCustomers,
  getStoredCustomerById,
  exportCustomersToJSON,
  exportCustomersToCSV,
  parseCSV,
  validateCustomerCSVImport,
  validateCustomerImport,
  importCustomers,
} from '../src/services/customerStorage.ts';

import {
  FOLLOWUPS_STORAGE_KEY,
  getStoredFollowUps,
  addFollowUp,
  updateFollowUp,
  completeFollowUp,
  deleteFollowUp,
  getFollowUpsByCustomerId,
  generateFollowUpId,
} from '../src/services/followUpStorage.ts';

import {
  getStoredTeamMembers,
  saveTeamMembers,
  addTeamMember,
  updateTeamMember,
  updateTeamMemberStatus,
  deleteTeamMember,
  generateTeamMemberId,
} from '../src/services/teamStorage.ts';

import {
  getStoredSettings,
  updateOrganizationSettings,
  addCategory,
  updateCategory,
  deleteCategory,
  isCategoryInUse,
  addCustomField,
  updateCustomField,
  deleteCustomField,
  calculateLocalStorageUsage,
  createCompleteBackup,
  validateCompleteBackup,
  restoreCompleteBackup,
  resetAllLocalStorage,
} from '../src/services/settingsStorage.ts';

import {
  ROLE_STORAGE_KEY,
  getStoredRole,
  setStoredRole,
} from '../src/services/roleStorage.ts';

describe('Door2Life Customer Management Automated Tests', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe('1. Indian Mobile Number Validation and Normalization', () => {
    it('validates and normalizes plain 10-digit Indian mobile numbers', () => {
      const validNumbers = ['9876543210', '8123456789', '7000000000', '6999999999'];
      for (const num of validNumbers) {
        const result = validateIndianMobile(num);
        assert.equal(result.isValid, true, `Expected ${num} to be valid`);
        assert.equal(result.normalized, num);
        assert.equal(result.error, undefined);
      }
    });

    it('normalizes mobile numbers formatted with spaces and hyphens', () => {
      const formatted = [
        { input: '98765 43210', expected: '9876543210' },
        { input: '98765-43210', expected: '9876543210' },
        { input: '98 76 54 32 10', expected: '9876543210' },
        { input: '8123-456-789', expected: '8123456789' },
      ];
      for (const { input, expected } of formatted) {
        const result = validateIndianMobile(input);
        assert.equal(result.isValid, true, `Expected ${input} to be valid`);
        assert.equal(result.normalized, expected);
      }
    });

    it('normalizes mobile numbers with +91 country prefix and leading 0', () => {
      const withPrefixes = [
        { input: '+91 9876543210', expected: '9876543210' },
        { input: '+91-98765-43210', expected: '9876543210' },
        { input: '+919876543210', expected: '9876543210' },
        { input: '09876543210', expected: '9876543210' },
      ];
      for (const { input, expected } of withPrefixes) {
        const result = validateIndianMobile(input);
        assert.equal(result.isValid, true, `Expected ${input} to be valid`);
        assert.equal(result.normalized, expected);
      }
    });

    it('rejects invalid inputs: empty, non-Indian starting digit, wrong length, letters', () => {
      const invalidCases = [
        { input: '', expectedError: 'Primary contact number is required.' },
        { input: '   ', expectedError: 'Primary contact number is required.' },
        { input: '98765abcde', expectedError: 'Primary contact cannot contain letters.' },
        { input: '+1 9876543210', expectedError: 'Only Indian mobile numbers (+91) are supported.' },
        { input: '5876543210', expectedError: 'Indian mobile numbers must start with 6, 7, 8, or 9.' },
        { input: '1234567890', expectedError: 'Indian mobile numbers must start with 6, 7, 8, or 9.' },
        { input: '987654321', expectedError: 'Must be exactly 10 digits for Indian mobile numbers (e.g. 9876543210).' },
        { input: '98765432100', expectedError: 'Primary contact contains too many digits. Expected a 10-digit number.' },
      ];

      for (const { input, expectedError } of invalidCases) {
        const result = validateIndianMobile(input);
        assert.equal(result.isValid, false, `Expected ${input} to be invalid`);
        assert.equal(result.error, expectedError);
      }
    });
  });

  describe('2. Duplicate Contact Detection', () => {
    it('detects duplicate contact numbers regardless of formatting', () => {
      addCustomer({
        fullName: 'Ramesh Kumar',
        age: 34,
        gender: 'Male',
        primaryContact: '9876543210',
        occupation: 'Software Engineer',
        category: 'Professional',
      });

      // Same 10 digits
      assert.equal(isContactDuplicate('9876543210'), true);
      // Formatted with spaces
      assert.equal(isContactDuplicate('98765 43210'), true);
      // Formatted with hyphens
      assert.equal(isContactDuplicate('98765-43210'), true);
      // With +91 prefix
      assert.equal(isContactDuplicate('+91 98765 43210'), true);
      // Different number is not duplicate
      assert.equal(isContactDuplicate('8765432109'), false);
    });

    it('allows keeping current contact when editing own customer profile', () => {
      const added = addCustomer({
        fullName: 'Priya Sharma',
        age: 29,
        gender: 'Female',
        primaryContact: '9876543210',
        occupation: 'Doctor',
        category: 'Professional',
      });
      assert.ok(added.customer);

      // Same contact should NOT be treated as duplicate when excludeId matches current customer
      assert.equal(isContactDuplicate('9876543210', added.customer.id), false);
      assert.equal(isContactDuplicate('+91 98765 43210', added.customer.id), false);

      // But another customer cannot use it
      assert.equal(isContactDuplicate('9876543210', 'D2L-9999'), true);
    });
  });

  describe('3. Customer CRUD Operations (Add, Update, Delete)', () => {
    it('adds a customer with sequential ID, timestamps, and normalized contact', () => {
      const res1 = addCustomer({
        fullName: 'Anand Verma',
        age: 40,
        gender: 'Male',
        primaryContact: '+91 98765 43210',
        occupation: 'Business Owner',
        category: 'Business Owner',
      });

      assert.equal(res1.success, true);
      assert.ok(res1.customer);
      assert.equal(res1.customer.id, 'D2L-1001');
      assert.equal(res1.customer.primaryContact, '9876543210');
      assert.ok(res1.customer.createdAt);
      assert.ok(res1.customer.updatedAt);

      const res2 = addCustomer({
        fullName: 'Deepa Nair',
        age: 32,
        gender: 'Female',
        primaryContact: '8123456789',
        occupation: 'Consultant',
        category: 'Professional',
      });

      assert.equal(res2.success, true);
      assert.ok(res2.customer);
      assert.equal(res2.customer.id, 'D2L-1002');
    });

    it('prevents adding customer with duplicate phone number', () => {
      addCustomer({
        fullName: 'First Customer',
        age: 30,
        gender: 'Male',
        primaryContact: '9876543210',
        occupation: 'Architect',
        category: 'Professional',
      });

      const duplicateRes = addCustomer({
        fullName: 'Second Customer',
        age: 28,
        gender: 'Female',
        primaryContact: '+91 98765-43210',
        occupation: 'Designer',
        category: 'Self-employed',
      });

      assert.equal(duplicateRes.success, false);
      assert.match(duplicateRes.error ?? '', /already registered/);
    });

    it('updates an existing customer successfully', () => {
      const added = addCustomer({
        fullName: 'Kavita Patel',
        age: 35,
        gender: 'Female',
        primaryContact: '9876543210',
        occupation: 'Manager',
        category: 'Professional',
      });
      assert.ok(added.customer);

      const updateRes = updateCustomer(added.customer.id, {
        occupation: 'Director',
        location: 'Bengaluru',
      });

      assert.equal(updateRes.success, true);
      assert.ok(updateRes.customer);
      assert.equal(updateRes.customer.occupation, 'Director');
      assert.equal(updateRes.customer.location, 'Bengaluru');
      assert.equal(updateRes.customer.fullName, 'Kavita Patel');
    });

    it('deletes an existing customer and returns true', () => {
      const added = addCustomer({
        fullName: 'Target Customer',
        age: 26,
        gender: 'Male',
        primaryContact: '9876543210',
        occupation: 'Student',
        category: 'Student',
      });
      assert.ok(added.customer);

      assert.equal(getStoredCustomers().length, 1);
      const deleted = deleteCustomer(added.customer.id);
      assert.equal(deleted, true);
      assert.equal(getStoredCustomers().length, 0);
    });

    it('returns false when attempting to delete non-existent ID', () => {
      const deleted = deleteCustomer('NON-EXISTENT-ID');
      assert.equal(deleted, false);
    });
  });

  describe('4. Data Persistence & Malformed localStorage Handling', () => {
    it('verifies the storage key is door2life_customers_v1', () => {
      assert.equal(STORAGE_KEY, 'door2life_customers_v1');
    });

    it('safely handles corrupted JSON without crashing', () => {
      const origError = console.error;
      console.error = () => {};
      try {
        mockStorage.setItem(STORAGE_KEY, '{ invalid json data');
        const customers = getStoredCustomers();
        assert.deepEqual(customers, []);
      } finally {
        console.error = origError;
      }
    });

    it('safely handles non-array stored data without crashing', () => {
      const origWarn = console.warn;
      console.warn = () => {};
      try {
        mockStorage.setItem(STORAGE_KEY, JSON.stringify({ key: 'value' }));
        const customers = getStoredCustomers();
        assert.deepEqual(customers, []);
      } finally {
        console.warn = origWarn;
      }
    });

    it('safely filters out malformed or partial objects from stored array', () => {
      const corruptedData = [
        null,
        undefined,
        123,
        'string',
        {},
        { id: 'D2L-1001' }, // Missing required fields
        { id: 'D2L-1002', fullName: 'Valid Record', primaryContact: '9876543210', age: 30, gender: 'Male', occupation: 'Tester', category: 'Professional', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      ];
      mockStorage.setItem(STORAGE_KEY, JSON.stringify(corruptedData));

      const customers = getStoredCustomers();
      assert.equal(customers.length, 1);
      assert.equal(customers[0].id, 'D2L-1002');
      assert.equal(customers[0].fullName, 'Valid Record');
    });
  });

  describe('5. Phone Search Logic with Spaces, Hyphens, and +91', () => {
    it('matches phone number regardless of user formatting in search query', () => {
      const customer = {
        id: 'D2L-1001',
        fullName: 'Vikram Seth',
        primaryContact: '9876543210',
      };

      const searchMatches = (storedContact: string, searchTerm: string): boolean => {
        const query = searchTerm.toLowerCase().trim();
        const cleanPhoneQuery = query.replace(/^\+91[\s-]*/, '').replace(/[\s-]/g, '');
        const cleanStoredContact = storedContact.replace(/^\+91[\s-]*/, '').replace(/[\s-]/g, '');
        return (
          !query ||
          storedContact.toLowerCase().includes(query) ||
          (cleanPhoneQuery.length > 0 && cleanStoredContact.includes(cleanPhoneQuery))
        );
      };

      // Exact match
      assert.equal(searchMatches(customer.primaryContact, '9876543210'), true);
      // Spaces
      assert.equal(searchMatches(customer.primaryContact, '98765 43210'), true);
      // Hyphens
      assert.equal(searchMatches(customer.primaryContact, '98765-43210'), true);
      // Spaces and hyphens
      assert.equal(searchMatches(customer.primaryContact, '98765 - 43210'), true);
      // +91 prefix
      assert.equal(searchMatches(customer.primaryContact, '+91 98765 43210'), true);
      assert.equal(searchMatches(customer.primaryContact, '+91-98765-43210'), true);
      // Partial search
      assert.equal(searchMatches(customer.primaryContact, '98765'), true);
      assert.equal(searchMatches(customer.primaryContact, '43210'), true);
      // Non-matching query
      assert.equal(searchMatches(customer.primaryContact, '123456'), false);
    });
  });

  describe('6. Invalid Customer Edit IDs', () => {
    it('returns null when querying non-existent customer by ID', () => {
      assert.equal(getStoredCustomerById('D2L-9999'), null);
      assert.equal(getStoredCustomerById('INVALID_ID'), null);
    });

    it('returns error and does not mutate storage when updating non-existent customer ID', () => {
      const res = updateCustomer('D2L-9999', { fullName: 'Nobody' });
      assert.equal(res.success, false);
      assert.equal(res.error, 'Customer with ID D2L-9999 was not found.');
      assert.equal(getStoredCustomers().length, 0);
    });
  });

  describe('7. JSON Export Operation', () => {
    it('exports a valid payload with metadata containing all customer records', () => {
      addCustomer({
        fullName: 'Export User One',
        age: 30,
        gender: 'Male',
        primaryContact: '9876543210',
        occupation: 'Engineer',
        category: 'Professional',
      });
      addCustomer({
        fullName: 'Export User Two',
        age: 28,
        gender: 'Female',
        primaryContact: '8765432109',
        occupation: 'Designer',
        category: 'Self-employed',
      });

      const { count, success, payload } = exportCustomersToJSON();
      assert.equal(success, true);
      assert.equal(count, 2);
      assert.equal(payload.app, 'Door2Life');
      assert.equal(payload.version, '1.0');
      assert.equal(payload.totalRecords, 2);
      assert.equal(Array.isArray(payload.data), true);
      assert.equal(payload.data.length, 2);
      assert.ok(payload.data.some((c) => c.fullName === 'Export User One'));
      assert.ok(payload.data.some((c) => c.fullName === 'Export User Two'));

      // Verify JSON serialization produces valid JSON
      const jsonStr = JSON.stringify(payload);
      const parsed = JSON.parse(jsonStr);
      assert.equal(parsed.totalRecords, 2);
    });
  });

  describe('8. JSON Import Format and Data Validation', () => {
    it('validates a standard Door2Life JSON export payload', () => {
      const validPayload = {
        app: 'Door2Life',
        version: '1.0',
        totalRecords: 1,
        data: [
          {
            id: 'D2L-1001',
            fullName: 'Anita Roy',
            age: 35,
            gender: 'Female',
            primaryContact: '9123456780',
            occupation: 'Architect',
            category: 'Professional',
          },
        ],
      };

      const res = validateCustomerImport(validPayload);
      assert.equal(res.isValid, true);
      assert.equal(res.validRecords.length, 1);
      assert.equal(res.invalidRecords.length, 0);
      assert.equal(res.fileMetadata?.app, 'Door2Life');
    });

    it('validates direct arrays of customers', () => {
      const rawArray = [
        {
          fullName: 'Direct Array User',
          age: 25,
          gender: 'Male',
          primaryContact: '9812345678',
          occupation: 'Consultant',
          category: 'Professional',
        },
      ];

      const res = validateCustomerImport(rawArray);
      assert.equal(res.isValid, true);
      assert.equal(res.validRecords.length, 1);
      assert.equal(res.validRecords[0].fullName, 'Direct Array User');
    });

    it('rejects invalid JSON structure: non-object or missing data/customers array', () => {
      assert.equal(validateCustomerImport(null).isValid, false);
      assert.equal(validateCustomerImport('string').isValid, false);
      assert.equal(validateCustomerImport({ randomKey: [] }).isValid, false);
    });

    it('rejects empty arrays with clear error', () => {
      const res = validateCustomerImport([]);
      assert.equal(res.isValid, false);
      assert.equal(res.error, 'The imported file contains zero customer records.');
    });

    it('flags invalid rows with specific error messages', () => {
      const mixedPayload = {
        data: [
          { fullName: 'V', age: 30, gender: 'Male', primaryContact: '9876543210', occupation: 'Dev', category: 'Professional' }, // Name too short
          { fullName: 'Valid User', age: 150, gender: 'Male', primaryContact: '9876543211', occupation: 'Dev', category: 'Professional' }, // Age invalid
          { fullName: 'Valid User', age: 30, gender: 'InvalidGender', primaryContact: '9876543212', occupation: 'Dev', category: 'Professional' }, // Gender invalid
          { fullName: 'Valid User', age: 30, gender: 'Male', primaryContact: '12345', occupation: 'Dev', category: 'Professional' }, // Phone invalid
          { fullName: 'Valid User', age: 30, gender: 'Male', primaryContact: '9876543213', occupation: '', category: 'Professional' }, // Occupation empty
          { fullName: 'Valid User', age: 30, gender: 'Male', primaryContact: '9876543214', occupation: 'Dev', category: 'InvalidCat' }, // Category invalid
          { fullName: 'Valid User', age: 30, gender: 'Male', primaryContact: '9876543215', occupation: 'Dev', category: 'Professional', email: 'not-an-email' }, // Email format invalid
        ],
      };

      const res = validateCustomerImport(mixedPayload);
      assert.equal(res.invalidRecords.length, 7);
      assert.equal(res.validRecords.length, 0);
    });

    it('detects duplicate phone numbers and duplicate IDs within the file itself', () => {
      const payloadWithInternalDuplicates = {
        data: [
          { id: 'D2L-1001', fullName: 'User One', age: 30, gender: 'Male', primaryContact: '9876543210', occupation: 'Dev', category: 'Professional' },
          { id: 'D2L-1001', fullName: 'User Duplicate ID', age: 32, gender: 'Female', primaryContact: '9876543211', occupation: 'Dev', category: 'Professional' },
          { id: 'D2L-1002', fullName: 'User Duplicate Phone', age: 33, gender: 'Male', primaryContact: '9876543210', occupation: 'Dev', category: 'Professional' },
        ],
      };

      const res = validateCustomerImport(payloadWithInternalDuplicates);
      assert.equal(res.validRecords.length, 1);
      assert.equal(res.invalidRecords.length, 2);
    });
  });

  describe('9. Safe Duplicate ID Handling and Merge Execution', () => {
    it('detects duplicate IDs and duplicate phones against existing localStorage records', () => {
      addCustomer({
        fullName: 'Existing Record',
        age: 40,
        gender: 'Male',
        primaryContact: '9876543210',
        occupation: 'Director',
        category: 'Business Owner',
      }); // Gets D2L-1001

      const importPayload = {
        data: [
          {
            id: 'D2L-1001',
            fullName: 'Import Collision Record',
            age: 29,
            gender: 'Female',
            primaryContact: '9123456789',
            occupation: 'Manager',
            category: 'Professional',
          },
          {
            fullName: 'Import Phone Collision',
            age: 35,
            gender: 'Male',
            primaryContact: '9876543210', // Collides with existing
            occupation: 'Specialist',
            category: 'Professional',
          },
          {
            id: 'D2L-2000',
            fullName: 'Brand New Record',
            age: 26,
            gender: 'Female',
            primaryContact: '7999888777',
            occupation: 'Analyst',
            category: 'Professional',
          },
        ],
      };

      const validation = validateCustomerImport(importPayload);
      assert.equal(validation.duplicateIdCount, 1);
      assert.equal(validation.duplicateIds[0], 'D2L-1001');
      assert.equal(validation.duplicatePhoneCount, 1);
      assert.equal(validation.newUniqueRecords.length, 1);
      assert.equal(validation.newUniqueRecords[0].fullName, 'Brand New Record');
    });

    it('safely merges with skip-duplicates: never overwrites or deletes existing customer data', () => {
      const orig = addCustomer({
        fullName: 'Existing Record',
        age: 40,
        gender: 'Male',
        primaryContact: '9876543210',
        occupation: 'Director',
        category: 'Business Owner',
      });
      assert.ok(orig.customer);

      const importPayload = {
        data: [
          {
            id: orig.customer.id,
            fullName: 'Attempted Overwrite Record',
            age: 99,
            gender: 'Female',
            primaryContact: '9123456789',
            occupation: 'Hacker',
            category: 'Student',
          },
          {
            fullName: 'Unique New Customer',
            age: 24,
            gender: 'Male',
            primaryContact: '8888877777',
            occupation: 'Junior Analyst',
            category: 'Student',
          },
        ],
      };

      const validation = validateCustomerImport(importPayload);
      const execution = importCustomers(validation.validRecords, 'skip-duplicates');

      assert.equal(execution.success, true);
      assert.equal(execution.addedCount, 1);
      assert.equal(execution.skippedCount, 1);

      // Verify existing record was untouched
      const stored = getStoredCustomerById(orig.customer.id);
      assert.ok(stored);
      assert.equal(stored.fullName, 'Existing Record');
      assert.equal(stored.age, 40);

      // Verify new record was added with a non-colliding sequential ID
      const allStored = getStoredCustomers();
      assert.equal(allStored.length, 2);
      assert.ok(allStored.some((c) => c.fullName === 'Unique New Customer'));
    });

    it('merges with merge-overwrite: updates matching IDs and preserves non-matching', () => {
      const orig = addCustomer({
        fullName: 'Existing User',
        age: 30,
        gender: 'Male',
        primaryContact: '9876543210',
        occupation: 'Engineer',
        category: 'Professional',
      });
      assert.ok(orig.customer);

      const importPayload = {
        data: [
          {
            id: orig.customer.id,
            fullName: 'Updated Existing User',
            age: 31,
            gender: 'Male',
            primaryContact: '9876543210',
            occupation: 'Senior Engineer',
            category: 'Professional',
          },
        ],
      };

      const validation = validateCustomerImport(importPayload);
      const execution = importCustomers(validation.validRecords, 'merge-overwrite');

      assert.equal(execution.success, true);
      assert.equal(execution.updatedCount, 1);
      assert.equal(execution.addedCount, 0);

      const stored = getStoredCustomerById(orig.customer.id);
      assert.ok(stored);
      assert.equal(stored.fullName, 'Updated Existing User');
      assert.equal(stored.occupation, 'Senior Engineer');
      assert.equal(stored.age, 31);
    });
  });

  describe('6. Follow-up Management & Storage (door2life_followups_v1)', () => {
    it('generates sequential follow-up IDs starting at FU-1001', () => {
      assert.equal(generateFollowUpId(), 'FU-1001');

      const fu1 = addFollowUp({
        customerId: 'D2L-1001',
        customerName: 'Marcus Brody',
        taskTitle: 'Verify identity documents',
        dueDate: '2026-10-28',
        channel: 'Phone Call',
        priority: 'High',
      });
      assert.equal(fu1.success, true);
      assert.equal(fu1.followUp?.id, 'FU-1001');

      assert.equal(generateFollowUpId(), 'FU-1002');
    });

    it('persists follow-ups under door2life_followups_v1 key and links to customer', () => {
      const added = addFollowUp({
        customerId: 'D2L-1002',
        customerName: 'Eleanor Vance',
        customerPhone: '9876543210',
        taskTitle: 'Policy onboarding check-in',
        dueDate: '2026-10-29',
        channel: 'Email',
        priority: 'Medium',
        notes: 'Check if annual review is required.',
      });
      assert.equal(added.success, true);

      const raw = mockStorage.getItem(FOLLOWUPS_STORAGE_KEY);
      assert.ok(raw);
      const parsed = JSON.parse(raw);
      assert.equal(Array.isArray(parsed), true);
      assert.equal(parsed.length, 1);
      assert.equal(parsed[0].customerId, 'D2L-1002');

      const customerFollowUps = getFollowUpsByCustomerId('D2L-1002');
      assert.equal(customerFollowUps.length, 1);
      assert.equal(customerFollowUps[0].taskTitle, 'Policy onboarding check-in');
    });

    it('updates, reschedules, completes and deletes follow-ups', () => {
      const created = addFollowUp({
        customerId: 'D2L-1003',
        customerName: 'Arthur Pendelton',
        taskTitle: 'Initial orientation',
        dueDate: '2026-10-30',
        channel: 'Phone Call',
        priority: 'Normal',
      });
      assert.ok(created.followUp);
      const fuId = created.followUp.id;

      // Reschedule
      const updated = updateFollowUp(fuId, {
        dueDate: '2026-11-05',
        dueTime: '15:30',
        notes: 'Rescheduled upon customer request',
      });
      assert.equal(updated.success, true);
      assert.equal(updated.followUp?.dueDate, '2026-11-05');
      assert.equal(updated.followUp?.dueTime, '15:30');

      // Complete
      const completed = completeFollowUp(fuId);
      assert.equal(completed, true);
      const stored = getStoredFollowUps().find((f) => f.id === fuId);
      assert.equal(stored?.status, 'Completed');
      assert.ok(stored?.completedAt);

      // Delete
      const deleted = deleteFollowUp(fuId);
      assert.equal(deleted, true);
      const remaining = getStoredFollowUps().find((f) => f.id === fuId);
      assert.equal(remaining, undefined);
    });
  });

  describe('7. CSV Import & Export (RFC-4180)', () => {
    it('exports customers to valid RFC-4180 CSV with headers and escaped fields', () => {
      addCustomer({
        fullName: 'Dr. John Watson, M.D.',
        age: 42,
        gender: 'Male',
        primaryContact: '9876543210',
        occupation: 'Physician',
        category: 'Professional',
        location: 'Baker Street, London',
        notes: 'Note with "quotes" and, commas.',
      });

      const exportResult = exportCustomersToCSV();
      assert.equal(exportResult.success, true);
      assert.equal(exportResult.count, 1);

      const lines = exportResult.csvString.split('\r\n');
      assert.ok(lines.length >= 2);
      assert.equal(lines[0], 'Customer ID,Full Name,Age,Gender,Primary Contact,Email,Occupation,Category,Location,Interests,Notes,Created At,Last Updated');

      // Verify quoted fields containing commas and quotes
      assert.ok(lines[1].includes('"Dr. John Watson, M.D."'));
      assert.ok(lines[1].includes('"Baker Street, London"'));
      assert.ok(lines[1].includes('"Note with ""quotes"" and, commas."'));
    });

    it('parseCSV handles commas inside quotes, escaped quotes, and newlines', () => {
      const csvInput = [
        'Customer ID,Full Name,Age,Gender,Primary Contact,Occupation,Category,Notes',
        'D2L-2001,"Sherlock Holmes",38,Male,9876543211,Detective,Professional,"Address: 221B Baker St\nCase: Red-Headed League"',
        'D2L-2002,"Watson, John",40,Male,9876543212,Doctor,Professional,"Said ""Elementary!"" to Holmes"',
      ].join('\r\n');

      const parsed = parseCSV(csvInput);
      assert.equal(parsed.length, 2);
      assert.equal(parsed[0].fullName, 'Sherlock Holmes');
      assert.equal(parsed[0].notes, 'Address: 221B Baker St\nCase: Red-Headed League');
      assert.equal(parsed[1].fullName, 'Watson, John');
      assert.equal(parsed[1].notes, 'Said "Elementary!" to Holmes');
    });

    it('validates CSV import, detects duplicates against localStorage, and skips safely', () => {
      addCustomer({
        fullName: 'Existing Resident',
        age: 35,
        gender: 'Female',
        primaryContact: '9876543210',
        occupation: 'Architect',
        category: 'Professional',
      });

      const csvContent = [
        'Customer ID,Full Name,Age,Gender,Primary Contact,Occupation,Category',
        'D2L-9999,"Existing Resident",35,Female,9876543210,Architect,Professional', // duplicate phone
        'D2L-3001,"New Unique User",29,Male,9876543213,Engineer,Entrepreneur',
      ].join('\n');

      const validation = validateCustomerCSVImport(csvContent);
      assert.equal(validation.isValid, true);
      assert.equal(validation.validRecords.length, 2);
      assert.equal(validation.duplicatePhoneCount, 1);
      assert.equal(validation.newUniqueRecords.length, 1);

      // Default safe merge skips duplicates
      const result = importCustomers(validation.validRecords, 'skip-duplicates');
      assert.equal(result.success, true);
      assert.equal(result.addedCount, 1);
      assert.equal(result.skippedCount, 1);

      const all = getStoredCustomers();
      assert.equal(all.length, 2);
    });
  });

  describe('8. Customer Directory Pagination & Sorting Logic', () => {
    it('calculates correct pagination slices for 10, 25, 50 rows per page', () => {
      const testList = Array.from({ length: 45 }, (_, i) => ({
        id: `D2L-${1000 + i}`,
        fullName: `Customer ${i + 1}`,
      }));

      // Page size 10: page 1 has 10, page 5 has 5
      const pageSize10 = 10;
      const totalPages10 = Math.ceil(testList.length / pageSize10);
      assert.equal(totalPages10, 5);
      const page1 = testList.slice(0, 10);
      assert.equal(page1.length, 10);
      const page5 = testList.slice(40, 50);
      assert.equal(page5.length, 5);

      // Page size 25: page 1 has 25, page 2 has 20
      const pageSize25 = 25;
      const totalPages25 = Math.ceil(testList.length / pageSize25);
      assert.equal(totalPages25, 2);
      const page2 = testList.slice(25, 50);
      assert.equal(page2.length, 20);
    });

    it('correctly sorts customers by Name, ID, Category, and Date ascending/descending', () => {
      const c1 = { id: 'D2L-1001', fullName: 'Zara Khan', category: 'Student', createdAt: '2026-01-01T00:00:00Z' };
      const c2 = { id: 'D2L-1002', fullName: 'Aaron Paul', category: 'Investor', createdAt: '2026-02-01T00:00:00Z' };
      const c3 = { id: 'D2L-1010', fullName: 'Bella Swan', category: 'Entrepreneur', createdAt: '2026-03-01T00:00:00Z' };

      const list = [c1, c2, c3];

      // Sort by fullName asc
      const sortedNameAsc = [...list].sort((a, b) => a.fullName.localeCompare(b.fullName));
      assert.equal(sortedNameAsc[0].fullName, 'Aaron Paul');
      assert.equal(sortedNameAsc[2].fullName, 'Zara Khan');

      // Sort by id desc
      const sortedIdDesc = [...list].sort((a, b) => {
        const numA = parseInt(a.id.replace(/\D/g, ''), 10);
        const numB = parseInt(b.id.replace(/\D/g, ''), 10);
        return numB - numA;
      });
      assert.equal(sortedIdDesc[0].id, 'D2L-1010');
      assert.equal(sortedIdDesc[2].id, 'D2L-1001');

      // Sort by category asc
      const sortedCatAsc = [...list].sort((a, b) => a.category.localeCompare(b.category));
      assert.equal(sortedCatAsc[0].category, 'Entrepreneur');
      assert.equal(sortedCatAsc[2].category, 'Student');
    });
  });

  describe('9. Team Members LocalStorage Service (door2life_team_v1)', () => {
    it('seeds default team members when storage is empty', () => {
      const members = getStoredTeamMembers();
      assert.ok(members.length >= 4, 'Should initialize with default team members');
      assert.equal(members[0].id, 'TM-01');
      assert.equal(members[0].name, 'Sarah Jenkins');
      assert.equal(members[0].role, 'Platform Administrator');
    });

    it('generates sequential team member IDs (TM-01, TM-02, ...)', () => {
      saveTeamMembers([]);
      assert.equal(generateTeamMemberId(), 'TM-01');

      addTeamMember({
        name: 'Rohan Mehra',
        role: 'Field Agent',
        email: 'rohan@door2life.io',
        phone: '9876543210',
        status: 'Active',
      });
      assert.equal(generateTeamMemberId(), 'TM-02');
    });

    it('adds a new team member and computes initials', () => {
      saveTeamMembers([]);
      const res = addTeamMember({
        name: 'Anita Verma',
        role: 'Verification Officer',
        email: 'anita@door2life.io',
        phone: '9876543210',
        status: 'Active',
      });

      assert.equal(res.success, true);
      assert.ok(res.member);
      assert.equal(res.member.name, 'Anita Verma');
      assert.equal(res.member.initials, 'AV');
      assert.equal(res.member.id, 'TM-01');

      const all = getStoredTeamMembers();
      assert.equal(all.length, 1);
      assert.equal(all[0].name, 'Anita Verma');
    });

    it('updates team member details and status', () => {
      saveTeamMembers([]);
      const res = addTeamMember({
        name: 'Vikram Seth',
        role: 'Field Supervisor',
        email: 'vikram@door2life.io',
        phone: '9876543210',
        status: 'Active',
      });

      const memberId = res.member!.id;
      const updateRes = updateTeamMember(memberId, {
        role: 'Senior Field Supervisor',
        phone: '9876543211',
      });
      assert.equal(updateRes.success, true);

      let member = getStoredTeamMembers().find((m) => m.id === memberId);
      assert.equal(member?.role, 'Senior Field Supervisor');
      assert.equal(member?.phone, '9876543211');

      // Update status
      const statusRes = updateTeamMemberStatus(memberId, 'On Field');
      assert.equal(statusRes.success, true);

      member = getStoredTeamMembers().find((m) => m.id === memberId);
      assert.equal(member?.status, 'On Field');
    });

    it('deletes a team member with confirmation', () => {
      saveTeamMembers([]);
      const res = addTeamMember({
        name: 'Temporary Agent',
        role: 'Field Intern',
        email: 'temp@door2life.io',
        phone: '9876543210',
        status: 'Inactive',
      });
      const memberId = res.member!.id;
      assert.equal(getStoredTeamMembers().length, 1);

      const delRes = deleteTeamMember(memberId);
      assert.equal(delRes, true);
      assert.equal(getStoredTeamMembers().length, 0);
    });
  });

  describe('10. Organization Settings & Customer Categories (door2life_settings_v1)', () => {
    it('seeds default organization settings and categories', () => {
      const settings = getStoredSettings();
      assert.equal(settings.organization.orgName, 'Door2Life Global Foundation');
      assert.equal(settings.organization.locale, 'en-IN');
      assert.ok(settings.categories.includes('Business Owner'));
      assert.ok(settings.categories.includes('Student'));
    });

    it('updates organization settings parameters', () => {
      const ok = updateOrganizationSettings({
        orgName: 'Door2Life India Field Mission',
        supportEmail: 'ops@door2life.in',
        hotline: '+91 80 4000 1234',
        followUpReminderDays: 5,
      });
      assert.equal(ok, true);

      const updated = getStoredSettings();
      assert.equal(updated.organization.orgName, 'Door2Life India Field Mission');
      assert.equal(updated.organization.supportEmail, 'ops@door2life.in');
      assert.equal(updated.organization.hotline, '+91 80 4000 1234');
      assert.equal(updated.organization.followUpReminderDays, 5);
    });

    it('adds a new unique category', () => {
      const res = addCategory('Micro-Financed Artisan');
      assert.equal(res.success, true);

      const settings = getStoredSettings();
      assert.ok(settings.categories.includes('Micro-Financed Artisan'));

      // Duplicate category should fail
      const dup = addCategory('Micro-Financed Artisan');
      assert.equal(dup.success, false);
      assert.ok(dup.error?.includes('already exists'));
    });

    it('renames a category and automatically migrates existing customer records', () => {
      // Setup customer with 'Investor' category
      addCustomer({
        fullName: 'Rajesh Mehra',
        age: 48,
        gender: 'Male',
        primaryContact: '9876543210',
        occupation: 'Angel Investor',
        category: 'Investor',
      });

      const customersBefore = getStoredCustomers();
      assert.equal(customersBefore[0].category, 'Investor');

      // Rename 'Investor' to 'Angel & Venture Investor'
      const renameRes = updateCategory('Investor', 'Angel & Venture Investor');
      assert.equal(renameRes.success, true);
      assert.equal(renameRes.affectedCount, 1);

      // Verify category in settings
      const settings = getStoredSettings();
      assert.ok(settings.categories.includes('Angel & Venture Investor'));
      assert.ok(!settings.categories.includes('Investor'));

      // Verify existing customer was migrated automatically
      const customersAfter = getStoredCustomers();
      assert.equal(customersAfter[0].category, 'Angel & Venture Investor');
    });

    it('prevents deleting an in-use category without reassignment', () => {
      addCustomer({
        fullName: 'Kavita Rao',
        age: 29,
        gender: 'Female',
        primaryContact: '9876543211',
        occupation: 'Software Engineer',
        category: 'Professional',
      });

      const { inUse, count } = isCategoryInUse('Professional');
      assert.equal(inUse, true);
      assert.equal(count, 1);

      // Attempt deletion without reassignment
      const delAttempt = deleteCategory('Professional');
      assert.equal(delAttempt.success, false);
      assert.ok(delAttempt.error?.includes('used by 1 customer'));

      // Deletion with explicit reassignment to 'General Customer'
      const delSuccess = deleteCategory('Professional', 'General Customer');
      assert.equal(delSuccess.success, true);
      assert.equal(delSuccess.affectedCount, 1);

      // Verify customer reassigned
      const customer = getStoredCustomers().find((c) => c.fullName === 'Kavita Rao');
      assert.equal(customer?.category, 'General Customer');

      // Verify category removed from settings
      assert.ok(!getStoredSettings().categories.includes('Professional'));
    });

    it('deletes an unused category directly', () => {
      addCategory('Temporary Test Category');
      assert.ok(getStoredSettings().categories.includes('Temporary Test Category'));

      const del = deleteCategory('Temporary Test Category');
      assert.equal(del.success, true);
      assert.ok(!getStoredSettings().categories.includes('Temporary Test Category'));
    });
  });

  describe('11. Custom Intake Fields Service (door2life_settings_v1)', () => {
    it('manages custom field definitions (add, update, delete)', () => {
      // Add custom field
      const addRes = addCustomField({
        label: 'Aadhaar / Voter ID Number',
        type: 'text',
        required: true,
        placeholder: 'e.g. 1234-5678-9012',
      });
      assert.equal(addRes.success, true);
      assert.ok(addRes.field);
      const fieldId = addRes.field.id;

      let settings = getStoredSettings();
      assert.ok(settings.customFields.some((f) => f.id === fieldId));

      // Update custom field
      const updateRes = updateCustomField(fieldId, {
        label: 'Government Photo ID Number',
        required: false,
      });
      assert.equal(updateRes.success, true);

      settings = getStoredSettings();
      const updated = settings.customFields.find((f) => f.id === fieldId);
      assert.equal(updated?.label, 'Government Photo ID Number');
      assert.equal(updated?.required, false);

      // Delete custom field
      const delRes = deleteCustomField(fieldId);
      assert.equal(delRes, true);

      settings = getStoredSettings();
      assert.ok(!settings.customFields.some((f) => f.id === fieldId));
    });
  });

  describe('12. Unified Local Backup, Validation & Factory Reset', () => {
    it('creates and validates a complete system backup package', () => {
      // Add test customer and follow-up
      const custRes = addCustomer({
        fullName: 'Meera Iyer',
        age: 33,
        gender: 'Female',
        primaryContact: '9876543212',
        occupation: 'Architect',
        category: 'Business Owner',
      });

      addFollowUp({
        customerId: custRes.customer!.id,
        customerName: 'Meera Iyer',
        customerPhone: '9876543212',
        taskTitle: 'Site review check-in',
        dueDate: '2026-11-01',
        channel: 'Phone Call',
        priority: 'High',
      });

      const backup = createCompleteBackup();
      assert.equal(backup.app, 'Door2Life');
      assert.equal(backup.backupVersion, '2.0');
      assert.equal(backup.storage.customers.length, 1);
      assert.equal(backup.storage.followUps.length, 1);

      // Validate the backup
      const val = validateCompleteBackup(backup);
      assert.equal(val.isValid, true);
      assert.ok(val.summary);
      assert.equal(val.summary.customerCount, 1);
      assert.equal(val.summary.followUpCount, 1);
    });

    it('rejects invalid or corrupted backup payloads', () => {
      assert.equal(validateCompleteBackup(null).isValid, false);
      assert.equal(validateCompleteBackup({ random: 'data' }).isValid, false);
      assert.equal(validateCompleteBackup({ app: 'DifferentApp' }).isValid, false);
    });

    it('restores complete system state from backup', () => {
      addCustomer({
        fullName: 'Meera Iyer',
        age: 33,
        gender: 'Female',
        primaryContact: '9876543212',
        occupation: 'Architect',
        category: 'Business Owner',
      });
      const backup = createCompleteBackup();
      // Clear all data
      mockStorage.clear();
      assert.equal(getStoredCustomers().length, 0);

      // Restore from backup
      const res = restoreCompleteBackup(backup);
      assert.equal(res.success, true);

      // Verify records are restored
      const restoredCustomers = getStoredCustomers();
      assert.ok(restoredCustomers.length >= 1);
      assert.equal(restoredCustomers[0].fullName, 'Meera Iyer');
    });

    it('calculates approximate LocalStorage usage', () => {
      const usage = calculateLocalStorageUsage();
      assert.ok(typeof usage.totalBytes === 'number');
      assert.ok(parseFloat(usage.totalKb) >= 0);
      assert.equal(usage.breakdown.length, 4);
    });

    it('performs factory reset safely restoring clean defaults', () => {
      const resetRes = resetAllLocalStorage();
      assert.equal(resetRes.success, true);
      assert.equal(getStoredCustomers().length, 0);
      assert.equal(getStoredFollowUps().length, 0);
      assert.ok(getStoredSettings().categories.length > 0);
    });
  });

  describe('13. Local Demo Role Access Service (door2life_role_v1)', () => {
    it('defaults to Admin role and persists role changes', () => {
      mockStorage.removeItem(ROLE_STORAGE_KEY);
      assert.equal(getStoredRole(), 'Admin');

      setStoredRole('Team Member');
      assert.equal(getStoredRole(), 'Team Member');

      setStoredRole('Admin');
      assert.equal(getStoredRole(), 'Admin');
    });
  });
});


