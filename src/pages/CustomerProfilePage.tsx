import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Trash2,
  Briefcase,
  Building2,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { getStoredCustomerById } from '../services/customerStorage';
import { useTeamMembers } from '../services/teamStorage';
import { useSettings } from '../services/settingsStorage';
import {
  getFollowUpsByCustomerId,
  addFollowUp,
  updateFollowUp,
  completeFollowUp,
  deleteFollowUp,
  type FollowUp,
  type FollowUpChannel,
  type FollowUpPriority,
} from '../services/followUpStorage';
import type { CustomerCategory } from '../types/customer';

const getCategoryBadgeVariant = (category: CustomerCategory): BadgeVariant => {
  switch (category) {
    case 'Business Owner':
    case 'Aspiring Entrepreneur':
    case 'Entrepreneur':
      return 'primary';
    case 'Investor':
      return 'success';
    case 'Working Professional':
    case 'Professional':
    case 'Self-employed':
      return 'info';
    case 'Student':
      return 'warning';
    case 'General Customer':
    case 'Other':
    default:
      return 'neutral';
  }
};

export const CustomerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeMembers } = useTeamMembers();
  const { settings } = useSettings();

  // Read customer directly from localStorage - works across browser refresh!
  const customer = id ? getStoredCustomerById(id) : null;

  // Local state for linked follow-ups to re-render reactively on changes
  const [followUps, setFollowUps] = useState<FollowUp[]>(() => {
    return id ? getFollowUpsByCustomerId(id) : [];
  });

  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Follow-up Modal State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('14:00');
  const [channel, setChannel] = useState<FollowUpChannel>('Phone Call');
  const [priority, setPriority] = useState<FollowUpPriority>('Normal');
  const [agent, setAgent] = useState(() => (activeMembers.length > 0 ? activeMembers[0].name : 'Sarah Jenkins'));
  const [notes, setNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const refreshFollowUps = () => {
    if (id) {
      setFollowUps(getFollowUpsByCustomerId(id));
    }
  };

  if (!customer || !id) {
    return (
      <div>
        <PageHeader
          title="Customer Profile"
          description="View customer demographics and linked relationship touchpoints."
          actions={
            <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => navigate('/customers')}>
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
                The customer record with ID <strong>{id}</strong> could not be found in browser LocalStorage.
              </p>
              <Button variant="primary" icon={<ArrowLeft size={16} />} onClick={() => navigate('/customers')}>
                Back to Customer Directory
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const handleCreateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!taskTitle.trim()) {
      setModalError('Task title is required.');
      return;
    }
    if (!dueDate) {
      setModalError('Scheduled due date is required.');
      return;
    }

    const result = addFollowUp({
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.primaryContact,
      taskTitle: taskTitle.trim(),
      dueDate,
      dueTime: dueTime || undefined,
      channel,
      priority,
      notes: notes.trim() || undefined,
      agent: agent || (activeMembers.length > 0 ? activeMembers[0].name : 'Sarah Jenkins'),
    });

    if (result.success) {
      setIsScheduleOpen(false);
      refreshFollowUps();
      setActionNotice(`Follow-up scheduled for ${customer.fullName}.`);
      setTaskTitle('');
      setNotes('');
      setTimeout(() => setActionNotice(null), 4000);
    } else {
      setModalError(result.error || 'Failed to schedule follow-up.');
    }
  };

  const handleToggleComplete = (fu: FollowUp) => {
    if (fu.status === 'Completed') {
      updateFollowUp(fu.id, { status: undefined, completedAt: undefined });
      setActionNotice(`Follow-up ${fu.id} reopened.`);
    } else {
      completeFollowUp(fu.id);
      setActionNotice(`Follow-up ${fu.id} marked completed.`);
    }
    refreshFollowUps();
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDeleteFollowUp = (fuId: string) => {
    deleteFollowUp(fuId);
    refreshFollowUps();
    setActionNotice(`Follow-up ${fuId} was deleted.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div>
      <PageHeader
        title={customer.fullName}
        description={`Customer ID: ${customer.id} • Registered ${formatDateTime(customer.createdAt).split(',')[0]}`}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              variant="secondary"
              icon={<ArrowLeft size={16} />}
              onClick={() => navigate('/customers')}
            >
              Back to Customers
            </Button>
            <Button
              variant="primary"
              icon={<Edit size={16} />}
              onClick={() => navigate(`/customers/edit/${customer.id}`)}
            >
              Edit Profile
            </Button>
          </div>
        }
      />

      {/* Action Notification */}
      {actionNotice && (
        <div className="ui-alert-banner success" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#065f46' }}
            aria-label="Dismiss notice"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="customer-profile-grid">
        {/* Left Column: Customer Information Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Identity & Demographics */}
          <Card>
            <CardHeader
              title="Demographics & Identity"
              subtitle="Personal profile and classification attributes"
              action={
                <Badge variant={getCategoryBadgeVariant(customer.category)}>
                  {customer.category}
                </Badge>
              }
            />
            <CardContent>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value" style={{ fontWeight: 700, color: 'var(--text-navy)' }}>
                    {customer.fullName}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Customer ID</span>
                  <span className="detail-value" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                    {customer.id}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Age</span>
                  <span className="detail-value">{customer.age} years old</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Gender</span>
                  <span className="detail-value">{customer.gender}</span>
                </div>

                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Occupation</span>
                  <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Briefcase size={14} color="var(--text-faint)" />
                    {customer.occupation}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card>
            <CardHeader
              title="Contact Channels & Location"
              subtitle="Verified direct communication numbers and residence"
            />
            <CardContent>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Primary Mobile Contact</span>
                  <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={14} color="var(--primary)" />
                    <a href={`tel:${customer.primaryContact}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      {customer.primaryContact}
                    </a>
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Mail size={14} color="var(--text-faint)" />
                        {customer.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>

                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Location / Address</span>
                  <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={14} color="var(--text-faint)" />
                    {customer.location || 'No address provided'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conditional Business & Enterprise Details */}
          {(customer.businessName || customer.businessCategory || customer.businessServices || customer.businessLocation || customer.businessIdea) && (
            <Card>
              <CardHeader
                title="Business & Enterprise Profile"
                subtitle="Commercial venture, category, and enterprise scope"
                action={<Badge variant="primary">Enterprise</Badge>}
              />
              <CardContent>
                <div className="detail-grid">
                  {customer.businessName && (
                    <div className="detail-item">
                      <span className="detail-label">Business / Venture Name</span>
                      <span className="detail-value" style={{ fontWeight: 700, color: 'var(--text-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={15} color="var(--primary)" />
                        {customer.businessName}
                      </span>
                    </div>
                  )}

                  {customer.businessCategory && (
                    <div className="detail-item">
                      <span className="detail-label">Industry / Sector</span>
                      <span className="detail-value">
                        {customer.businessCategory}
                      </span>
                    </div>
                  )}

                  {customer.businessLocation && (
                    <div className="detail-item">
                      <span className="detail-label">Business Location</span>
                      <span className="detail-value">
                        {customer.businessLocation}
                      </span>
                    </div>
                  )}

                  {customer.businessServices && (
                    <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="detail-label">Products & Services Offered</span>
                      <span className="detail-value">
                        {customer.businessServices}
                      </span>
                    </div>
                  )}

                  {customer.businessIdea && (
                    <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="detail-label">Business Concept / Growth Vision</span>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {customer.businessIdea}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Intake Notes & Preferences */}
          {(customer.interests || customer.notes || customer.trainingRequired || customer.mentorshipRequired || customer.businessExpansion) && (
            <Card>
              <CardHeader
                title="Service Preferences & Field Notes"
                subtitle="Captured observations, intake context, and support requests"
              />
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Structured Support Programs */}
                  {(customer.trainingRequired || customer.mentorshipRequired || customer.businessExpansion) && (
                    <div>
                      <span className="detail-label" style={{ marginBottom: '0.4rem', display: 'block' }}>Requested Support Programs</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {customer.trainingRequired && (
                          <Badge variant="warning">
                            Skill & Entrepreneurship Training
                          </Badge>
                        )}
                        {customer.mentorshipRequired && (
                          <Badge variant="info">
                            1-on-1 Mentorship & Advisory
                          </Badge>
                        )}
                        {customer.businessExpansion && (
                          <Badge variant="success">
                            Business Expansion & Scaling
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {customer.interests && (
                    <div>
                      <span className="detail-label">Service Interests & Domains</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                        {customer.interests.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: 'var(--primary)',
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {customer.notes && (
                    <div>
                      <span className="detail-label">Intake Field Notes</span>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {customer.notes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Custom Intake Attributes */}
          {customer.customFields && Object.keys(customer.customFields).length > 0 && (
            <Card>
              <CardHeader
                title="Custom Intake Attributes"
                subtitle="Dynamic organization-specific fields collected during intake"
              />
              <CardContent>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {Object.entries(customer.customFields).map(([key, val]) => {
                    const fieldDef = settings.customFields.find((f) => f.id === key);
                    const label = fieldDef?.label || key;
                    return (
                      <div key={key}>
                        <span className="detail-label">{label}</span>
                        <p style={{ fontSize: '0.92rem', color: 'var(--text-navy)', marginTop: '0.25rem', fontWeight: 500 }}>
                          {val || '—'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata Card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
            <span>Created: {formatDateTime(customer.createdAt)}</span>
            <span>Last Updated: {formatDateTime(customer.updatedAt)}</span>
          </div>
        </div>

        {/* Right Column: Linked Follow-ups */}
        <div>
          <Card>
            <CardHeader
              title="Linked Follow-ups"
              subtitle={`Touchpoints scheduled specifically for ${customer.fullName}`}
              action={
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => setIsScheduleOpen(true)}
                >
                  Schedule Follow-up
                </Button>
              }
            />
            <CardContent>
              {followUps.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <div className="empty-state-icon" style={{ width: '42px', height: '42px', marginBottom: '0.75rem' }}>
                    <Clock size={20} />
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-navy)' }}>
                    No follow-ups scheduled
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    There are currently no active tasks or scheduled touchpoints for this customer.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => setIsScheduleOpen(true)}
                  >
                    Schedule Initial Task
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {followUps.map((fu) => (
                    <div
                      key={fu.id}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: fu.status === 'Completed' ? '#fafbfc' : '#ffffff',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-navy)', fontSize: '0.92rem' }}>
                              {fu.taskTitle}
                            </span>
                            <Badge
                              variant={
                                fu.status === 'Completed'
                                  ? 'success'
                                  : fu.status === 'Due Today'
                                  ? 'warning'
                                  : 'info'
                              }
                            >
                              {fu.status}
                            </Badge>
                            <Badge variant={fu.priority === 'High' ? 'warning' : 'neutral'}>
                              {fu.priority}
                            </Badge>
                          </div>

                          {fu.notes && (
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              {fu.notes}
                            </p>
                          )}

                          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Calendar size={13} style={{ color: 'var(--text-faint)' }} />
                              {fu.dueDate} {fu.dueTime && `at ${fu.dueTime}`}
                            </span>
                            <span>Channel: <strong>{fu.channel}</strong></span>
                            <span>ID: <code>{fu.id}</code></span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <Button
                            variant={fu.status === 'Completed' ? 'secondary' : 'outline'}
                            size="sm"
                            icon={fu.status === 'Completed' ? <RotateCcw size={13} /> : <CheckCircle2 size={13} />}
                            onClick={() => handleToggleComplete(fu)}
                          >
                            {fu.status === 'Completed' ? 'Reopen' : 'Done'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            style={{ color: '#ef4444' }}
                            icon={<Trash2 size={13} />}
                            onClick={() => handleDeleteFollowUp(fu.id)}
                            title="Delete follow-up"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Schedule Modal for this Customer */}
      {isScheduleOpen && (
        <div className="ui-modal-overlay" onClick={() => setIsScheduleOpen(false)}>
          <div
            className="ui-modal-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-sched-customer-title"
          >
            <form onSubmit={handleCreateFollowUp}>
              <div className="ui-modal-header">
                <div>
                  <h3 id="modal-sched-customer-title" className="ui-modal-title">
                    Schedule Follow-up Task
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    For {customer.fullName} ({customer.id})
                  </div>
                </div>
                <button
                  type="button"
                  className="ui-modal-close"
                  onClick={() => setIsScheduleOpen(false)}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="ui-modal-body">
                {modalError && (
                  <div className="ui-alert-banner error" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={16} />
                      <span>{modalError}</span>
                    </div>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="custTaskTitle">
                      Task Description <span className="req">*</span>
                    </label>
                    <input
                      id="custTaskTitle"
                      type="text"
                      className="form-input"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="e.g. Identity document verification, policy review"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="custDueDate">
                      Due Date <span className="req">*</span>
                    </label>
                    <input
                      id="custDueDate"
                      type="date"
                      className="form-input"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="custDueTime">
                      Due Time
                    </label>
                    <input
                      id="custDueTime"
                      type="time"
                      className="form-input"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="custChannel">
                      Channel
                    </label>
                    <select
                      id="custChannel"
                      className="form-select"
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as FollowUpChannel)}
                    >
                      <option value="Phone Call">Phone Call</option>
                      <option value="In-Person Visit">In-Person Visit</option>
                      <option value="Email">Email</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="custPriority">
                      Priority
                    </label>
                    <select
                      id="custPriority"
                      className="form-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as FollowUpPriority)}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="custAgent">
                      Assigned Staff
                    </label>
                    <select
                      id="custAgent"
                      className="form-select"
                      value={agent}
                      onChange={(e) => setAgent(e.target.value)}
                    >
                      {activeMembers.length > 0 ? (
                        activeMembers.map((m) => (
                          <option key={m.id} value={m.name}>
                            {m.name} ({m.role})
                          </option>
                        ))
                      ) : (
                        <option value="Lead Admin">Lead Admin</option>
                      )}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="custNotes">
                      Task Notes (Optional)
                    </label>
                    <textarea
                      id="custNotes"
                      rows={2}
                      className="form-textarea"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="ui-modal-footer">
                <Button variant="secondary" type="button" onClick={() => setIsScheduleOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" icon={<Plus size={15} />}>
                  Schedule Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
