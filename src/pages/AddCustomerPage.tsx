import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Check,
  User,
  Briefcase,
  FileCheck2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import type { CustomerFormData, CustomerFormErrors, Gender, CustomerCategory } from '../types/customer';
import {
  addCustomer,
  updateCustomer,
  getStoredCustomerById,
  isContactDuplicate,
  validateIndianMobile,
} from '../services/customerStorage';
import {
  addFollowUp,
  type FollowUpChannel,
  type FollowUpPriority,
} from '../services/followUpStorage';
import { useSettings } from '../services/settingsStorage';
import { useTeamMembers } from '../services/teamStorage';

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

type WizardStep = 1 | 2 | 3 | 4;

export const AddCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();

  const { settings } = useSettings();
  const { activeMembers } = useTeamMembers();
  const dynamicCategories = settings.categories && settings.categories.length > 0 ? settings.categories : CATEGORY_OPTIONS;

  // Determine if editing an existing customer
  const editId = params.id || searchParams.get('edit') || undefined;
  const isEditMode = Boolean(editId);
  const existingCustomer = editId ? getStoredCustomerById(editId) : null;
  const isNotFound = isEditMode && !existingCustomer;

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Form Data State
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

  // Custom fields state
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>(() => {
    return existingCustomer?.customFields ? { ...existingCustomer.customFields } : {};
  });

  const handleCustomFieldChange = (fieldId: string, val: string) => {
    setCustomFieldValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  // Step 3 Optional Follow-up Scheduling State
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpTaskTitle, setFollowUpTaskTitle] = useState('Welcome check-in and documentation confirmation');
  const [followUpDueDate, setFollowUpDueDate] = useState(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [followUpDueTime, setFollowUpDueTime] = useState('11:00');
  const [followUpChannel, setFollowUpChannel] = useState<FollowUpChannel>('Phone Call');
  const [followUpPriority, setFollowUpPriority] = useState<FollowUpPriority>('Normal');
  const [followUpAgent, setFollowUpAgent] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Step 4 Consent State
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof CustomerFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    const newErrors: CustomerFormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters.';
    }

    const parsedAge = Number(formData.age);
    if (!formData.age || String(formData.age).trim() === '') {
      newErrors.age = 'Age is required.';
    } else if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
      newErrors.age = 'Age must be a valid whole number between 1 and 120.';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select a gender option.';
    } else if (!GENDER_OPTIONS.includes(formData.gender as Gender)) {
      newErrors.gender = 'Invalid gender option selected.';
    }

    if (!formData.occupation.trim()) {
      newErrors.occupation = 'Occupation is required.';
    }

    const phoneResult = validateIndianMobile(formData.primaryContact);
    if (!phoneResult.isValid) {
      newErrors.primaryContact = phoneResult.error;
    } else if (isContactDuplicate(phoneResult.normalized, editId)) {
      newErrors.primaryContact = `Primary contact ${phoneResult.normalized} is already registered with another customer.`;
    }

    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please provide a valid email address (e.g. name@domain.com).';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = (): boolean => {
    const newErrors: CustomerFormErrors = {};

    if (!formData.category) {
      newErrors.category = 'Please select a customer category.';
    } else if (!dynamicCategories.includes(formData.category as CustomerCategory)) {
      newErrors.category = 'Invalid category selected.';
    }

    // Validate any required custom fields
    if (settings.customFields) {
      for (const field of settings.customFields) {
        if (field.required && !customFieldValues[field.id]?.trim()) {
          newErrors.general = `Custom field "${field.label}" is required.`;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 3 Validation (if follow-up scheduling is selected)
  const validateStep3 = (): boolean => {
    if (!scheduleFollowUp) return true;

    const newErrors: CustomerFormErrors = {};
    if (!followUpTaskTitle.trim()) {
      newErrors.general = 'Please provide a title for the scheduled follow-up.';
    } else if (!followUpDueDate) {
      newErrors.general = 'Please select a valid scheduled due date.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step navigation
  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!validateStep3()) return;
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setErrors({});
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleCancel = () => {
    // Navigate away without saving
    navigate('/customers');
  };

  // Final Save Confirmation (only executed once on Step 4)
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!consentConfirmed) {
      setErrors({ general: 'Please check the consent confirmation box before saving.' });
      return;
    }

    // Comprehensive validation of all required customer data
    if (!validateStep1() || !validateStep2()) {
      setErrors({ general: 'Some required customer fields are incomplete. Please review prior steps.' });
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
      customFields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
    };

    if (isEditMode && editId) {
      const result = updateCustomer(editId, payload);
      if (result.success) {
        // If follow-up scheduled during edit, save it
        if (scheduleFollowUp && followUpTaskTitle.trim() && followUpDueDate) {
          addFollowUp({
            customerId: editId,
            customerName: payload.fullName,
            customerPhone: cleanContact,
            taskTitle: followUpTaskTitle.trim(),
            dueDate: followUpDueDate,
            dueTime: followUpDueTime || undefined,
            channel: followUpChannel,
            priority: followUpPriority,
            agent: followUpAgent.trim() || undefined,
            notes: followUpNotes.trim() || undefined,
          });
        }

        setSaveSuccess(`Customer profile for ${payload.fullName} (${editId}) updated successfully.`);
        setTimeout(() => {
          navigate(`/customers/${editId}`);
        }, 900);
      } else {
        setErrors({ general: result.error || 'Failed to update customer profile.' });
        setIsSubmitting(false);
      }
    } else {
      // Add new customer
      const result = addCustomer(payload);
      if (result.success && result.customer) {
        const newCustomerId = result.customer.id;

        // If follow-up scheduled, connect it with new customer ID
        if (scheduleFollowUp && followUpTaskTitle.trim() && followUpDueDate) {
          addFollowUp({
            customerId: newCustomerId,
            customerName: payload.fullName,
            customerPhone: cleanContact,
            taskTitle: followUpTaskTitle.trim(),
            dueDate: followUpDueDate,
            dueTime: followUpDueTime || undefined,
            channel: followUpChannel,
            priority: followUpPriority,
            agent: followUpAgent.trim() || undefined,
            notes: followUpNotes.trim() || undefined,
          });
        }

        setSaveSuccess(`Customer ${payload.fullName} registered successfully with ID ${newCustomerId}.`);
        setTimeout(() => {
          navigate(`/customers/${newCustomerId}`);
        }, 900);
      } else {
        setErrors({ general: result.error || 'Failed to register customer.' });
        setIsSubmitting(false);
      }
    }
  };

  if (isEditMode && isNotFound) {
    return (
      <div>
        <PageHeader
          title="Customer Not Found"
          description="The requested customer profile could not be located in browser LocalStorage."
          actions={
            <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={handleCancel}>
              Back to Customers
            </Button>
          }
        />
        <div style={{ maxWidth: '640px', margin: '2rem auto' }}>
          <Card>
            <div className="empty-state">
              <div className="empty-state-icon" style={{ backgroundColor: '#fef2f2', color: '#ef4444' }}>
                <AlertCircle size={32} />
              </div>
              <h2 className="empty-state-title" style={{ fontSize: '1.4rem' }}>
                Customer Not Found
              </h2>
              <p className="empty-state-text">
                The customer record with ID <strong>{editId}</strong> could not be found.
              </p>
              <Button variant="primary" icon={<ArrowLeft size={16} />} onClick={handleCancel}>
                Back to Customers
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const stepsMeta = [
    { number: 1, title: 'Personal & Contact', icon: <User size={16} /> },
    { number: 2, title: 'Category & Background', icon: <Briefcase size={16} /> },
    { number: 3, title: 'Follow-up Scheduling', icon: <Calendar size={16} /> },
    { number: 4, title: 'Review & Confirm', icon: <FileCheck2 size={16} /> },
  ];

  return (
    <div>
      <PageHeader
        title={isEditMode ? 'Edit Customer Profile' : 'Add New Customer'}
        description={
          isEditMode
            ? `Update customer profile details for ID: ${editId}.`
            : 'Capture new customer records through a structured 4-step intake wizard.'
        }
        actions={
          <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={handleCancel}>
            Cancel & Exit
          </Button>
        }
      />

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Wizard Step Indicator Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.75rem',
          }}
        >
          {stepsMeta.map((s) => {
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            return (
              <div
                key={s.number}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isCurrent ? 'var(--primary-light)' : isCompleted ? '#f0fdf4' : '#f8fafc',
                  border: isCurrent
                    ? '2px solid var(--primary)'
                    : isCompleted
                    ? '1px solid #bbf7d0'
                    : '1px solid var(--border-subtle)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isCurrent ? 'var(--primary)' : isCompleted ? '#16a34a' : '#e2e8f0',
                    color: isCurrent || isCompleted ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : s.number}
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.7rem', color: isCurrent ? 'var(--primary)' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Step {s.number}
                  </div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: isCurrent ? 700 : 600,
                      color: isCurrent ? 'var(--text-navy)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {s.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Success Banner */}
        {saveSuccess && (
          <div className="ui-alert-banner success" role="status" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>{saveSuccess}</span>
            </div>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Redirecting...</span>
          </div>
        )}

        {/* Global Error Banner */}
        {errors.general && (
          <div className="ui-alert-banner error" role="alert" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} aria-hidden="true" />
              <span>{errors.general}</span>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 1: PERSONAL & CONTACT DETAILS
           =================================================================== */}
        {currentStep === 1 && (
          <Card>
            <CardHeader
              title="Step 1: Personal & Contact Details"
              subtitle="Capture core customer demographics and primary communication channels"
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
                    autoFocus
                  />
                  {errors.fullName && (
                    <span className="form-error-msg" role="alert">
                      <AlertCircle size={13} /> {errors.fullName}
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
                  />
                  {errors.age && (
                    <span className="form-error-msg" role="alert">
                      <AlertCircle size={13} /> {errors.age}
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
                  >
                    <option value="">Select Gender</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  {errors.gender && (
                    <span className="form-error-msg" role="alert">
                      <AlertCircle size={13} /> {errors.gender}
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
                  />
                  {errors.occupation && (
                    <span className="form-error-msg" role="alert">
                      <AlertCircle size={13} /> {errors.occupation}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="primaryContact">
                    Primary Contact Number (10 Digits) <span className="req">*</span>
                  </label>
                  <input
                    id="primaryContact"
                    name="primaryContact"
                    type="tel"
                    inputMode="tel"
                    className={`form-input ${errors.primaryContact ? 'is-invalid' : ''}`}
                    placeholder="e.g. 9876543210 or +91 98765 43210"
                    value={formData.primaryContact}
                    onChange={handleChange}
                  />
                  <span className="form-helper">
                    10-digit Indian mobile number starting with 6, 7, 8, or 9.
                  </span>
                  {errors.primaryContact && (
                    <span className="form-error-msg" role="alert">
                      <AlertCircle size={13} /> {errors.primaryContact}
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
                  />
                  {errors.email && (
                    <span className="form-error-msg" role="alert">
                      <AlertCircle size={13} /> {errors.email}
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
                    placeholder="e.g. Bengaluru, Karnataka or Koramangala 5th Block"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter style={{ justifyContent: 'space-between' }}>
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={<ArrowRight size={16} />}
                iconPosition="right"
                onClick={handleNext}
              >
                Next: Category & Details
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ===================================================================
            STEP 2: CATEGORY, INTERESTS & NOTES
           =================================================================== */}
        {currentStep === 2 && (
          <Card>
            <CardHeader
              title="Step 2: Category & Background Details"
              subtitle="Assign customer classification, service interests, and intake observations"
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
                    autoFocus
                  >
                    <option value="">Select Category</option>
                    {dynamicCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <span className="form-error-msg" role="alert">
                      <AlertCircle size={13} /> {errors.category}
                    </span>
                  )}
                </div>

                <div className="form-group full-width">
                  <label className="form-label" htmlFor="interests">
                    Interests / Service Preferences <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                  </label>
                  <input
                    id="interests"
                    name="interests"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Life Insurance, Term Plan, Retirement Corpus"
                    value={formData.interests}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label" htmlFor="notes">
                    Field Notes & Observations <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    className="form-textarea"
                    placeholder="Enter any relevant background, customer requests, or intake meeting notes..."
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                {settings.customFields && settings.customFields.length > 0 && (
                  <div
                    className="form-group full-width"
                    style={{
                      marginTop: '0.75rem',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-navy)', marginBottom: '0.75rem' }}>
                      Additional Custom Intake Fields
                    </h4>
                    <div className="form-grid">
                      {settings.customFields.map((field) => (
                        <div key={field.id} className={`form-group ${field.type === 'textarea' ? 'full-width' : ''}`}>
                          <label className="form-label" htmlFor={`cf_${field.id}`}>
                            {field.label} {field.required && <span className="req">*</span>}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              id={`cf_${field.id}`}
                              className="form-textarea"
                              rows={2}
                              value={customFieldValues[field.id] || ''}
                              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                            />
                          ) : field.type === 'select' && field.options ? (
                            <select
                              id={`cf_${field.id}`}
                              className="form-select"
                              value={customFieldValues[field.id] || ''}
                              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            >
                              <option value="">Select an option</option>
                              {field.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={`cf_${field.id}`}
                              type={field.type === 'number' ? 'number' : 'text'}
                              className="form-input"
                              value={customFieldValues[field.id] || ''}
                              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter style={{ justifyContent: 'space-between' }}>
              <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={handleBack}>
                Back: Personal Details
              </Button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={<ArrowRight size={16} />}
                  iconPosition="right"
                  onClick={handleNext}
                >
                  Next: Follow-up Scheduling
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* ===================================================================
            STEP 3: OPTIONAL FOLLOW-UP SCHEDULING
           =================================================================== */}
        {currentStep === 3 && (
          <Card>
            <CardHeader
              title="Step 3: Initial Follow-up Scheduling"
              subtitle="Optionally schedule a touchpoint reminder or onboarding task for this customer"
            />
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Toggle option */}
                <div
                  style={{
                    padding: '1.25rem',
                    backgroundColor: scheduleFollowUp ? 'var(--primary-light)' : '#f8fafc',
                    borderRadius: 'var(--radius-md)',
                    border: scheduleFollowUp ? '1.5px solid var(--primary)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setScheduleFollowUp((prev) => !prev)}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={scheduleFollowUp}
                      onChange={(e) => setScheduleFollowUp(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-navy)' }}>
                        Schedule an initial follow-up task
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Create a reminder for document verification, welcome check-in, or field visit.
                      </div>
                    </div>
                  </label>
                </div>

                {scheduleFollowUp && (
                  <div
                    style={{
                      padding: '1.25rem',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label className="form-label" htmlFor="fuTaskTitle">
                          Task Description <span className="req">*</span>
                        </label>
                        <input
                          id="fuTaskTitle"
                          type="text"
                          className="form-input"
                          value={followUpTaskTitle}
                          onChange={(e) => setFollowUpTaskTitle(e.target.value)}
                          placeholder="e.g. Welcome call and document verification"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="fuDueDate">
                          Scheduled Due Date <span className="req">*</span>
                        </label>
                        <input
                          id="fuDueDate"
                          type="date"
                          className="form-input"
                          value={followUpDueDate}
                          onChange={(e) => setFollowUpDueDate(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="fuDueTime">
                          Scheduled Time (Optional)
                        </label>
                        <input
                          id="fuDueTime"
                          type="time"
                          className="form-input"
                          value={followUpDueTime}
                          onChange={(e) => setFollowUpDueTime(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="fuChannel">
                          Communication Channel
                        </label>
                        <select
                          id="fuChannel"
                          className="form-select"
                          value={followUpChannel}
                          onChange={(e) => setFollowUpChannel(e.target.value as FollowUpChannel)}
                        >
                          <option value="Phone Call">Phone Call</option>
                          <option value="In-Person Visit">In-Person Visit</option>
                          <option value="Email">Email</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="fuPriority">
                          Priority
                        </label>
                        <select
                          id="fuPriority"
                          className="form-select"
                          value={followUpPriority}
                          onChange={(e) => setFollowUpPriority(e.target.value as FollowUpPriority)}
                        >
                          <option value="Normal">Normal</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="fuAgent">
                          Assigned Staff Member
                        </label>
                        <select
                          id="fuAgent"
                          className="form-select"
                          value={followUpAgent}
                          onChange={(e) => setFollowUpAgent(e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {activeMembers.map((member) => (
                            <option key={member.id} value={member.name}>
                              {member.name} ({member.role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group full-width">
                        <label className="form-label" htmlFor="fuNotes">
                          Follow-up Notes (Optional)
                        </label>
                        <textarea
                          id="fuNotes"
                          rows={2}
                          className="form-textarea"
                          value={followUpNotes}
                          onChange={(e) => setFollowUpNotes(e.target.value)}
                          placeholder="Specific action items or details to discuss..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter style={{ justifyContent: 'space-between' }}>
              <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={handleBack}>
                Back: Category Details
              </Button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={<ArrowRight size={16} />}
                  iconPosition="right"
                  onClick={handleNext}
                >
                  Next: Review & Confirm
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* ===================================================================
            STEP 4: REVIEW ALL DETAILS, CONSENT & FINAL SAVE
           =================================================================== */}
        {currentStep === 4 && (
          <form onSubmit={handleFinalSubmit}>
            <Card>
              <CardHeader
                title="Step 4: Review Customer Details & Consent"
                subtitle="Verify all profile fields before saving to browser LocalStorage. Records are saved only upon final confirmation."
              />
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Summary Box 1: Demographics */}
                  <div className="detail-box">
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                      Personal Identity & Contact
                    </h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Full Name</span>
                        <span className="detail-value" style={{ fontWeight: 700, color: 'var(--text-navy)' }}>
                          {formData.fullName}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Age & Gender</span>
                        <span className="detail-value">
                          {formData.age} yrs • {formData.gender}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Primary Contact Number</span>
                        <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                          <Phone size={13} color="var(--primary)" />
                          {formData.primaryContact}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email Address</span>
                        <span className="detail-value">
                          {formData.email ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Mail size={13} color="var(--text-faint)" />
                              {formData.email}
                            </span>
                          ) : (
                            '—'
                          )}
                        </span>
                      </div>
                      <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="detail-label">Location / Address</span>
                        <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <MapPin size={13} color="var(--text-faint)" />
                          {formData.location || 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Box 2: Category & Background */}
                  <div className="detail-box">
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                      Category & Background
                    </h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Occupation</span>
                        <span className="detail-value">{formData.occupation}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Category</span>
                        <span className="detail-value">
                          <Badge variant="primary">{formData.category}</Badge>
                        </span>
                      </div>
                      {formData.interests && (
                        <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="detail-label">Interests & Preferences</span>
                          <span className="detail-value">{formData.interests}</span>
                        </div>
                      )}
                      {formData.notes && (
                        <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="detail-label">Field Notes</span>
                          <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>
                            {formData.notes}
                          </span>
                        </div>
                      )}
                      {settings.customFields && settings.customFields.map((cf) => {
                        const val = customFieldValues[cf.id];
                        if (!val) return null;
                        return (
                          <div key={cf.id} className="detail-item">
                            <span className="detail-label">{cf.label}</span>
                            <span className="detail-value">{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Box 3: Follow-up Scheduling Summary */}
                  <div className="detail-box">
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                      Follow-up Reminder
                    </h4>
                    {scheduleFollowUp ? (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Clock size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-navy)', fontSize: '0.9rem' }}>
                            {followUpTaskTitle}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Scheduled for {followUpDueDate} {followUpDueTime && `at ${followUpDueTime}`} • {followUpChannel} • {followUpPriority} Priority
                            {followUpAgent && ` • Assigned to: ${followUpAgent}`}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        No initial follow-up task scheduled. You can schedule tasks anytime from the Follow-ups page.
                      </span>
                    )}
                  </div>

                  {/* Mandatory Consent Checkbox */}
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: consentConfirmed ? '#f0fdf4' : '#fffbeb',
                      borderRadius: 'var(--radius-md)',
                      border: consentConfirmed ? '1px solid #bbf7d0' : '1px solid #fde68a',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        id="consentConfirmed"
                        checked={consentConfirmed}
                        onChange={(e) => setConsentConfirmed(e.target.checked)}
                        style={{ marginTop: '0.2rem', width: '18px', height: '18px', accentColor: '#16a34a' }}
                        required
                      />
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-navy)', lineHeight: 1.5 }}>
                        <strong>Customer Consent Confirmation:</strong> I confirm that customer{' '}
                        <strong>{formData.fullName}</strong> has consented to data intake and that all provided
                        information is accurate in accordance with Door2Life data policies.
                      </div>
                    </label>
                  </div>
                </div>
              </CardContent>
              <CardFooter style={{ justifyContent: 'space-between' }}>
                <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={handleBack} disabled={isSubmitting}>
                  Back: Follow-up
                </Button>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting || !consentConfirmed}
                    icon={isEditMode ? <UserCheck size={16} /> : <Save size={16} />}
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : isEditMode
                      ? 'Confirm & Update Profile'
                      : 'Confirm & Save Customer'}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
};
