import React, { useState } from 'react';
import { Save, Bell, Shield, Sliders, Building } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'fields' | 'security'>('general');

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your Door2Life organization parameters, data intake fields, and team preferences."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '2rem' }}>
        {/* Settings Navigation Nav */}
        <div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {[
              { id: 'general', label: 'Organization', icon: <Building size={16} /> },
              { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
              { id: 'fields', label: 'Intake Fields', icon: <Sliders size={16} /> },
              { id: 'security', label: 'Security & Access', icon: <Shield size={16} /> },
            ].map((tab) => (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.65rem 0.85rem',
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

        {/* Settings Content Pane */}
        <div>
          {activeTab === 'general' && (
            <Card>
              <CardHeader
                title="Organization Information"
                subtitle="Primary profile settings for Door2Life deployment"
              />
              <CardContent>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Organization Name</label>
                    <input
                      type="text"
                      className="form-input"
                      defaultValue="Door2Life Global Foundation"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Support Email</label>
                    <input
                      type="email"
                      className="form-input"
                      defaultValue="support@door2life.io"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Hotline</label>
                    <input
                      type="tel"
                      className="form-input"
                      defaultValue="+1 (800) 555-D2L"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Default Region / Locale</label>
                    <select className="form-select" defaultValue="en-US">
                      <option value="en-US">United States (USD, en-US)</option>
                      <option value="en-CA">Canada (CAD, en-CA)</option>
                      <option value="en-GB">United Kingdom (GBP, en-GB)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Timezone</label>
                    <select className="form-select" defaultValue="utc-5">
                      <option value="utc-5">Eastern Time (UTC-5)</option>
                      <option value="utc-6">Central Time (UTC-6)</option>
                      <option value="utc-7">Mountain Time (UTC-7)</option>
                      <option value="utc-8">Pacific Time (UTC-8)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter style={{ justifyContent: 'flex-end' }}>
                <Button variant="primary" icon={<Save size={16} />}>
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader
                title="Notification Preferences"
                subtitle="Manage automated reminders and field intake alerts"
              />
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ marginTop: '0.25rem' }} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                        Follow-up Due Alerts
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Receive immediate notifications when customer follow-up actions reach their scheduled time.
                      </div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ marginTop: '0.25rem' }} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                        Daily Intake Summary
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Send an aggregated email report of all new customer profiles collected in the preceding 24 hours.
                      </div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ marginTop: '0.25rem' }} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-navy)' }}>
                        Field Verification Warnings
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Notify admins when a profile submission lacks full address or verification metadata.
                      </div>
                    </div>
                  </label>
                </div>
              </CardContent>
              <CardFooter style={{ justifyContent: 'flex-end' }}>
                <Button variant="primary" icon={<Save size={16} />}>
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === 'fields' && (
            <Card>
              <CardHeader
                title="Customer Intake Fields"
                subtitle="Configure custom attributes collected by field teams"
              />
              <CardContent>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Standard system attributes (Full Name, Phone, Email, Address) are active. Additional customer intake attributes can be customized here.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {['Emergency Contact Number', 'Alternative Identity Proof (National ID)', 'Household Size & Dependents', 'Field Agent GPS Coordinates'].map((field) => (
                    <div
                      key={field}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                        {field}
                      </span>
                      <Button variant="ghost" size="sm">
                        Edit Field
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader
                title="Security & Access Control"
                subtitle="Role-based permissions and session management"
              />
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: '#eff6ff', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                      Two-Factor Authentication (2FA) Enforced
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#1e3a8a' }}>
                      All team members with access to customer identification records must authenticate via authenticator app.
                    </p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Field Agent Session Timeout</label>
                    <select className="form-select" defaultValue="60">
                      <option value="30">30 minutes of inactivity</option>
                      <option value="60">60 minutes of inactivity</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
