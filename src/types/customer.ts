export type Gender = 'Female' | 'Male' | 'Prefer not to say';

export type CustomerCategory =
  | 'Business Owner'
  | 'Student'
  | 'Job Seeker'
  | 'Employee / Working Professional'
  | 'Homemaker'
  | 'Aspiring Entrepreneur'
  | 'Entrepreneur'
  | 'Working Professional'
  | 'Professional'
  | 'Self-employed'
  | 'Investor'
  | 'General Customer'
  | 'Others'
  | 'Other'
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
  categories?: CustomerCategory[];
  customCategory?: string;
  interests?: string;
  notes?: string;
  customFields?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  created_by?: string;
  assignedAgentId?: string;
  assigned_agent_id?: string;
  assignedAgentName?: string;

  // Conditional Business & Enterprise Details
  businessName?: string;
  businessCategory?: string;
  businessCategories?: string[];
  customBusinessCategory?: string;
  businessServices?: string;
  businessLocation?: string;
  businessIdea?: string;

  // Structured Interests & Preferences
  trainingRequired?: boolean;
  mentorshipRequired?: boolean;
  businessExpansion?: boolean;
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
  categories: CustomerCategory[];
  customCategory: string;
  interests: string;
  notes: string;

  // Conditional Business Details
  businessName: string;
  businessCategory: string;
  businessCategories: string[];
  customBusinessCategory: string;
  businessServices: string;
  businessLocation: string;
  businessIdea: string;

  // Structured Preferences
  trainingRequired: boolean;
  mentorshipRequired: boolean;
  businessExpansion: boolean;

  // Assignment
  assignedAgentId?: string;
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
  categories?: string;
  customCategory?: string;
  interests?: string;
  notes?: string;
  businessName?: string;
  businessCategory?: string;
  businessCategories?: string;
  customBusinessCategory?: string;
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

