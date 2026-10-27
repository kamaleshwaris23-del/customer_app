import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Users,
  Clock,
  HardDrive,
  FileSpreadsheet,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useDemoRole } from '../services/roleStorage';
import { useCustomers } from '../services/customerStorage';
import { useFollowUps } from '../services/followUpStorage';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { role, setDemoRole } = useDemoRole();
  const { totalCount } = useCustomers();
  const { pendingCount } = useFollowUps();

  const handleGetStarted = () => {
    try {
      localStorage.setItem('door2life_onboarded_v1', 'true');
    } catch {
      // ignore
    }
    navigate('/dashboard');
  };

  return (
    <div style={{ maxWidth: '960px', margin: '1.5rem auto', padding: '0 1rem' }}>
      {/* Hero Welcome Card */}
      <Card style={{ overflow: 'hidden', border: '1px solid var(--border-medium)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: '3rem 2.5rem',
            position: 'relative',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', marginBottom: '1.25rem' }}>
            <Sparkles size={16} color="#38bdf8" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>Door2Life Platform v2.0 • Local Storage Mode</span>
          </div>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2, margin: '0 0 1rem 0' }}>
            Streamlined Customer Data Intake & Management
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#94a3b8', maxWidth: '640px', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
            Capture verified field records, schedule relationship touchpoints, and manage team workflows entirely within your browser with zero cloud or backend dependency.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight size={18} />}
              iconPosition="right"
              onClick={handleGetStarted}
              style={{ padding: '0.75rem 1.75rem', fontSize: '1rem', fontWeight: 700 }}
            >
              Get Started
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/customers')}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: 'rgba(255,255,255,0.12)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              View Directory ({totalCount})
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate('/add-customer')}
              style={{ color: '#38bdf8' }}
            >
              + Add Customer
            </Button>
          </div>
        </div>

        {/* Demo Role Selector Bar */}
        <CardContent style={{ backgroundColor: '#f8fafc', padding: '1.25rem 2rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#eff6ff',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldAlert size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-navy)' }}>
                  Demo Access Role: <Badge variant={role === 'Admin' ? 'primary' : 'neutral'}>{role}</Badge>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Switch demo role to simulate Admin or Team Member UI privileges. (Demo UI only — no server authentication).
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setDemoRole('Admin')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: role === 'Admin' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  backgroundColor: role === 'Admin' ? 'var(--primary-light)' : '#ffffff',
                  color: role === 'Admin' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: role === 'Admin' ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Admin (Full Access)
              </button>
              <button
                type="button"
                onClick={() => setDemoRole('Team Member')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: role === 'Team Member' ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                  backgroundColor: role === 'Team Member' ? 'var(--primary-light)' : '#ffffff',
                  color: role === 'Team Member' ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: role === 'Team Member' ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Team Member (Field Role)
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Capabilities Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '1.75rem' }}>
        <Card>
          <CardContent style={{ padding: '1.5rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Users size={20} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-navy)', marginBottom: '0.35rem' }}>
              4-Step Customer Intake
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Structured intake wizard with 10-digit Indian mobile validation, category classification, and single-confirmation save.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '1.5rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fffbeb',
                color: '#b45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Clock size={20} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-navy)', marginBottom: '0.35rem' }}>
              Touchpoint Follow-ups
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Track scheduled phone calls, visits, due today queues ({pendingCount} pending), and reschedule or complete touchpoints.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '1.5rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ecfdf5',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <HardDrive size={20} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-navy)', marginBottom: '0.35rem' }}>
              100% Local Storage
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Data is stored securely in this browser's LocalStorage and is device-specific. Use the Backup & Restore or Import/Export hub to easily transfer records across machines.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent style={{ padding: '1.5rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <FileSpreadsheet size={20} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-navy)', marginBottom: '0.35rem' }}>
              JSON & CSV Portability
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Complete export and import for Excel/Sheets CSV and structured JSON datasets with safe duplicate detection.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Highlights Banner */}
      <div
        style={{
          marginTop: '1.75rem',
          padding: '1rem 1.5rem',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle2 size={18} color="#16a34a" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-navy)', fontWeight: 600 }}>
            {totalCount} Customer Records • {pendingCount} Pending Follow-ups • Ready for Field Operations
          </span>
        </div>

        <Button variant="primary" size="sm" icon={<ArrowRight size={14} />} iconPosition="right" onClick={handleGetStarted}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};
