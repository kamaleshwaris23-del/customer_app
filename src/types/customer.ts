export type Gender = 'Female' | 'Male' | 'Prefer not to say';

export type CustomerCategory =
  | 'Business Owner'
  | 'Entrepreneur'
  | 'Student'
  | 'Professional'
  | 'Self-employed'
  | 'Investor'
  | 'General Customer'
  | (string & {});

export interface Customer {
  id: string;
  dbId?: string;
  fullName: string;
  age: number;
  gender: Gender;
  primaryContact: string;
  email?: string;
  location?: string;
  occupation: string;
  category: CustomerCategory;
  interests?: string;
  notes?: string;
  customFields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CustomerFormData {
  fullName: string;
  age: string;
  gender: Gender | '';
  primaryContact: string;
  email: string;
  location: string;
  occupation: string;
  category: CustomerCategory | '';
  interests: string;
  notes: string;
}

export interface CustomerFormErrors {
  fullName?: string;
  age?: string;
  gender?: string;
  primaryContact?: string;
  email?: string;
  location?: string;
  occupation?: string;
  category?: string;
  interests?: string;
  notes?: string;
  general?: string;
}

export interface CustomerExportPayload {
  app: string;
  version: string;
  exportVersion: string;
  exportedAt: string;
  totalRecords: number;
  data: Customer[];
}

export type ImportMergeStrategy = 'skip-duplicates' | 'merge-overwrite' | 'full-replace';

export interface CustomerImportValidationResult {
  isValid: boolean;
  error?: string;
  fileMetadata?: {
    app?: string;
    version?: string;
    exportedAt?: string;
    totalRecordsInFile?: number;
  };
  parsedRecords: Customer[];
  validRecords: Customer[];
  invalidRecords: { index: number; data: unknown; error: string }[];
  duplicateIdCount: number;
  duplicatePhoneCount: number;
  duplicateIds: string[];
  duplicatePhones: { phone: string; existingId: string; importId: string }[];
  newUniqueRecords: Customer[];
}

export interface CustomerImportExecutionResult {
  success: boolean;
  strategy: ImportMergeStrategy;
  totalImported: number;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  error?: string;
}

