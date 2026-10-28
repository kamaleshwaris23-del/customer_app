import React, { useState } from 'react';
import {
  UserPlus,
  Mail,
  Phone,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  useTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
  type TeamMember,
  type TeamMemberStatus,
} from '../services/teamStorage';
import { useDemoRole } from '../services/roleStorage';

export const TeamMembersPage: React.FC = () => {
  const { team, activeCount } = useTeamMembers();
  const { isAdmin } = useDemoRole();

  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<TeamMemberStatus>('Active');
  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setFormName('');
    setFormRole('');
    setFormEmail('');
    setFormPhone('');
    setFormStatus('Active');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setMemberToEdit(member);
    setFormName(member.name);
    setFormRole(member.role);
    setFormEmail(member.email);
    setFormPhone(member.phone);
    setFormStatus(member.status);
    setFormError(null);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Member name is required.');
      return;
    }
    if (!formRole.trim()) {
      setFormError('Member role is required.');
      return;
    }
    if (!formEmail.trim()) {
      setFormError('Email address is required.');
      return;
    }

    if (memberToEdit) {
      const result = updateTeamMember(memberToEdit.id, {
        name: formName.trim(),
        role: formRole.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        status: formStatus,
      });

      if (result.success) {
        setMemberToEdit(null);
        setActionNotice(`Updated profile for ${formName.trim()}.`);
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        setFormError(result.error || 'Failed to update member.');
      }
    } else {
      const result = addTeamMember({
        name: formName.trim(),
        role: formRole.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        status: formStatus,
      });

      if (result.success && result.member) {
        setIsAddModalOpen(false);
        setActionNotice(`Added ${result.member.name} (${result.member.id}) to staff directory.`);
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        setFormError(result.error || 'Failed to add member.');
      }
    }
  };

  const handleDeleteConfirm = () => {
    if (!memberToDelete) return;
    deleteTeamMember(memberToDelete.id);
    setActionNotice(`Team member ${memberToDelete.name} was removed.`);
    setMemberToDelete(null);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div>
      <PageHeader
        title="Team Members"
        description="Manage system access, regional field assignments, and staff profiles stored in browser LocalStorage."
        actions={
          isAdmin ? (
            <Button variant="primary" icon={<UserPlus size={16} />} onClick={handleOpenAddModal}>
              Add Team Member
            </Button>
          ) : undefined
        }
      />

      {/* Role Notice Banner if in Team Member demo role */}
      {!isAdmin && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: '#eff6ff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #bfdbfe',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShieldAlert size={18} color="#2563eb" />
            <span style={{ fontSize: '0.85rem', color: '#1e3a8a' }}>
              <strong>Team Member Demo Mode:</strong> Viewing team staff is permitted. Adding, modifying, or deleting staff requires Admin role. Switch role to <strong>Admin</strong> in the top bar to test modifications.
            </span>
          </div>
        </div>
      )}

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

      {/* Staff count summary bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <span>
          Showing <strong>{team.length}</strong> registered staff members (<strong>{activeCount}</strong> active on duty)
        </span>
      </div>

      {/* Team Member Cards Grid */}
      <div className="team-cards-grid">
        {team.map((member) => (
          <Card key={member.id}>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '1rem',
                      border: '2px solid #ffffff',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                      flexShrink: 0,
                    }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-navy)' }}>
                      {member.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {member.role}
                    </p>
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {member.id}
                    </span>
                  </div>
                </div>

                <Badge
                  variant={
                    member.status === 'Active'
                      ? 'success'
                      : member.status === 'On Field'
                      ? 'info'
                      : 'neutral'
                  }
                >
                  {member.status}
                </Badge>
              </div>

              <div
                style={{
                  margin: '1.25rem 0',
                  padding: '0.85rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Profiles</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-navy)', fontSize: '0.95rem' }}>
                    {member.customersHandled}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Status</span>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                    {member.status}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={14} style={{ color: 'var(--text-faint)' }} />
                  <a href={`mailto:${member.email}`} style={{ color: 'var(--text-secondary)' }}>
                    {member.email}
                  </a>
                </div>
                {member.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} style={{ color: 'var(--text-faint)' }} />
                    <a href={`tel:${member.phone}`} style={{ color: 'var(--text-secondary)' }}>
                      {member.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Action Buttons for Admin role */}
              {isAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', justifyContent: 'flex-end' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit2 size={14} />}
                    onClick={() => handleOpenEditModal(member)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ color: '#ef4444' }}
                    icon={<Trash2 size={14} />}
                    onClick={() => setMemberToDelete(member)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* =====================================================================
          ADD / EDIT TEAM MEMBER MODAL
         ===================================================================== */}
      {(isAddModalOpen || memberToEdit) && (
        <div className="ui-modal-overlay" onClick={() => { setIsAddModalOpen(false); setMemberToEdit(null); }}>
          <div
            className="ui-modal-container"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-modal-title"
          >
            <form onSubmit={handleSaveMember}>
              <div className="ui-modal-header">
                <h3 id="member-modal-title" className="ui-modal-title">
                  {memberToEdit ? `Edit Staff Profile: ${memberToEdit.name}` : 'Add Staff Member'}
                </h3>
                <button
                  type="button"
                  className="ui-modal-close"
                  onClick={() => { setIsAddModalOpen(false); setMemberToEdit(null); }}
                  aria-label="Close dialog"
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
                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="memName">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      id="memName"
                      type="text"
                      className="form-input"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. David Miller"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="memRole">
                      Assigned Role / Title <span className="req">*</span>
                    </label>
                    <input
                      id="memRole"
                      type="text"
                      className="form-input"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      placeholder="e.g. Senior Field Representative"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="memEmail">
                      Email Address <span className="req">*</span>
                    </label>
                    <input
                      id="memEmail"
                      type="email"
                      className="form-input"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. david.m@door2life.io"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="memPhone">
                      Mobile Contact
                    </label>
                    <input
                      id="memPhone"
                      type="tel"
                      className="form-input"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. +91 98765 00000"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label" htmlFor="memStatus">
                      Duty Status
                    </label>
                    <select
                      id="memStatus"
                      className="form-select"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as TeamMemberStatus)}
                    >
                      <option value="Active">Active</option>
                      <option value="On Field">On Field</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="ui-modal-footer">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setMemberToEdit(null); }}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {memberToEdit ? 'Save Changes' : 'Add Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          DELETE CONFIRMATION MODAL
         ===================================================================== */}
      {memberToDelete && (
        <div className="ui-modal-overlay" onClick={() => setMemberToDelete(null)}>
          <div
            className="ui-modal-container"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-mem-title"
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
                <h3 id="delete-mem-title" className="ui-modal-title" style={{ color: '#991b1b' }}>
                  Remove Staff Member
                </h3>
              </div>
              <button
                type="button"
                className="ui-modal-close"
                onClick={() => setMemberToDelete(null)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ui-modal-body">
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                Are you sure you want to remove team member <strong>{memberToDelete.name}</strong> ({memberToDelete.id}) from the active staff directory?
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                This record will be deleted from browser storage.
              </p>
            </div>

            <div className="ui-modal-footer">
              <Button variant="secondary" onClick={() => setMemberToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" icon={<Trash2 size={15} />} onClick={handleDeleteConfirm}>
                Remove Member
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
