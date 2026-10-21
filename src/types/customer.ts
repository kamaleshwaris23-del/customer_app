export type Gender = 'Female' | 'Male' | 'Prefer not to say';

export type CustomerCategory =
  | 'Business Owner'
  | 'Entrepreneur'
  | 'Student'
  | 'Professional'
  | 'Self-employed'
  | 'Investor'
  | 'General Customer';

export interface Customer {
  id: string;
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
  createdAt: string;
  updatedAt: string;
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
