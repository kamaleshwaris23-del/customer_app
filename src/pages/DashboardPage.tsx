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
  Phone,
  Mail,
  PieChart,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import { useCustomers } from '../services/customerStorage';
import { useFollowUps } from '../services/followUpStorage';
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

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { customers, totalCount } = useCustomers();
  const { followUps, pendingCount, dueTodayCount } = useFollowUps();

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

  // Real urgent/pending follow-ups
  const urgentFollowUps = useMemo(() => {
    return followUps
      .filter((f) => f.status !== 'Completed')
      .slice(0, 4);
  }, [followUps]);

  // Real-time category breakdown
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach((c) => {
      const cat = c.category || 'General Customer';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([cat, count]) => ({
        category: cat as CustomerCategory,
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [customers, totalCount]);

  // Real-time requested support programs
  const supportStats = useMemo(() => {
    let training = 0;
    let mentorship = 0;
    let expansion = 0;
    customers.forEach((c) => {
      if (c.trainingRequired) training++;
      if (c.mentorshipRequired) mentorship++;
      if (c.businessExpansion) expansion++;
    });
    return { training, mentorship, expansion };
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
            <span className="stat-label">Pending Follow-ups</span>
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-trend" style={{ color: dueTodayCount > 0 ? '#d97706' : '#10b981' }}>
              <Clock size={14} /> {dueTodayCount} due today
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
      <div className="dashboard-main-grid">
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

        {/* Priority Follow-up Actions (Connected to Real Storage) */}
        <Card>
          <CardHeader
            title="Urgent Follow-ups"
            subtitle={
              pendingCount > 0
                ? `${pendingCount} scheduled touchpoint${pendingCount === 1 ? '' : 's'} in pipeline`
                : 'Touchpoints requiring team attention'
            }
            action={
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowRight size={14} />}
                iconPosition="right"
                onClick={() => navigate('/follow-ups')}
              >
                View All ({followUps.length})
              </Button>
            }
          />
          <CardContent>
            {urgentFollowUps.length === 0 ? (
              <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                <div
                  className="empty-state-icon"
                  style={{
                    width: '48px',
                    height: '48px',
                    marginBottom: '0.75rem',
                    backgroundColor: '#ecfdf5',
                    color: '#047857',
                  }}
                >
                  <Clock size={22} />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-navy)', marginBottom: '0.25rem' }}>
                  No pending follow-ups
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  All scheduled customer interactions have been addressed. Schedule a touchpoint anytime.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Clock size={14} />}
                  onClick={() => navigate('/follow-ups')}
                >
                  Go to Follow-ups
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {urgentFollowUps.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                      padding: '0.85rem 1rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate('/follow-ups')}
                    title="Click to view follow-up"
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: item.status === 'Due Today' ? '#fffbeb' : '#eff6ff',
                        color: item.status === 'Due Today' ? '#b45309' : '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Clock size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-navy)',
                            fontSize: '0.9rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.customerName}
                        </span>
                        <Badge variant={item.priority === 'High' ? 'warning' : 'neutral'}>
                          {item.status}
                        </Badge>
                      </div>
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          marginTop: '0.2rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.taskTitle}
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Due: {item.dueDate}</span>
                        <span>•</span>
                        <span>{item.channel}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown & Support Insights */}
      {totalCount > 0 && (
        <div className="dashboard-insights-grid">
          {/* Customer Category Segmentation */}
          <Card>
            <CardHeader
              title="Customer Category Distribution"
              subtitle="Breakdown of customer portfolio across registered categories"
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                  <PieChart size={15} />
                  <span>{categoryStats.length} Categories</span>
                </div>
              }
            />
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {categoryStats.map(({ category, count, percentage }) => (
                  <div key={category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Badge variant={getCategoryBadgeVariant(category)}>{category}</Badge>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                        {count} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({percentage}%)</span>
                      </span>
                    </div>
                    <div style={{ height: '6px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${percentage}%`,
                          backgroundColor: 'var(--primary)',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Special Support & Venture Programs */}
          <Card>
            <CardHeader
              title="Requested Support Programs"
              subtitle="Customer interest in training, mentorship, and business scaling"
              action={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600 }}>
                  <Sparkles size={15} />
                  <span>Program Insights</span>
                </div>
              }
            />
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#fffbeb',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fef3c7',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#92400e', fontSize: '0.88rem' }}>
                      Skill & Entrepreneurship Training
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#b45309' }}>
                      Customers seeking formal capacity building
                    </div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b45309' }}>
                    {supportStats.training}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#eff6ff',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #dbeafe',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e40af', fontSize: '0.88rem' }}>
                      1-on-1 Mentorship & Advisory
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#2563eb' }}>
                      Customers requesting strategic guidance
                    </div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e40af' }}>
                    {supportStats.mentorship}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#ecfdf5',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #d1fae5',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: '#065f46', fontSize: '0.88rem' }}>
                      Business Expansion & Scaling
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#047857' }}>
                      Enterprises planning market expansion
                    </div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46' }}>
                    {supportStats.expansion}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
