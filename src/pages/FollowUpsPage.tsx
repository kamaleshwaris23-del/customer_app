import React, { useState } from 'react';
import { Clock, Calendar, CheckCircle2, Phone, Mail, MapPin, Plus } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

interface FollowUpItem {
  id: string;
  customerName: string;
  customerId: string;
  taskTitle: string;
  scheduledTime: string;
  channel: 'Phone Call' | 'In-Person Visit' | 'Email';
  priority: 'High' | 'Medium' | 'Normal';
  status: 'Due Today' | 'Upcoming' | 'Completed';
  agent: string;
  notes: string;
}

export const FollowUpsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'All' | 'Due Today' | 'Upcoming' | 'Completed'>('Due Today');

  const followUps: FollowUpItem[] = [
    {
      id: 'FU-101',
      customerName: 'Marcus Brody',
      customerId: 'D2L-9019',
      taskTitle: 'Verify identity documents and signed consent form',
      scheduledTime: 'Today at 2:00 PM',
      channel: 'Phone Call',
      priority: 'High',
      status: 'Due Today',
      agent: 'Lisa Ray',
      notes: 'Customer requested a quick call after lunch regarding paper verification.',
    },
    {
      id: 'FU-102',
      customerName: 'Eleanor Vance',
      customerId: 'D2L-9020',
      taskTitle: 'Check on policy preference update',
      scheduledTime: 'Today at 4:30 PM',
      channel: 'Email',
      priority: 'Medium',
      status: 'Due Today',
      agent: 'Sarah Jenkins',
      notes: 'Send follow-up options for annual review program.',
    },
    {
      id: 'FU-103',
      customerName: 'Clara Oswald',
      customerId: 'D2L-9018',
      taskTitle: 'Field residence check-in and address re-validation',
      scheduledTime: 'Tomorrow at 11:00 AM',
      channel: 'In-Person Visit',
      priority: 'Normal',
      status: 'Upcoming',
      agent: 'David Miller',
      notes: 'In-person field visit scheduled for North Sector.',
    },
    {
      id: 'FU-104',
      customerName: 'Arthur Pendelton',
      customerId: 'D2L-9021',
      taskTitle: 'Initial welcome check-in and portal orientation',
      scheduledTime: 'Yesterday at 3:15 PM',
      channel: 'Phone Call',
      priority: 'Normal',
      status: 'Completed',
      agent: 'David Miller',
      notes: 'Customer confirmed receiving welcome pack and verified personal data.',
    },
  ];

  const filteredItems = followUps.filter((item) => {
    if (activeTab === 'All') return true;
    return item.status === activeTab;
  });

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="Track customer touchpoints, scheduled calls, field visits, and data collection reminders."
        actions={
          <Button variant="primary" icon={<Plus size={16} />}>
            Schedule Follow-up
          </Button>
        }
      />

      {/* Tab Filter Row */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        {(['All', 'Due Today', 'Upcoming', 'Completed'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === tab ? 'var(--primary-light)' : 'transparent',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Follow-up Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <Card key={item.id}>
              <CardContent style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: item.status === 'Completed' ? '#ecfdf5' : '#eff6ff',
                        color: item.status === 'Completed' ? '#047857' : '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.status === 'Completed' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-navy)' }}>
                          {item.customerName}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ({item.customerId})
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
                      </div>

                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {item.taskTitle}
                      </p>

                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                        {item.notes}
                      </p>

                      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} style={{ color: 'var(--text-faint)' }} />
                          {item.scheduledTime}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {item.channel === 'Phone Call' && <Phone size={14} style={{ color: 'var(--text-faint)' }} />}
                          {item.channel === 'Email' && <Mail size={14} style={{ color: 'var(--text-faint)' }} />}
                          {item.channel === 'In-Person Visit' && <MapPin size={14} style={{ color: 'var(--text-faint)' }} />}
                          {item.channel}
                        </span>
                        <span>Assigned: <strong>{item.agent}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'center' }}>
                    <Button variant="secondary" size="sm">
                      Details
                    </Button>
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
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
              <h3 className="empty-state-title">No follow-ups in this queue</h3>
              <p className="empty-state-text">
                All scheduled interactions for this category have either been addressed or none are currently assigned.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
