import React, { useState } from 'react';
import {
  UploadCloud,
  Download,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useCustomers, exportCustomersToJSON } from '../services/customerStorage';

export const ImportExportPage: React.FC = () => {
  const { totalCount } = useCustomers();
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExport = () => {
    if (totalCount === 0) {
      alert('No customer records found in browser storage to export. Add a customer first.');
      return;
    }
    const result = exportCustomersToJSON();
    if (result.success) {
      setExportNotice(`Exported ${result.count} verified customer records as JSON.`);
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  return (
    <div>
      <PageHeader
        title="Import / Export"
        description="Bulk upload customer datasets from regional field intake files or extract verified records."
      />

      {exportNotice && (
        <div className="ui-alert-banner success">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{exportNotice}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.75rem' }}>
        {/* Import Hub */}
        <Card>
          <CardHeader
            title="Import Customer Records"
            subtitle="Upload .CSV, .XLSX, or JSON data files"
          />
          <CardContent>
            {/* Dropzone Container */}
            <div
              style={{
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                backgroundColor: '#fafbfc',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <UploadCloud size={26} />
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-navy)' }}>
                Choose a file or drag and drop here
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                Supports standard UTF-8 CSV, Excel (.xlsx) up to 25MB
              </p>

              <div style={{ marginTop: '1.25rem' }}>
                <Button variant="secondary" size="sm">
                  Browse Files
                </Button>
              </div>
            </div>

            {/* Template & Field Guide */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                  Standard Template Schema
                </span>
                <Badge variant="info">Door2Life v1.0</Badge>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={14} color="#10b981" /> Full Name, Age, Gender, Primary Contact (Required)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={14} color="#10b981" /> Occupation and Category (Required)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={14} color="#10b981" /> 10-Digit Primary Contact Number
                </li>
              </ul>
            </div>
          </CardContent>

          <CardFooter style={{ justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Need the official format?
            </span>
            <Button variant="ghost" size="sm" icon={<FileText size={14} />}>
              Download CSV Template
            </Button>
          </CardFooter>
        </Card>

        {/* Export Hub */}
        <Card>
          <CardHeader
            title="Export Customer Records"
            subtitle="Extract verified customer records from browser storage"
          />
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Available Export Formats</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  <div
                    style={{
                      padding: '0.75rem 0.5rem',
                      border: '2px solid var(--primary)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--primary)',
                      backgroundColor: 'var(--primary-light)',
                    }}
                  >
                    JSON Dataset (Active)
                  </div>
                  <div
                    style={{
                      padding: '0.75rem 0.5rem',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    CSV Spreadsheet (Upcoming)
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Data Source</label>
                <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div>Storage Key: <code>door2life_customers_v1</code></div>
                  <div style={{ marginTop: '0.25rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                    Total Real Records: {totalCount}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Included Customer Attributes</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" defaultChecked disabled /> Full Name, Age, Gender
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" defaultChecked disabled /> Primary Contact & Email
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" defaultChecked disabled /> Occupation & Category
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" defaultChecked disabled /> Location, Interests & Notes
                  </label>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter style={{ justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {totalCount} saved record{totalCount === 1 ? '' : 's'} ready
            </span>
            <Button
              variant="primary"
              icon={<Download size={16} />}
              onClick={handleExport}
              disabled={totalCount === 0}
            >
              Export JSON ({totalCount})
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
