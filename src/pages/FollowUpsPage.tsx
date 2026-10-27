import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Eye,
  X,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  useFollowUps,
  addFollowUp,
  updateFollowUp,
  completeFollowUp,
  deleteFollowUp,
  type FollowUp,
  type FollowUpChannel,
  type FollowUpPriority,
} from '../services/followUpStorage';
import { useCustomers } from '../services/customerStorage';
import { useTeamMembers } from '../services/teamStorage';

const formatScheduledDisplay = (dueDate: string, dueTime?: string) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  let datePrefix = dueDate;
  if (dueDate === todayStr) datePrefix = 'Today';
  else if (dueDate === tomorrowStr) datePrefix = 'Tomorrow';

  if (dueTime) {
    return `${datePrefix} at ${dueTime}`;
  }
  return datePrefix;
};

export const FollowUpsPage: React.FC = () => {
  const { followUps, dueTodayCount } = useFollowUps();
  const { customers } = useCustomers();
  const { activeMembers } = useTeamMembers();

  const [activeTab, setActiveTab] = useState<'All' | 'Due Today' | 'Upcoming' | 'Completed'>('Due Today');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [rescheduleItem, setRescheduleItem] = useState<FollowUp | null>(null);
  const [detailsItem, setDetailsItem] = useState<FollowUp | null>(null);
  const [deleteItem, setDeleteItem] = useState<FollowUp | null>(null);

  // Form state for scheduling new follow-up
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formTaskTitle, setFormTaskTitle] = useState('');
  const [formDueDate, setFormDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formDueTime, setFormDueTime] = useState('14:00');
  const [formChannel, setFormChannel] = useState<FollowUpChannel>('Phone Call');
  const [formPriority, setFormPriority] = useState<FollowUpPriority>('Normal');
  const [formAgent, setFormAgent] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Form state for rescheduling
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const upcomingCount = followUps.filter((f) => f.status === 'Upcoming').length;
  const completedCount = followUps.filter((f) => f.status === 'Completed').length;

  const filteredItems = followUps.filter((item) => {
    if (activeTab === 'All') return true;
    return item.status === activeTab;
  });

  const handleOpenScheduleModal = (preselectedCustomerId?: string) => {
    setFormError(null);
    setFormCustomerId(preselectedCustomerId || (customers.length > 0 ? customers[0].id : ''));
    setFormTaskTitle('');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormDueTime('14:00');
    setFormChannel('Phone Call');
    setFormPriority('Normal');
    setFormAgent(activeMembers.length > 0 ? activeMembers[0].name : 'Sarah Jenkins');
    setFormNotes('');
    setIsScheduleModalOpen(true);
  };

  const handleCreateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCustomerId) {
      setFormError('Please select a customer.');
      return;
    }
    if (!formTaskTitle.trim()) {
      setFormError('Please provide a task title.');
      return;
    }
    if (!formDueDate) {
      setFormError('Please select a due date.');
      return;
    }

    const selectedCust = customers.find((c) => c.id === formCustomerId);

    const result = addFollowUp({
      customerId: formCustomerId,
      customerName: selectedCust?.fullName,
      customerPhone: selectedCust?.primaryContact,
      taskTitle: formTaskTitle.trim(),
      dueDate: formDueDate,
      dueTime: formDueTime || undefined,
      channel: formChannel,
      priority: formPriority,
      notes: formNotes.trim() || undefined,
      agent: formAgent || (activeMembers.length > 0 ? activeMembers[0].name : 'Sarah Jenkins'),
    });

    if (result.success && result.followUp) {
      setIsScheduleModalOpen(false);
      setActionNotice(`Follow-up scheduled for ${result.followUp.customerName} (${result.followUp.id}).`);
      setTimeout(() => setActionNotice(null), 4000);
    } else {
      setFormError(result.error || 'Failed to schedule follow-up.');
    }
  };

  const handleOpenReschedule = (item: FollowUp) => {
    setRescheduleItem(item);
    setRescheduleDate(item.dueDate);
    setRescheduleTime(item.dueTime || '');
    setRescheduleNotes(item.notes || '');
    setRescheduleError(null);
  };

  const handleSaveReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleItem) return;

    if (!rescheduleDate) {
      setRescheduleError('Please choose a valid due date.');
      return;
    }

    const result = updateFollowUp(rescheduleItem.id, {
      dueDate: rescheduleDate,
      dueTime: rescheduleTime || undefined,
      notes: rescheduleNotes.trim() || undefined,
      status: rescheduleItem.status === 'Completed' ? 'Upcoming' : undefined,
    });

    if (result.success) {
      setRescheduleItem(null);
      setActionNotice(`Follow-up ${rescheduleItem.id} rescheduled to ${rescheduleDate}.`);
      setTimeout(() => setActionNotice(null), 4000);
    } else {
      setRescheduleError(result.error || 'Failed to reschedule.');
    }
  };

  const handleToggleComplete = (item: FollowUp) => {
    if (item.status === 'Completed') {
      // Re-open
      updateFollowUp(item.id, {
        status: undefined, // auto-computes based on dueDate
        completedAt: undefined,
      });
      setActionNotice(`Follow-up ${item.id} reopened.`);
    } else {
      completeFollowUp(item.id);
      setActionNotice(`Follow-up ${item.id} marked as completed.`);
    }
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDeleteConfirm = () => {
    if (!deleteItem) return;
    deleteFollowUp(deleteItem.id);
    setActionNotice(`Follow-up ${deleteItem.id} was deleted.`);
    setDeleteItem(null);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="Track customer touchpoints, scheduled calls, field visits, and data collection reminders stored in browser LocalStorage."
        actions={
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => handleOpenScheduleModal()}
          >
            Schedule Follow-up
          </Button>
        }
      />

      {/* Notification Banner */}
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

      {/* Tab Filter Row */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        {(
          [
            { key: 'Due Today', label: `Due Today (${dueTodayCount})` },
            { key: 'Upcoming', label: `Upcoming (${upcomingCount})` },
            { key: 'Completed', label: `Completed (${completedCount})` },
            { key: 'All', label: `All (${followUps.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === tab.key ? 'var(--primary-light)' : 'transparent',
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Follow-up Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <Card key={item.id}>
              <CardContent style={{ padding: '1.25rem 1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1, minWidth: '280px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: item.status === 'Completed' ? '#ecfdf5' : item.status === 'Due Today' ? '#fffbeb' : '#eff6ff',
                        color: item.status === 'Completed' ? '#047857' : item.status === 'Due Today' ? '#b45309' : '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        cursor: 'pointer',
                      }}
                      title={item.status === 'Completed' ? 'Completed - Click to reopen' : 'Click to mark complete'}
                      onClick={() => handleToggleComplete(item)}
                    >
                      {item.status === 'Completed' ? <CheckCircle2 size={22} /> : <Clock size={22} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <h4
                          style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'var(--text-navy)',
                            textDecoration: item.status === 'Completed' ? 'line-through' : 'none',
                          }}
                        >
                          {item.customerName}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                          {item.customerId}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          • {item.id}
                        </span>
                        <Badge
                          variant={
                            item.priority === 'High'
                              ? 'warning'
                              : item.priority === 'Medium'
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {item.priority} Priority
                        </Badge>
                        <Badge
                          variant={
                            item.status === 'Completed'
                              ? 'success'
                              : item.status === 'Due Today'
                              ? 'warning'
                              : 'info'
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>

                      <p
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          marginTop: '0.35rem',
                        }}
                      >
                        {item.taskTitle}
                      </p>

                      {item.notes && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                          {item.notes}
                        </p>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          gap: '1.25rem',
                          marginTop: '0.75rem',
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} style={{ color: 'var(--text-faint)' }} />
                          {formatScheduledDisplay(item.dueDate, item.dueTime)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {item.channel === 'Phone Call' && <Phone size={14} style={{ color: 'var(--text-faint)' }} />}
                          {item.channel === 'Email' && <Mail size={14} style={{ color: 'var(--text-faint)' }} />}
                          {item.channel === 'In-Person Visit' && <MapPin size={14} style={{ color: 'var(--text-faint)' }} />}
                          {item.channel}
                          {item.customerPhone && (
                            <span style={{ color: 'var(--text-muted)' }}>({item.customerPhone})</span>
                          )}
                        </span>
                        {item.agent && <span>Assigned: <strong>{item.agent}</strong></span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant={item.status === 'Completed' ? 'secondary' : 'primary'}
                      size="sm"
                      icon={item.status === 'Completed' ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />}
                      onClick={() => handleToggleComplete(item)}
                    >
                      {item.status === 'Completed' ? 'Reopen' : 'Done'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Eye size={14} />}
                      onClick={() => setDetailsItem(item)}
                    >
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit2 size={14} />}
                      onClick={() => handleOpenReschedule(item)}
                    >
                      Reschedule
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: '#ef4444' }}
                      icon={<Trash2 size={14} />}
                      onClick={() => setDeleteItem(item)}
                      title="Delete Follow-up"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <div className="empty-state">
              <div className="empty-state-icon">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="empty-state-title">
                {activeTab === 'All' ? 'No follow-up records found' : `No follow-ups in "${activeTab}" queue`}
              </h3>
              <p className="empty-state-text">
                {activeTab === 'All'
                  ? 'All scheduled interactions have been cleared or none have been assigned yet. Click below to schedule a follow-up for a customer.'
                  : `There are currently 0 follow-up tasks under "${activeTab}".`}
              </p>
              <div style={{ marginTop: '1rem' }}>
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={() => handleOpenScheduleModal()}
                >
                  Schedule New Follow-up
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* =====================================================================
          1. SCHEDULE FOLLOW-UP MODAL
         ===================================================================== */}
      {isScheduleModalOpen && (
        <div className="ui-modal-overlay" onClick={() => setIsScheduleModalOpen(false)}>
          <div
            className="ui-modal-container modal-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-schedule-title"
          >
            <form onSubmit={handleCreateFollowUp}>
              <div className="ui-modal-header">
                <h3 id="modal-schedule-title" className="ui-modal-title">
                  Schedule Follow-up Task
                </h3>
                <button
                  type="button"
                  className="ui-modal-close"
                  onClick={() => setIsScheduleModalOpen(false)}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="ui-modal-body">
                {formError && (
                  <div className="ui-alert-banner error" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={16} />
                      <span>{formError}</span>
                    </div>
                  </div>
                )}

                <div className="form-grid">
                  {/* Customer selection */}
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="formCustomerId">
                      Customer <span className="req">*</span>
                    </label>
                    {customers.length > 0 ? (
                      <select
                        id="formCustomerId"
                        className="form-select"
                        value={formCustomerId}
                        onChange={(e) => setFormCustomerId(e.target.value)}
                        required
                      >
                        <option value="">Select a customer profile</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName} ({c.id}) — {c.primaryContact}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        <input
                          id="formCustomerId"
                          type="text"
                          className="form-input"
                          placeholder="e.g. D2L-1001"
                          value={formCustomerId}
                          onChange={(e) => setFormCustomerId(e.target.value)}
                          required
                        />
                        <span className="form-helper" style={{ color: '#d97706' }}>
                          No customers registered yet. You can type a customer reference ID or create a customer first.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Task title */}
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="formTaskTitle">
                      Task Description / Title <span className="req">*</span>
                    </label>
                    <input
                      id="formTaskTitle"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Verify identity documents, policy check-in, field intake review"
                      value={formTaskTitle}
                      onChange={(e) => setFormTaskTitle(e.target.value)}
                      required
                    />
                  </div>

                  {/* Due date */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="formDueDate">
                      Scheduled Date <span className="req">*</span>
                    </label>
                    <input
                      id="formDueDate"
                      type="date"
                      className="form-input"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Due time */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="formDueTime">
                      Scheduled Time
                    </label>
                    <input
                      id="formDueTime"
                      type="time"
                      className="form-input"
                      value={formDueTime}
                      onChange={(e) => setFormDueTime(e.target.value)}
                    />
                  </div>

                  {/* Channel */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="formChannel">
                      Communication Channel
                    </label>
                    <select
                      id="formChannel"
                      className="form-select"
                      value={formChannel}
                      onChange={(e) => setFormChannel(e.target.value as FollowUpChannel)}
                    >
                      <option value="Phone Call">Phone Call</option>
                      <option value="In-Person Visit">In-Person Visit</option>
                      <option value="Email">Email</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="formPriority">
                      Priority Level
                    </label>
                    <select
                      id="formPriority"
                      className="form-select"
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as FollowUpPriority)}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  {/* Assigned Staff Member */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="formAgent">
                      Assigned Staff
                    </label>
                    <select
                      id="formAgent"
                      className="form-select"
                      value={formAgent}
                      onChange={(e) => setFormAgent(e.target.value)}
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

                  {/* Notes */}
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="formNotes">
                      Task Notes / Details (Optional)
                    </label>
                    <textarea
                      id="formNotes"
                      className="form-textarea"
                      rows={3}
                      placeholder="Add specific questions to ask or details to confirm..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="ui-modal-footer">
                <Button variant="secondary" type="button" onClick={() => setIsScheduleModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" icon={<Plus size={16} />}>
                  Schedule Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. RESCHEDULE MODAL
         ===================================================================== */}
      {rescheduleItem && (
        <div className="ui-modal-overlay" onClick={() => setRescheduleItem(null)}>
          <div
            className="ui-modal-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-reschedule-title"
          >
            <form onSubmit={handleSaveReschedule}>
              <div className="ui-modal-header">
                <div>
                  <h3 id="modal-reschedule-title" className="ui-modal-title">
                    Reschedule Follow-up
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {rescheduleItem.customerName} ({rescheduleItem.id})
                  </div>
                </div>
                <button
                  type="button"
                  className="ui-modal-close"
                  onClick={() => setRescheduleItem(null)}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="ui-modal-body">
                {rescheduleError && (
                  <div className="ui-alert-banner error" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={16} />
                      <span>{rescheduleError}</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="rescheduleDate">
                      New Due Date <span className="req">*</span>
                    </label>
                    <input
                      id="rescheduleDate"
                      type="date"
                      className="form-input"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="rescheduleTime">
                      New Scheduled Time
                    </label>
                    <input
                      id="rescheduleTime"
                      type="time"
                      className="form-input"
                      value={rescheduleTime}
                      onChange={(e) => setRescheduleTime(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="rescheduleNotes">
                      Updated Notes / Reason for Reschedule
                    </label>
                    <textarea
                      id="rescheduleNotes"
                      className="form-textarea"
                      rows={3}
                      value={rescheduleNotes}
                      onChange={(e) => setRescheduleNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="ui-modal-footer">
                <Button variant="secondary" type="button" onClick={() => setRescheduleItem(null)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" icon={<Edit2 size={14} />}>
                  Save New Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. FOLLOW-UP DETAILS MODAL
         ===================================================================== */}
      {detailsItem && (
        <div className="ui-modal-overlay" onClick={() => setDetailsItem(null)}>
          <div
            className="ui-modal-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-details-title"
          >
            <div className="ui-modal-header">
              <div>
                <h3 id="modal-details-title" className="ui-modal-title">
                  Follow-up Details
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <Badge variant="primary">{detailsItem.id}</Badge>
                  <Badge
                    variant={
                      detailsItem.status === 'Completed'
                        ? 'success'
                        : detailsItem.status === 'Due Today'
                        ? 'warning'
                        : 'info'
                    }
                  >
                    {detailsItem.status}
                  </Badge>
                </div>
              </div>
              <button
                type="button"
                className="ui-modal-close"
                onClick={() => setDetailsItem(null)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="ui-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="detail-box">
                  <span className="detail-label">Task</span>
                  <p style={{ fontWeight: 600, color: 'var(--text-navy)', marginTop: '0.25rem' }}>
                    {detailsItem.taskTitle}
                  </p>
                </div>

                <div className="detail-box">
                  <span className="detail-label">Customer Profile</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-navy)', marginTop: '0.25rem' }}>
                    {detailsItem.customerName} ({detailsItem.customerId})
                  </div>
                  {detailsItem.customerPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', fontSize: '0.85rem' }}>
                      <Phone size={13} color="var(--primary)" />
                      <a href={`tel:${detailsItem.customerPhone}`} style={{ color: 'var(--primary)' }}>
                        {detailsItem.customerPhone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Channel</span>
                    <span className="detail-value">{detailsItem.channel}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Priority</span>
                    <span className="detail-value">{detailsItem.priority}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Due Date</span>
                    <span className="detail-value">{formatScheduledDisplay(detailsItem.dueDate, detailsItem.dueTime)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Assigned Agent</span>
                    <span className="detail-value">{detailsItem.agent || 'Lead Admin'}</span>
                  </div>
                </div>

                {detailsItem.notes && (
                  <div className="detail-box">
                    <span className="detail-label">Notes & Observations</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                      {detailsItem.notes}
                    </p>
                  </div>
                )}

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div>Created: {detailsItem.createdAt.split('T')[0]}</div>
                  {detailsItem.completedAt && <div>Completed: {detailsItem.completedAt.split('T')[0]}</div>}
                </div>
              </div>
            </div>

            <div className="ui-modal-footer">
              <Button variant="secondary" onClick={() => setDetailsItem(null)}>
                Close
              </Button>
              <Button
                variant={detailsItem.status === 'Completed' ? 'secondary' : 'primary'}
                icon={detailsItem.status === 'Completed' ? <RotateCcw size={14} /> : <CheckCircle2 size={14} />}
                onClick={() => {
                  handleToggleComplete(detailsItem);
                  setDetailsItem(null);
                }}
              >
                {detailsItem.status === 'Completed' ? 'Reopen Follow-up' : 'Mark Completed'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. DELETE CONFIRMATION MODAL
         ===================================================================== */}
      {deleteItem && (
        <div className="ui-modal-overlay" onClick={() => setDeleteItem(null)}>
          <div
            className="ui-modal-container"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-fu-title"
          >
            <div className="ui-modal-header" style={{ borderBottomColor: '#fecaca' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={18} />
                </div>
                <h3 id="delete-fu-title" className="ui-modal-title" style={{ color: '#991b1b' }}>
                  Delete Follow-up
                </h3>
              </div>
              <button
                type="button"
                className="ui-modal-close"
                onClick={() => setDeleteItem(null)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ui-modal-body">
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                Are you sure you want to delete follow-up task <strong>{deleteItem.id}</strong> for{' '}
                <strong>{deleteItem.customerName}</strong>?
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                This action will permanently remove the follow-up from browser storage.
              </p>
            </div>

            <div className="ui-modal-footer">
              <Button variant="secondary" onClick={() => setDeleteItem(null)}>
                Cancel
              </Button>
              <Button variant="danger" icon={<Trash2 size={15} />} onClick={handleDeleteConfirm}>
                Delete Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
