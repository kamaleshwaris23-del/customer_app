import React, { useState, useMemo } from 'react';
import {
  History,
  Shield,
  Search,
  User,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardHeader } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useAuthSession } from '../services/authService';
import { useAuditLogs } from '../services/auditStorage';

const ACTION_BADGE_VARIANTS: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'neutral'> = {
  login: 'info',
  logout: 'neutral',
  customer_create: 'success',
  customer_update: 'primary',
  customer_delete: 'warning',
  customer_assign: 'warning',
  user_create: 'success',
  user_update: 'primary',
  user_role_change: 'warning',
  user_deactivate: 'warning',
  user_activate: 'success',
  import: 'info',
  export: 'info',
  settings_update: 'warning',
};

export const AuditLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, isSuperAdmin } = useAuthSession();
  const { logs, loading } = useAuditLogs(role, user?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('All');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (log.user_email && log.user_email.toLowerCase().includes(q)) ||
        log.action.toLowerCase().includes(q) ||
        log.entity_type.toLowerCase().includes(q) ||
        (log.entity_id && log.entity_id.toLowerCase().includes(q));

      const matchesAction = actionFilter === 'All' || log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const formatTimestamp = (iso?: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <PageHeader
        title={isSuperAdmin ? 'Security Audit Logs' : 'My Activity History'}
        description={
          isSuperAdmin
            ? 'Complete immutable chronological record of authentication events, user role elevations, customer assignments, and system operations.'
            : 'Personal record of your recent actions, intakes, and profile activity.'
        }
        actions={
          <Button variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        }
      />

      {/* Security Banner for Super Admin */}
      {isSuperAdmin && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <Shield size={20} color="#2563eb" />
          <div style={{ fontSize: '0.85rem', color: '#1e3a8a' }}>
            <strong>Super Admin Privilege:</strong> Audit logs are strictly immutable and protected by database Row Level Security. Only Super Admin accounts have permission to inspect cross-tenant platform audit trails.
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <CardContent style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="Filter by user email, action, entity ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ minWidth: '180px' }}>
                <select
                  className="form-select"
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  aria-label="Filter by action"
                >
                  <option value="All">All Actions ({logs.length})</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="customer_create">Customer Created</option>
                  <option value="customer_update">Customer Updated</option>
                  <option value="customer_delete">Customer Deleted</option>
                  <option value="customer_assign">Customer Assigned</option>
                  <option value="user_create">User Created</option>
                  <option value="user_role_change">Role Changed</option>
                  <option value="user_deactivate">User Deactivated</option>
                  <option value="import">Data Import</option>
                  <option value="export">Data Export</option>
                </select>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Showing {filteredLogs.length} of {logs.length} logged entries
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader
          title={isSuperAdmin ? 'Audit Log Trail' : 'Activity Trail'}
          subtitle="Events recorded automatically with system timestamp and authenticated user ID"
        />
        <CardContent style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
              <History size={36} style={{ color: '#94a3b8', marginBottom: '0.75rem' }} />
              <h3 className="empty-state-title">No Audit Logs Found</h3>
              <p className="empty-state-text">
                {searchTerm || actionFilter !== 'All'
                  ? 'No audit log entries match your active filters.'
                  : 'No actions have been recorded yet in this environment.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>User / Agent</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={13} color="#94a3b8" />
                          <span>{formatTimestamp(log.created_at)}</span>
                        </div>
                      </td>
                      <td>
                        <Badge variant={ACTION_BADGE_VARIANTS[log.action] || 'neutral'}>
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                          <User size={13} color="var(--primary)" />
                          <span>{log.user_email || 'System'}</span>
                        </div>
                        {log.user_role && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Role: {log.user_role}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-navy)', fontWeight: 600 }}>
                          {log.entity_type}
                        </div>
                        {log.entity_id && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            ID: {log.entity_id}
                          </div>
                        )}
                      </td>
                      <td>
                        {log.details ? (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                            {JSON.stringify(log.details).replace(/[{"}]/g, ' ')}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
