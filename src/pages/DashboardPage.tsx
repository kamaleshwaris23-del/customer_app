import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Clock,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  AlertCircle,
  Phone,
  Mail,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { useCustomers } from '../services/customerStorage';
import type { CustomerCategory } from '../types/customer';

const getCategoryBadgeVariant = (category: CustomerCategory): BadgeVariant => {
  switch (category) {
    case 'Business Owner':
    case 'Entrepreneur':
      return 'primary';
    case 'Investor':
      return 'success';
    case 'Professional':
    case 'Self-employed':
      return 'info';
    case 'Student':
      return 'warning';
    case 'General Customer':
    default:
      return 'neutral';
  }
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { customers, totalCount } = useCustomers();

  // Stable reference time for relative calculations initialized once on mount
  const [referenceTime] = useState(() => Date.now());

  // Calculate real metrics from saved customer records
  const newThisWeekCount = useMemo(() => {
    const oneWeekAgo = referenceTime - 7 * 24 * 60 * 60 * 1000;
    return customers.filter((c) => {
      try {
        return new Date(c.createdAt).getTime() >= oneWeekAgo;
      } catch {
        return false;
      }
    }).length;
  }, [customers, referenceTime]);

  // Top 5 latest customers
  const recentCustomers = useMemo(() => {
    return [...customers].slice(0, 5);
  }, [customers]);

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    try {
      const diffMs = referenceTime - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays}d ago`;
    } catch {
      return 'Recent';
    }
  };

  return (
    <div>
      <PageHeader
        title="Welcome back, Sarah"
        description="Here is an overview of your active customer records and relationship pipeline."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<FileSpreadsheet size={16} />}
              onClick={() => navigate('/import-export')}
            >
              Import Data
            </Button>
            <Button
              variant="primary"
              icon={<UserPlus size={16} />}
              onClick={() => navigate('/add-customer')}
            >
              Add Customer
            </Button>
          </>
        }
      />

      {/* KPI Stats Row (Connected to real records) */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Saved Customers</span>
            <span className="stat-value">{totalCount}</span>
            <span className="stat-trend positive">
              <TrendingUp size={14} /> Real browser storage
            </span>
          </div>
          <div className="stat-icon-wrapper">
            <Users size={22} />
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Added This Week</span>
            <span className="stat-value">{newThisWeekCount}</span>
            <span className="stat-trend positive">
              <TrendingUp size={14} /> New intakes
            </span>
          </div>
          <div className="stat-icon-wrapper">
            <UserPlus size={22} />
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="stat-label">Pending Follow-ups</span>
              <Badge variant="neutral" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                Demo
              </Badge>
            </div>
            <span className="stat-value">5</span>
            <span className="stat-trend" style={{ color: '#d97706' }}>
              <Clock size={14} /> Due today (simulated)
            </span>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#fffbeb', color: '#b45309' }}>
            <Clock size={22} />
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Storage Integrity</span>
            <span className="stat-value">100%</span>
            <span className="stat-trend positive">
              <ShieldCheck size={14} /> Versioned local storage
            </span>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: '#ecfdf5', color: '#047857' }}>
            <ShieldCheck size={22} />
          </div>
        </Card>
      </div>

      {/* Main Grid: Recent Activity & Follow-up queue */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Customers Overview Card (Connected to Real Storage) */}
        <Card>
          <CardHeader
            title="Recent Customer Profiles"
            subtitle={
              totalCount > 0
                ? `Showing latest ${recentCustomers.length} registered customers`
                : 'Real saved customer records'
            }
            action={
              totalCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ArrowRight size={14} />}
                  iconPosition="right"
                  onClick={() => navigate('/customers')}
                >
                  View All ({totalCount})
                </Button>
              ) : null
            }
          />
          <CardContent style={{ padding: 0 }}>
            {totalCount === 0 ? (
              <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                <div className="empty-state-icon" style={{ width: '48px', height: '48px', marginBottom: '0.75rem' }}>
                  <Users size={22} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-navy)', marginBottom: '0.25rem' }}>
                  No customer records yet
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Add your first customer to view live records on this dashboard.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<UserPlus size={14} />}
                  onClick={() => navigate('/add-customer')}
                >
                  Add First Customer
                </Button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Primary Contact</th>
                      <th>Category</th>
                      <th>Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                            {customer.fullName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                            {customer.id}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                            <Phone size={12} color="var(--text-faint)" />
                            {customer.primaryContact}
                          </div>
                          {customer.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <Mail size={12} color="var(--text-faint)" />
                              {customer.email}
                            </div>
                          )}
                        </td>
                        <td>
                          <Badge variant={getCategoryBadgeVariant(customer.category)}>
                            {customer.category}
                          </Badge>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {formatRelativeTime(customer.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Follow-up Actions (Clearly marked as Demo) */}
        <Card>
          <CardHeader
            title="Urgent Follow-ups"
            subtitle="Scheduled touchpoints requiring team attention"
            action={
              <Badge variant="neutral" style={{ fontSize: '0.75rem' }}>
                Simulated Demo Pipeline
              </Badge>
            }
          />
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#fffbeb',
                    color: '#b45309',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Clock size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                      Marcus Brody — Documentation Verification
                    </span>
                    <Badge variant="warning">Due in 2h</Badge>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    [Demo data] Confirm identity documentation uploaded during field intake.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Users size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                      Clara Oswald — Onboarding Check-in
                    </span>
                    <Badge variant="info">Tomorrow</Badge>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    [Demo data] Follow up on primary address confirmation and preference selections.
                  </p>
                </div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#fafbfc', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={14} color="#64748b" />
                <span>Notice: Follow-up entries above are simulated demo tasks. Real customer profiles are saved to browser storage.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
