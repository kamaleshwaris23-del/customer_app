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
} from '../src/services/customerStorage.ts';

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
});
