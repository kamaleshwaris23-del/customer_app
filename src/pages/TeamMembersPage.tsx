import React from 'react';
import { UserPlus, Mail, Phone } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  initials: string;
  customersHandled: number;
  status: 'Active' | 'On Field' | 'Offline';
}

export const TeamMembersPage: React.FC = () => {
  const team: TeamMember[] = [
    {
      id: 'TM-01',
      name: 'Sarah Jenkins',
      role: 'Platform Administrator',
      email: 'sarah.j@door2life.io',
      phone: '+1 (555) 019-2831',
      initials: 'SJ',
      customersHandled: 420,
      status: 'Active',
    },
    {
      id: 'TM-02',
      name: 'David Miller',
      role: 'Senior Field Representative',
      email: 'david.m@door2life.io',
      phone: '+1 (555) 018-9943',
      initials: 'DM',
      customersHandled: 312,
      status: 'On Field',
    },
    {
      id: 'TM-03',
      name: 'Lisa Ray',
      role: 'Customer Success & Intake Specialist',
      email: 'lisa.r@door2life.io',
      phone: '+1 (555) 017-4821',
      initials: 'LR',
      customersHandled: 284,
      status: 'Active',
    },
    {
      id: 'TM-04',
      name: 'James Thornton',
      role: 'Field Verification Officer',
      email: 'james.t@door2life.io',
      phone: '+1 (555) 016-7732',
      initials: 'JT',
      customersHandled: 268,
      status: 'Offline',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Team Members"
        description="Manage system access, permissions, and regional assignments for Door2Life staff."
        actions={
          <Button variant="primary" icon={<UserPlus size={16} />}>
            Invite Member
          </Button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {team.map((member) => (
          <Card key={member.id}>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
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
                  <span style={{ color: 'var(--text-muted)' }}>Managed Profiles</span>
                  <div style={{ fontWeight: 700, color: 'var(--text-navy)', fontSize: '0.95rem' }}>
                    {member.customersHandled}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Access Level</span>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                    Standard
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={14} style={{ color: 'var(--text-faint)' }} />
                  {member.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} style={{ color: 'var(--text-faint)' }} />
                  {member.phone}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
