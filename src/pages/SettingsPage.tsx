import React, { useState, useRef } from 'react';
import {
  Building,
  Tag,
  Sliders,
  HardDrive,
  Save,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
  AlertCircle,
  Shield,
  FileCheck2,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  useSettings,
  updateOrganizationSettings,
  addCategory,
  updateCategory,
  deleteCategory,
  isCategoryInUse,
  addCustomField,
  updateCustomField,
  deleteCustomField,
  calculateLocalStorageUsage,
  downloadCompleteBackup,
  validateCompleteBackup,
  restoreCompleteBackup,
  resetAllLocalStorage,
  type CustomFieldDefinition,
  type CompleteBackupSummary,
  type CompleteBackupPayload,
} from '../services/settingsStorage';
import { useCustomers } from '../services/customerStorage';
import { useFollowUps } from '../services/followUpStorage';
import { useTeamMembers } from '../services/teamStorage';
import { useDemoRole } from '../services/roleStorage';

type SettingsTab = 'general' | 'categories' | 'fields' | 'backup';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { isAdmin } = useDemoRole();

  const { categories, customFields, organization, refresh } = useSettings();
  const { customers } = useCustomers();
  const { followUps } = useFollowUps();
  const { team } = useTeamMembers();

  // Storage metrics
  const storageUsage = calculateLocalStorageUsage();

  // =========================================================================
  // Organization Tab State
  // =========================================================================
  const [orgFormData, setOrgFormData] = useState(() => ({
    orgName: organization.orgName,
    supportEmail: organization.supportEmail,
    hotline: organization.hotline,
    locale: organization.locale,
    timezone: organization.timezone,
    followUpReminderDays: organization.followUpReminderDays,
  }));
  const [orgSaveSuccess, setOrgSaveSuccess] = useState(false);

  const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOrgFormData((prev) => ({
      ...prev,
      [name]: name === 'followUpReminderDays' ? parseInt(value, 10) || 1 : value,
    }));
    setOrgSaveSuccess(false);
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const ok = updateOrganizationSettings(orgFormData);
    if (ok) {
      setOrgSaveSuccess(true);
      setTimeout(() => setOrgSaveSuccess(false), 3500);
    }
  };

  // =========================================================================
  // Categories Modal State
  // =========================================================================
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catError, setCatError] = useState<string | null>(null);

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [reassignCategoryTo, setReassignCategoryTo] = useState<string>('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    const res = addCategory(newCatName);
    if (res.success) {
      setNewCatName('');
      setShowAddCatModal(false);
      refresh();
    } else {
      setCatError(res.error || 'Failed to add category.');
    }
  };

  const handleRenameCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setCatError(null);
    const res = updateCategory(editingCategory, editCatName);
    if (res.success) {
      setEditingCategory(null);
      setEditCatName('');
      refresh();
    } else {
      setCatError(res.error || 'Failed to rename category.');
    }
  };

  const handleDeleteCategory = () => {
    if (!deletingCategory) return;
    setCatError(null);
    const res = deleteCategory(deletingCategory, reassignCategoryTo || undefined);
    if (res.success) {
      setDeletingCategory(null);
      setReassignCategoryTo('');
      refresh();
    } else {
      setCatError(res.error || 'Failed to delete category.');
    }
  };

  // =========================================================================
  // Custom Fields Modal State
  // =========================================================================
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldFormData, setFieldFormData] = useState<{
    label: string;
    type: 'text' | 'number' | 'select' | 'textarea';
    required: boolean;
    optionsText: string;
    placeholder: string;
  }>({
    label: '',
    type: 'text',
    required: false,
    optionsText: '',
    placeholder: '',
  });
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleOpenAddField = () => {
    setFieldFormData({
      label: '',
      type: 'text',
      required: false,
      optionsText: '',
      placeholder: '',
    });
    setEditingFieldId(null);
    setFieldError(null);
    setShowAddFieldModal(true);
  };

  const handleOpenEditField = (field: CustomFieldDefinition) => {
    setEditingFieldId(field.id);
    setFieldFormData({
      label: field.label,
      type: field.type,
      required: field.required,
      optionsText: (field.options || []).join(', '),
      placeholder: field.placeholder || '',
    });
    setFieldError(null);
    setShowAddFieldModal(true);
  };

  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldFormData.label.trim()) {
      setFieldError('Field label is required.');
      return;
    }

    const options =
      fieldFormData.type === 'select'
        ? fieldFormData.optionsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    if (fieldFormData.type === 'select' && (!options || options.length === 0)) {
      setFieldError('Please specify at least one option for select field (comma-separated).');
      return;
    }

    if (editingFieldId) {
      const res = updateCustomField(editingFieldId, {
        label: fieldFormData.label.trim(),
        type: fieldFormData.type,
        required: fieldFormData.required,
        options,
        placeholder: fieldFormData.placeholder.trim() || undefined,
      });
      if (res.success) {
        setShowAddFieldModal(false);
        refresh();
      } else {
        setFieldError(res.error || 'Failed to update custom field.');
      }
    } else {
      const res = addCustomField({
        label: fieldFormData.label.trim(),
        type: fieldFormData.type,
        required: fieldFormData.required,
        options,
        placeholder: fieldFormData.placeholder.trim() || undefined,
      });
      if (res.success) {
        setShowAddFieldModal(false);
        refresh();
      } else {
        setFieldError(res.error || 'Failed to add custom field.');
      }
    }
  };

  const handleDeleteField = (id: string, label: string) => {
    if (!isAdmin) return;
    if (window.confirm(`Are you sure you want to remove custom intake field "${label}"? Existing customer notes will be preserved.`)) {
      deleteCustomField(id);
      refresh();
    }
  };

  // =========================================================================
  // Backup & Restore State
  // =========================================================================
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupRestoreSummary, setBackupRestoreSummary] = useState<CompleteBackupSummary | null>(null);
  const [backupRestorePayload, setBackupRestorePayload] = useState<CompleteBackupPayload | null>(null);
  const [restoreConfirmChecked, setRestoreConfirmChecked] = useState(false);
  const [backupStatusMessage, setBackupStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Destructive reset state
  const [resetInputText, setResetInputText] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);

  const handleDownloadBackup = () => {
    const res = downloadCompleteBackup();
    if (res.success) {
      setBackupStatusMessage({
        type: 'success',
        text: `Full local system backup exported successfully (${res.filename}).`,
      });
      setTimeout(() => setBackupStatusMessage(null), 4500);
    }
  };

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const validation = validateCompleteBackup(json);
        if (validation.isValid && validation.summary && validation.payload) {
          setBackupRestoreSummary(validation.summary);
          setBackupRestorePayload(validation.payload);
          setBackupStatusMessage(null);
        } else {
          setBackupStatusMessage({
            type: 'error',
            text: validation.error || 'Invalid backup file structure.',
          });
          setBackupRestoreSummary(null);
          setBackupRestorePayload(null);
        }
      } catch {
        setBackupStatusMessage({
          type: 'error',
          text: 'Failed to read file: Not a valid JSON document.',
        });
        setBackupRestoreSummary(null);
        setBackupRestorePayload(null);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (backupFileInputRef.current) backupFileInputRef.current.value = '';
  };

  const handleExecuteRestore = () => {
    if (!backupRestorePayload || !restoreConfirmChecked) return;
    const res = restoreCompleteBackup(backupRestorePayload);
    if (res.success) {
      setBackupStatusMessage({
        type: 'success',
        text: 'System restored successfully from backup! All customer records, follow-ups, team members, and settings have been loaded.',
      });
      setBackupRestoreSummary(null);
      setBackupRestorePayload(null);
      setRestoreConfirmChecked(false);
      refresh();
    } else {
      setBackupStatusMessage({
        type: 'error',
        text: res.error || 'Failed to restore backup.',
      });
    }
  };

  const handleExecuteReset = () => {
    if (resetInputText !== 'RESET') return;
    resetAllLocalStorage();
    setShowResetModal(false);
    setResetInputText('');
    setBackupStatusMessage({
      type: 'info',
      text: 'All LocalStorage data has been cleared and reset to factory defaults.',
    });
    refresh();
  };

  return (
    <div>
      <PageHeader
        title="Settings & System Configuration"
        description="Configure organization metadata, manage customer categories and custom fields, and perform complete local backups."
      />

      {/* Role permission info banner */}
      {!isAdmin && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1.15rem',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.875rem',
            color: '#1e40af',
          }}
        >
          <Shield size={18} color="#2563eb" style={{ flexShrink: 0 }} />
          <div>
            <strong>Demo Mode Notice:</strong> You are currently operating in the{' '}
            <strong>Team Member</strong> role. Organization settings and category configurations are
            view-only. To modify settings, switch to <strong>Admin</strong> role in the header selector.
          </div>
        </div>
      )}

      {/* Status banner */}
      {backupStatusMessage && (
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.85rem 1.15rem',
            backgroundColor:
              backupStatusMessage.type === 'success'
                ? '#f0fdf4'
                : backupStatusMessage.type === 'error'
                ? '#fef2f2'
                : '#eff6ff',
            border: `1px solid ${
              backupStatusMessage.type === 'success'
                ? '#bbf7d0'
                : backupStatusMessage.type === 'error'
                ? '#fecaca'
                : '#bfdbfe'
            }`,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.875rem',
            color:
              backupStatusMessage.type === 'success'
                ? '#15803d'
                : backupStatusMessage.type === 'error'
                ? '#b91c1c'
                : '#1d4ed8',
          }}
        >
          {backupStatusMessage.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{backupStatusMessage.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.75rem' }}>
        {/* Navigation Tabs */}
        <div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[
              { id: 'general', label: 'Organization', icon: <Building size={16} /> },
              { id: 'categories', label: 'Categories Management', icon: <Tag size={16} /> },
              { id: 'fields', label: 'Custom Intake Fields', icon: <Sliders size={16} /> },
              { id: 'backup', label: 'Storage & Complete Backup', icon: <HardDrive size={16} /> },
            ].map((tab) => (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.75rem 0.95rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    textAlign: 'left',
                    backgroundColor: activeTab === tab.id ? 'var(--primary-light)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Content Pane */}
        <div>
          {/* ===============================================================
              TAB 1: ORGANIZATION SETTINGS
             =============================================================== */}
          {activeTab === 'general' && (
            <form onSubmit={handleOrgSubmit}>
              <Card>
                <CardHeader
                  title="Organization Information"
                  subtitle="Primary deployment parameters persisted in door2life_settings_v1"
                />
                <CardContent>
                  {orgSaveSuccess && (
                    <div
                      style={{
                        marginBottom: '1.25rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 'var(--radius-sm)',
                        color: '#16a34a',
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      Organization settings saved successfully to LocalStorage.
                    </div>
                  )}

                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="orgName">
                        Organization Name
                      </label>
                      <input
                        id="orgName"
                        name="orgName"
                        type="text"
                        className="form-input"
                        value={orgFormData.orgName}
                        onChange={handleOrgChange}
                        disabled={!isAdmin}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="supportEmail">
                        Support Email Address
                      </label>
                      <input
                        id="supportEmail"
                        name="supportEmail"
                        type="email"
                        className="form-input"
                        value={orgFormData.supportEmail}
                        onChange={handleOrgChange}
                        disabled={!isAdmin}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="hotline">
                        Contact Hotline / Helpline
                      </label>
                      <input
                        id="hotline"
                        name="hotline"
                        type="text"
                        className="form-input"
                        value={orgFormData.hotline}
                        onChange={handleOrgChange}
                        disabled={!isAdmin}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="locale">
                        Default Region / Locale
                      </label>
                      <select
                        id="locale"
                        name="locale"
                        className="form-select"
                        value={orgFormData.locale}
                        onChange={handleOrgChange}
                        disabled={!isAdmin}
                      >
                        <option value="en-IN">India (INR, en-IN)</option>
                        <option value="en-US">United States (USD, en-US)</option>
                        <option value="en-GB">United Kingdom (GBP, en-GB)</option>
                        <option value="en-CA">Canada (CAD, en-CA)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="timezone">
                        Timezone
                      </label>
                      <select
                        id="timezone"
                        name="timezone"
                        className="form-select"
                        value={orgFormData.timezone}
                        onChange={handleOrgChange}
                        disabled={!isAdmin}
                      >
                        <option value="Asia/Kolkata (UTC+5:30)">Asia/Kolkata (UTC+5:30)</option>
                        <option value="UTC (UTC+0)">Universal Time Coordinated (UTC)</option>
                        <option value="America/New_York (UTC-5)">Eastern Time (UTC-5)</option>
                        <option value="America/Chicago (UTC-6)">Central Time (UTC-6)</option>
                        <option value="America/Los_Angeles (UTC-8)">Pacific Time (UTC-8)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="followUpReminderDays">
                        Default Follow-up Reminder Window (Days)
                      </label>
                      <input
                        id="followUpReminderDays"
                        name="followUpReminderDays"
                        type="number"
                        min={1}
                        max={30}
                        className="form-input"
                        value={orgFormData.followUpReminderDays}
                        onChange={handleOrgChange}
                        disabled={!isAdmin}
                      />
                      <span className="form-helper">
                        Number of days after intake before automatic check-in flag triggers.
                      </span>
                    </div>
                  </div>
                </CardContent>
                {isAdmin && (
                  <CardFooter style={{ justifyContent: 'flex-end' }}>
                    <Button type="submit" variant="primary" icon={<Save size={16} />}>
                      Save Changes
                    </Button>
                  </CardFooter>
                )}
              </Card>
            </form>
          )}

          {/* ===============================================================
              TAB 2: CATEGORIES MANAGEMENT
             =============================================================== */}
          {activeTab === 'categories' && (
            <Card>
              <CardHeader
                title="Customer Categories"
                subtitle="Manage classification tags used across customer intake and filtering"
                action={
                  isAdmin && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus size={15} />}
                      onClick={() => {
                        setNewCatName('');
                        setCatError(null);
                        setShowAddCatModal(true);
                      }}
                    >
                      Add Category
                    </Button>
                  )
                }
              />
              <CardContent>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Renaming a category automatically migrates all existing customer records with that
                  category. Deleting an in-use category requires selecting a replacement category.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {categories.map((cat) => {
                    const { inUse, count } = isCategoryInUse(cat);
                    return (
                      <div
                        key={cat}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1rem',
                          backgroundColor: '#f8fafc',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-navy)', fontSize: '0.92rem' }}>
                            {cat}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '12px',
                              backgroundColor: inUse ? '#eff6ff' : '#f1f5f9',
                              color: inUse ? '#1d4ed8' : '#64748b',
                              fontWeight: 600,
                            }}
                          >
                            {count} customer{count === 1 ? '' : 's'}
                          </span>
                        </div>

                        {isAdmin && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 size={13} />}
                              onClick={() => {
                                setEditingCategory(cat);
                                setEditCatName(cat);
                                setCatError(null);
                              }}
                            >
                              Rename
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={13} />}
                              style={{ color: '#ef4444' }}
                              onClick={() => {
                                setDeletingCategory(cat);
                                setReassignCategoryTo(
                                  categories.find((c) => c !== cat) || ''
                                );
                                setCatError(null);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===============================================================
              TAB 3: CUSTOM INTAKE FIELDS
             =============================================================== */}
          {activeTab === 'fields' && (
            <Card>
              <CardHeader
                title="Custom Customer Intake Fields"
                subtitle="Configure dynamic attributes collected during customer intake wizard"
                action={
                  isAdmin && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus size={15} />}
                      onClick={handleOpenAddField}
                    >
                      Add Custom Field
                    </Button>
                  )
                }
              />
              <CardContent>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Custom fields are automatically rendered in Step 2 of the customer intake wizard and
                  saved to local customer records.
                </p>

                {customFields.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No custom fields configured. Click "Add Custom Field" to create one.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {customFields.map((field) => (
                      <div
                        key={field.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.85rem 1rem',
                          backgroundColor: '#f8fafc',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-navy)', fontSize: '0.9rem' }}>
                              {field.label}
                            </span>
                            {field.required && <Badge variant="warning">Required</Badge>}
                            <Badge variant="neutral">{field.type}</Badge>
                          </div>
                          {field.options && field.options.length > 0 && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              Options: {field.options.join(', ')}
                            </div>
                          )}
                        </div>

                        {isAdmin && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 size={13} />}
                              onClick={() => handleOpenEditField(field)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={13} />}
                              style={{ color: '#ef4444' }}
                              onClick={() => handleDeleteField(field.id, field.label)}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===============================================================
              TAB 4: STORAGE, BACKUP & RESTORE
             =============================================================== */}
          {activeTab === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Storage usage metrics card */}
              <Card>
                <CardHeader
                  title="Browser Storage Telemetry"
                  subtitle="Real-time LocalStorage footprint across all Door2Life collections"
                />
                <CardContent>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '1rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Customer Records
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-navy)', marginTop: '0.25rem' }}>
                        {customers.length}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Scheduled Follow-ups
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
                        {followUps.length}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Team Members
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>
                        {team.length}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Estimated Storage
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-navy)', marginTop: '0.25rem' }}>
                        {storageUsage.totalKb} KB
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        of ~5,120 KB available
                      </div>
                    </div>
                  </div>

                  {/* Storage breakdown details */}
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {storageUsage.breakdown.map((b) => (
                      <div key={b.key} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace' }}>
                        <span>{b.key}</span>
                        <span>
                          {b.count} item{b.count === 1 ? '' : 's'} • {(b.bytes / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Complete backup & restore cards */}
              <Card>
                <CardHeader
                  title="Complete Local System Backup"
                  subtitle="Download a unified JSON snapshot containing all customers, follow-ups, team members, and settings"
                />
                <CardContent>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                    Complete system backups capture the entire local state in a single verified file.
                    You can store this file on your local drive or move it between devices without needing
                    any server or cloud connection.
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <Button
                      variant="primary"
                      icon={<Download size={16} />}
                      onClick={handleDownloadBackup}
                    >
                      Download Complete System Backup (.json)
                    </Button>

                    {isAdmin && (
                      <Button
                        variant="secondary"
                        icon={<Upload size={16} />}
                        onClick={() => backupFileInputRef.current?.click()}
                      >
                        Restore From Full System Backup...
                      </Button>
                    )}

                    <input
                      ref={backupFileInputRef}
                      type="file"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={handleBackupFileSelect}
                    />
                  </div>

                  {/* Backup Restore Modal / Confirmation Box */}
                  {backupRestoreSummary && backupRestorePayload && (
                    <div
                      style={{
                        marginTop: '1.5rem',
                        padding: '1.25rem',
                        backgroundColor: '#fffbeb',
                        border: '1.5px solid #fde68a',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#92400e', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileCheck2 size={18} />
                        Validated System Backup Snapshot
                      </h4>
                      <div style={{ fontSize: '0.85rem', color: '#78350f', marginBottom: '1rem' }}>
                        Exported at: {new Date(backupRestoreSummary.exportedAt).toLocaleString()}
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '0.75rem',
                          marginBottom: '1.25rem',
                        }}
                      >
                        <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid #fed7aa' }}>
                          <div style={{ fontSize: '0.75rem', color: '#9a3412', fontWeight: 600 }}>Customers</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7c2d12' }}>
                            {backupRestoreSummary.customerCount}
                          </div>
                        </div>

                        <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid #fed7aa' }}>
                          <div style={{ fontSize: '0.75rem', color: '#9a3412', fontWeight: 600 }}>Follow-ups</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7c2d12' }}>
                            {backupRestoreSummary.followUpCount}
                          </div>
                        </div>

                        <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid #fed7aa' }}>
                          <div style={{ fontSize: '0.75rem', color: '#9a3412', fontWeight: 600 }}>Team</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7c2d12' }}>
                            {backupRestoreSummary.teamCount}
                          </div>
                        </div>

                        <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-sm)', border: '1px solid #fed7aa' }}>
                          <div style={{ fontSize: '0.75rem', color: '#9a3412', fontWeight: 600 }}>Categories</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7c2d12' }}>
                            {backupRestoreSummary.categoriesCount}
                          </div>
                        </div>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={restoreConfirmChecked}
                          onChange={(e) => setRestoreConfirmChecked(e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e' }}>
                          I understand that restoring this backup will replace current local records with the data inside this file.
                        </span>
                      </label>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Button
                          variant="primary"
                          disabled={!restoreConfirmChecked}
                          onClick={handleExecuteRestore}
                        >
                          Confirm & Restore System
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setBackupRestoreSummary(null);
                            setBackupRestorePayload(null);
                            setRestoreConfirmChecked(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Danger Zone: Factory Reset */}
              {isAdmin && (
                <Card>
                  <CardHeader
                    title="Danger Zone: Factory Reset"
                    subtitle="Clear all local data and restore Door2Life to initial clean installation state"
                  />
                  <CardContent>
                    <div
                      style={{
                        padding: '1rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#991b1b', fontSize: '0.95rem' }}>
                          Erase All LocalStorage Collections
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#7f1d1d', marginTop: '0.25rem', lineHeight: 1.4 }}>
                          This will permanently delete all customer records, follow-up reminders, custom categories,
                          and team members from this browser. This action requires explicit typed confirmation and cannot be undone.
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        icon={<AlertTriangle size={15} />}
                        onClick={() => setShowResetModal(true)}
                        style={{ flexShrink: 0 }}
                      >
                        Factory Reset...
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          MODAL: ADD CATEGORY
         ===================================================================== */}
      {showAddCatModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Category</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAddCatModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddCategory}>
              <div className="modal-body">
                {catError && (
                  <div className="banner banner-error" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={15} /> {catError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="newCatName">
                    Category Name <span className="req">*</span>
                  </label>
                  <input
                    id="newCatName"
                    type="text"
                    className="form-input"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Non-Resident Indian, Partner, Micro-Enterprise"
                    autoFocus
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setShowAddCatModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create Category
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: RENAME CATEGORY
         ===================================================================== */}
      {editingCategory && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Rename Category</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditingCategory(null)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleRenameCategory}>
              <div className="modal-body">
                {catError && (
                  <div className="banner banner-error" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={15} /> {catError}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="editCatName">
                    Category Name <span className="req">*</span>
                  </label>
                  <input
                    id="editCatName"
                    type="text"
                    className="form-input"
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    autoFocus
                    required
                  />
                  <span className="form-helper">
                    All customer profiles currently tagged with "{editingCategory}" will be
                    automatically updated with this new name.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setEditingCategory(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DELETE CATEGORY (WITH REASSIGNMENT)
         ===================================================================== */}
      {deletingCategory && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#b91c1c' }}>
                Delete Category: {deletingCategory}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDeletingCategory(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {catError && (
                <div className="banner banner-error" style={{ marginBottom: '1rem' }}>
                  <AlertCircle size={15} /> {catError}
                </div>
              )}

              {(() => {
                const { inUse, count } = isCategoryInUse(deletingCategory);
                if (inUse) {
                  return (
                    <div>
                      <div
                        style={{
                          padding: '0.85rem',
                          backgroundColor: '#fef2f2',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid #fecaca',
                          color: '#991b1b',
                          fontSize: '0.85rem',
                          marginBottom: '1rem',
                        }}
                      >
                        <strong>Active Customer Notice:</strong> This category is currently assigned to{' '}
                        <strong>{count} customer profile{count === 1 ? '' : 's'}</strong>. To prevent
                        orphaned records, please select a replacement category to reassign them to:
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="reassignCat">
                          Reassign Affected Customers To <span className="req">*</span>
                        </label>
                        <select
                          id="reassignCat"
                          className="form-select"
                          value={reassignCategoryTo}
                          onChange={(e) => setReassignCategoryTo(e.target.value)}
                          required
                        >
                          <option value="">Select Replacement Category</option>
                          {categories
                            .filter((c) => c !== deletingCategory)
                            .map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  );
                }
                return (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Are you sure you want to remove category "<strong>{deletingCategory}</strong>"? No
                    customer records currently use this category.
                  </p>
                );
              })()}
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setDeletingCategory(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteCategory}
                disabled={
                  isCategoryInUse(deletingCategory).inUse && !reassignCategoryTo
                }
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD / EDIT CUSTOM FIELD
         ===================================================================== */}
      {showAddFieldModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingFieldId ? 'Edit Custom Field' : 'Add Custom Intake Field'}
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowAddFieldModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSaveField}>
              <div className="modal-body">
                {fieldError && (
                  <div className="banner banner-error" style={{ marginBottom: '1rem' }}>
                    <AlertCircle size={15} /> {fieldError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="cfLabel">
                    Field Label <span className="req">*</span>
                  </label>
                  <input
                    id="cfLabel"
                    type="text"
                    className="form-input"
                    value={fieldFormData.label}
                    onChange={(e) =>
                      setFieldFormData((prev) => ({ ...prev, label: e.target.value }))
                    }
                    placeholder="e.g. National ID Number, Preferred Language"
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="cfType">
                    Field Input Type
                  </label>
                  <select
                    id="cfType"
                    className="form-select"
                    value={fieldFormData.type}
                    onChange={(e) =>
                      setFieldFormData((prev) => ({
                        ...prev,
                        type: e.target.value as any,
                      }))
                    }
                  >
                    <option value="text">Single-line Text</option>
                    <option value="number">Numeric</option>
                    <option value="select">Dropdown Select</option>
                    <option value="textarea">Multi-line Text</option>
                  </select>
                </div>

                {fieldFormData.type === 'select' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="cfOptions">
                      Dropdown Options (Comma-separated) <span className="req">*</span>
                    </label>
                    <input
                      id="cfOptions"
                      type="text"
                      className="form-input"
                      value={fieldFormData.optionsText}
                      onChange={(e) =>
                        setFieldFormData((prev) => ({ ...prev, optionsText: e.target.value }))
                      }
                      placeholder="e.g. English, Hindi, Kannada, Tamil"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="cfPlaceholder">
                    Placeholder Hint (Optional)
                  </label>
                  <input
                    id="cfPlaceholder"
                    type="text"
                    className="form-input"
                    value={fieldFormData.placeholder}
                    onChange={(e) =>
                      setFieldFormData((prev) => ({ ...prev, placeholder: e.target.value }))
                    }
                    placeholder="e.g. Enter details..."
                  />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', marginTop: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={fieldFormData.required}
                    onChange={(e) =>
                      setFieldFormData((prev) => ({ ...prev, required: e.target.checked }))
                    }
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                    Require field during intake
                  </span>
                </label>
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setShowAddFieldModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingFieldId ? 'Update Field' : 'Save Field'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: FACTORY RESET CONFIRMATION
         ===================================================================== */}
      {showResetModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#b91c1c' }}>
                Confirm Factory Reset
              </h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => {
                  setShowResetModal(false);
                  setResetInputText('');
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem', color: '#7f1d1d', lineHeight: 1.5, marginBottom: '1rem' }}>
                This is a permanent destructive action. All customer records, follow-ups, team
                roster, and custom settings will be purged from this browser.
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="resetConfirmation">
                  Type <strong>RESET</strong> to confirm:
                </label>
                <input
                  id="resetConfirmation"
                  type="text"
                  className="form-input"
                  value={resetInputText}
                  onChange={(e) => setResetInputText(e.target.value)}
                  placeholder="RESET"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowResetModal(false);
                  setResetInputText('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={resetInputText !== 'RESET'}
                onClick={handleExecuteReset}
              >
                Erase All Local Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
