import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import type { CustomerFormData, CustomerFormErrors, Gender, CustomerCategory } from '../types/customer';
import {
  addCustomer,
  updateCustomer,
  getStoredCustomerById,
  isContactDuplicate,
  validateIndianMobile,
} from '../services/customerStorage';

const CATEGORY_OPTIONS: CustomerCategory[] = [
  'Business Owner',
  'Entrepreneur',
  'Student',
  'Professional',
  'Self-employed',
  'Investor',
  'General Customer',
];

const GENDER_OPTIONS: Gender[] = ['Female', 'Male', 'Prefer not to say'];

export const AddCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();

  // Determine if editing an existing customer
  const editId = params.id || searchParams.get('edit') || undefined;
  const isEditMode = Boolean(editId);
  const existingCustomer = editId ? getStoredCustomerById(editId) : null;
  const isNotFound = isEditMode && !existingCustomer;

  const [formData, setFormData] = useState<CustomerFormData>(() => {
    if (existingCustomer) {
      return {
        fullName: existingCustomer.fullName,
        age: String(existingCustomer.age),
        gender: existingCustomer.gender,
        primaryContact: existingCustomer.primaryContact,
        email: existingCustomer.email || '',
        location: existingCustomer.location || '',
        occupation: existingCustomer.occupation,
        category: existingCustomer.category,
        interests: existingCustomer.interests || '',
        notes: existingCustomer.notes || '',
      };
    }
    return {
      fullName: '',
      age: '',
      gender: '',
      primaryContact: '',
      email: '',
      location: '',
      occupation: '',
      category: '',
      interests: '',
      notes: '',
    };
  });

  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Sync state if editId changes without unmounting
  const [prevEditId, setPrevEditId] = useState(editId);
  if (prevEditId !== editId) {
    setPrevEditId(editId);
    if (existingCustomer) {
      setFormData({
        fullName: existingCustomer.fullName,
        age: String(existingCustomer.age),
        gender: existingCustomer.gender,
        primaryContact: existingCustomer.primaryContact,
        email: existingCustomer.email || '',
        location: existingCustomer.location || '',
        occupation: existingCustomer.occupation,
        category: existingCustomer.category,
        interests: existingCustomer.interests || '',
        notes: existingCustomer.notes || '',
      });
      setErrors({});
    } else if (!editId) {
      setFormData({
        fullName: '',
        age: '',
        gender: '',
        primaryContact: '',
        email: '',
        location: '',
        occupation: '',
        category: '',
        interests: '',
        notes: '',
      });
      setErrors({});
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error as user types
    if (errors[name as keyof CustomerFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: CustomerFormErrors = {};

    // 1. Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    // 2. Age validation: required integer between 1 and 120
    const parsedAge = Number(formData.age);
    if (!formData.age || String(formData.age).trim() === '') {
      newErrors.age = 'Age is required.';
    } else if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      newErrors.age = 'Age must be a valid whole number between 1 and 120.';
    }

    // 3. Gender validation: required dropdown
    if (!formData.gender) {
      newErrors.gender = 'Please select a gender option.';
    } else if (!GENDER_OPTIONS.includes(formData.gender as Gender)) {
      newErrors.gender = 'Invalid gender option selected.';
    }

    // 4. Occupation validation: required
    if (!formData.occupation.trim()) {
      newErrors.occupation = 'Occupation is required.';
    }

    // 5. Primary contact validation: required, Indian mobile number
    const phoneResult = validateIndianMobile(formData.primaryContact);
    if (!phoneResult.isValid) {
      newErrors.primaryContact = phoneResult.error;
    } else if (isContactDuplicate(phoneResult.normalized, editId)) {
      newErrors.primaryContact = `Primary contact ${phoneResult.normalized} is already registered with another customer.`;
    }

    // 6. Category validation: required dropdown
    if (!formData.category) {
      newErrors.category = 'Please select a customer category.';
    } else if (!CATEGORY_OPTIONS.includes(formData.category as CustomerCategory)) {
      newErrors.category = 'Invalid category selected.';
    }

    // 7. Email validation: optional, but must be valid format if provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please provide a valid email address (e.g. name@domain.com).';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const FIELD_ORDER: (keyof CustomerFormErrors)[] = [
        'fullName',
        'age',
        'gender',
        'occupation',
        'primaryContact',
        'email',
        'category',
      ];
      const firstInvalidField = FIELD_ORDER.find((field) => newErrors[field]);
      if (firstInvalidField) {
        const element = document.getElementById(firstInvalidField);
        if (element) {
          element.focus();
        }
      }
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    const phoneResult = validateIndianMobile(formData.primaryContact);
    const cleanContact = phoneResult.isValid ? phoneResult.normalized : formData.primaryContact.trim();

    const payload = {
      fullName: formData.fullName.trim(),
      age: parseInt(String(formData.age), 10),
      gender: formData.gender as Gender,
      primaryContact: cleanContact,
      email: formData.email.trim() || undefined,
      location: formData.location.trim() || undefined,
      occupation: formData.occupation.trim(),
      category: formData.category as CustomerCategory,
      interests: formData.interests.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    if (isEditMode && editId) {
      const result = updateCustomer(editId, payload);
      if (result.success) {
        setSaveSuccess(`Customer ${payload.fullName} (${editId}) updated successfully.`);
        setTimeout(() => {
          navigate('/customers');
        }, 900);
      } else {
        setErrors((prev) => ({ ...prev, general: result.error || 'Failed to update customer.' }));
        setIsSubmitting(false);
      }
    } else {
      const result = addCustomer(payload);
      if (result.success && result.customer) {
        setSaveSuccess(`Customer ${payload.fullName} registered successfully with ID ${result.customer.id}.`);
        setTimeout(() => {
          navigate('/customers');
        }, 900);
      } else {
        setErrors((prev) => ({ ...prev, general: result.error || 'Failed to register customer.' }));
        setIsSubmitting(false);
      }
    }
  };

  if (isEditMode && isNotFound) {
    return (
      <div>
        <PageHeader
          title="Customer Not Found"
          description="The requested customer profile could not be located in the customer directory."
          actions={
            <Button
              variant="secondary"
              icon={<ArrowLeft size={16} />}
              onClick={() => navigate('/customers')}
            >
              Back to Customers
            </Button>
          }
        />

        <div style={{ maxWidth: '640px', margin: '2rem auto' }}>
          <Card>
            <div className="empty-state">
              <div
                className="empty-state-icon"
                style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}
              >
                <AlertCircle size={32} />
              </div>
              <h2 className="empty-state-title" style={{ fontSize: '1.4rem' }}>
                Customer Not Found
              </h2>
              <p
                className="empty-state-text"
                style={{ maxWidth: '480px', marginBottom: '1.75rem', lineHeight: 1.6 }}
              >
                The customer record with ID <strong>{editId}</strong> could not be found. This customer record may have been deleted or the URL may be incorrect.
              </p>
              <Button
                variant="primary"
                icon={<ArrowLeft size={16} />}
                onClick={() => navigate('/customers')}
              >
                Back to Customers
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEditMode ? 'Edit Customer Profile' : 'Add New Customer'}
        description={
          isEditMode
            ? `Update customer profile details for ID: ${editId}.`
            : 'Capture new customer records for Door2Life data collection and relationship management.'
        }
        actions={
          <Button
            variant="secondary"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/customers')}
          >
            Back to Customers
          </Button>
        }
      />

      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        {saveSuccess && (
          <div className="ui-alert-banner success" role="status">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>{saveSuccess}</span>
            </div>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Redirecting...</span>
          </div>
        )}

        {errors.general && (
          <div className="ui-alert-banner error" role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} aria-hidden="true" />
              <span>{errors.general}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Section 1: Core Identity */}
            <Card>
              <CardHeader
                title="1. Personal Identity"
                subtitle="Primary demographic and identification information"
              />
              <CardContent>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="fullName">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      className={`form-input ${errors.fullName ? 'is-invalid' : ''}`}
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.fullName}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.fullName)}
                      aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    />
                    {errors.fullName && (
                      <span id="fullName-error" className="form-error-msg" role="alert">
                        <AlertCircle size={13} aria-hidden="true" /> {errors.fullName}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="age">
                      Age <span className="req">*</span>
                    </label>
                    <input
                      id="age"
                      name="age"
                      type="number"
                      min="1"
                      max="120"
                      className={`form-input ${errors.age ? 'is-invalid' : ''}`}
                      placeholder="e.g. 32"
                      value={formData.age}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.age)}
                      aria-describedby={errors.age ? 'age-error' : undefined}
                    />
                    {errors.age && (
                      <span id="age-error" className="form-error-msg" role="alert">
                        <AlertCircle size={13} aria-hidden="true" /> {errors.age}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="gender">
                      Gender <span className="req">*</span>
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      className={`form-select ${errors.gender ? 'is-invalid' : ''}`}
                      value={formData.gender}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.gender)}
                      aria-describedby={errors.gender ? 'gender-error' : undefined}
                    >
                      <option value="">Select Gender</option>
                      {GENDER_OPTIONS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    {errors.gender && (
                      <span id="gender-error" className="form-error-msg" role="alert">
                        <AlertCircle size={13} aria-hidden="true" /> {errors.gender}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="occupation">
                      Occupation <span className="req">*</span>
                    </label>
                    <input
                      id="occupation"
                      name="occupation"
                      type="text"
                      className={`form-input ${errors.occupation ? 'is-invalid' : ''}`}
                      placeholder="e.g. Software Engineer, Store Owner"
                      value={formData.occupation}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.occupation)}
                      aria-describedby={errors.occupation ? 'occupation-error' : undefined}
                    />
                    {errors.occupation && (
                      <span id="occupation-error" className="form-error-msg" role="alert">
                        <AlertCircle size={13} aria-hidden="true" /> {errors.occupation}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Contact Channels */}
            <Card>
              <CardHeader
                title="2. Contact Details"
                subtitle="Primary communication numbers and email address"
              />
              <CardContent>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="primaryContact">
                      Primary Contact Number (10 Digits) <span className="req">*</span>
                    </label>
                    <input
                      id="primaryContact"
                      name="primaryContact"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      className={`form-input ${errors.primaryContact ? 'is-invalid' : ''}`}
                      placeholder="e.g. 9876543210 or +91 98765 43210"
                      value={formData.primaryContact}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.primaryContact)}
                      aria-describedby={
                        errors.primaryContact
                          ? 'primaryContact-error primaryContact-helper'
                          : 'primaryContact-helper'
                      }
                    />
                    <span id="primaryContact-helper" className="form-helper">
                      Indian mobile number format (10 digits starting with 6, 7, 8, or 9; spaces, hyphens, and +91 prefix accepted).
                    </span>
                    {errors.primaryContact && (
                      <span id="primaryContact-error" className="form-error-msg" role="alert">
                        <AlertCircle size={13} aria-hidden="true" /> {errors.primaryContact}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="email">
                      Email Address <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className={`form-input ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="e.g. customer@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && (
                      <span id="email-error" className="form-error-msg" role="alert">
                        <AlertCircle size={13} aria-hidden="true" /> {errors.email}
                      </span>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="location">
                      Location / Address <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                    </label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Bengaluru, Karnataka or Koramangala, 5th Block"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Classification & Preferences */}
            <Card>
              <CardHeader
                title="3. Category & Customer Background"
                subtitle="Classification and optional field intake notes"
              />
              <CardContent>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="category">
                      Customer Category <span className="req">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                      value={formData.category}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.category)}
                      aria-describedby={errors.category ? 'category-error' : undefined}
                    >
                      <option value="">Select Category</option>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <span id="category-error" className="form-error-msg" role="alert">
                        <AlertCircle size={13} aria-hidden="true" /> {errors.category}
                      </span>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="interests">
                      Interests / Service Preferences{' '}
                      <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                    </label>
                    <input
                      id="interests"
                      name="interests"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Life Insurance, Retirement Planning, Mutual Funds"
                      value={formData.interests}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="notes">
                      Field Notes & Observations{' '}
                      <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      className="form-textarea"
                      placeholder="Add any specific context or customer preferences discussed during intake..."
                      value={formData.notes}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Fields marked with <span style={{ color: '#ef4444' }}>*</span> are required.
                </span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/customers')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting}
                    icon={isEditMode ? <UserCheck size={16} /> : <Save size={16} />}
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : isEditMode
                      ? 'Update Customer Profile'
                      : 'Save Customer Profile'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};
