import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  X,
  Layers,
  ShieldCheck,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  useCustomers,
  exportCustomersToJSON,
  exportCustomersToCSV,
  validateCustomerImport,
  validateCustomerCSVImport,
  importCustomers,
} from '../services/customerStorage';
import type {
  CustomerImportValidationResult,
  ImportMergeStrategy,
} from '../types/customer';

export const ImportExportPage: React.FC = () => {
  const { customers, totalCount } = useCustomers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notifications
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Export Format State
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  // Import State
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<CustomerImportValidationResult | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<ImportMergeStrategy>('skip-duplicates');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = () => {
    if (totalCount === 0) {
      alert('No customer records found in browser storage to export. Add a customer first.');
      return;
    }

    if (exportFormat === 'csv') {
      const result = exportCustomersToCSV();
      if (result.success) {
        setExportNotice(`Exported ${result.count} verified customer records as an RFC-4180 CSV spreadsheet.`);
        setTimeout(() => setExportNotice(null), 5000);
      }
    } else {
      const result = exportCustomersToJSON();
      if (result.success) {
        setExportNotice(`Exported ${result.count} verified customer records as JSON with metadata.`);
        setTimeout(() => setExportNotice(null), 5000);
      }
    }
  };

  const handleFileProcess = (file: File) => {
    setImportError(null);
    setImportNotice(null);
    setSelectedFileName(file.name);
    setConfirmReplace(false);

    const lowerName = file.name.toLowerCase();
    const isJson = lowerName.endsWith('.json');
    const isCsv = lowerName.endsWith('.csv');

    if (!isJson && !isCsv) {
      setImportError('Please select a valid .json or .csv file. Other file formats are not supported.');
      setValidationResult(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;

        if (isCsv) {
          const validation = validateCustomerCSVImport(text);
          if (!validation.isValid && validation.error) {
            setImportError(validation.error);
          }
          setValidationResult(validation);
        } else {
          const parsed = JSON.parse(text);
          const validation = validateCustomerImport(parsed);
          if (!validation.isValid && validation.error) {
            setImportError(validation.error);
          }
          setValidationResult(validation);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid file syntax or structure.';
        setImportError(`Failed to parse file: ${msg}`);
        setValidationResult(null);
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read file from disk. Please try again.');
      setValidationResult(null);
    };

    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleResetImport = () => {
    setSelectedFileName(null);
    setValidationResult(null);
    setImportError(null);
    setConfirmReplace(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExecuteImport = () => {
    if (!validationResult || validationResult.validRecords.length === 0) {
      setImportError('No valid records found in the import file to process.');
      return;
    }

    if (mergeStrategy === 'full-replace' && !confirmReplace) {
      setImportError('Please check the confirmation box before executing a full replacement.');
      return;
    }

    setIsProcessing(true);
    setImportError(null);

    try {
      const result = importCustomers(validationResult.validRecords, mergeStrategy);

      if (result.success) {
        const summary =
          mergeStrategy === 'full-replace'
            ? `Successfully replaced storage with ${result.totalImported} customer records.`
            : `Import completed: ${result.addedCount} added, ${result.updatedCount} updated, ${result.skippedCount} skipped.`;

        setImportNotice(summary);
        handleResetImport();
      } else {
        setImportError(result.error || 'Failed to complete import.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error during import.';
      setImportError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Import / Export"
        description="Extract and backup verified customer records or securely import JSON / CSV datasets into browser storage."
      />

      {/* Export Success Banner */}
      {exportNotice && (
        <div className="ui-alert-banner success" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#065f46' }}
            aria-label="Dismiss notice"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Import Success Banner */}
      {importNotice && (
        <div className="ui-alert-banner success" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} />
            <span>{importNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportNotice(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#065f46' }}
            aria-label="Dismiss notice"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Import Error Banner */}
      {importError && (
        <div className="ui-alert-banner error" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{importError}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportError(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#991b1b' }}
            aria-label="Dismiss error"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
        {/* ===================================================================
            1. IMPORT HUB
           =================================================================== */}
        <Card>
          <CardHeader
            title="Import Customer Records"
            subtitle="Upload validated .JSON backup or .CSV spreadsheet into browser LocalStorage"
          />
          <CardContent>
            {/* Hidden HTML File Input supporting both JSON and CSV */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json,.csv,text/csv"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />

            {!validationResult ? (
              /* Dropzone Container when no file is active */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: isDragging ? 'var(--primary-light)' : '#fafbfc',
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
                  Choose a JSON or CSV file or drag and drop here
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Supports Door2Life JSON backup datasets and standard CSV spreadsheets with customer fields
                </p>

                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <Button variant="secondary" size="sm" type="button">
                    Browse File (.json / .csv)
                  </Button>
                </div>
              </div>
            ) : (
              /* Validation Preview Panel when file is loaded */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* File Header Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#f1f5f9',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedFileName?.toLowerCase().endsWith('.csv') ? (
                      <FileSpreadsheet size={18} style={{ color: '#059669' }} />
                    ) : (
                      <FileText size={18} style={{ color: 'var(--primary)' }} />
                    )}
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-navy)' }}>
                      {selectedFileName}
                    </span>
                    {validationResult.fileMetadata?.version && (
                      <Badge variant="info">v{validationResult.fileMetadata.version}</Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" icon={<X size={15} />} onClick={handleResetImport}>
                    Change File
                  </Button>
                </div>

                {/* Validation Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                      {validationResult.validRecords.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>Valid Records</div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb' }}>
                      {validationResult.newUniqueRecords.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 600 }}>Brand New</div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706' }}>
                      {validationResult.duplicateIdCount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>Existing IDs</div>
                  </div>

                  <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626' }}>
                      {validationResult.invalidRecords.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600 }}>Invalid Rows</div>
                  </div>
                </div>

                {/* Invalid Records Alert if any */}
                {validationResult.invalidRecords.length > 0 && (
                  <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#991b1b' }}>
                    <strong>Notice:</strong> {validationResult.invalidRecords.length} record(s) failed validation and will be skipped.
                    <ul style={{ marginTop: '0.35rem', paddingLeft: '1.25rem' }}>
                      {validationResult.invalidRecords.slice(0, 3).map((inv, idx) => (
                        <li key={idx}>Row {inv.index + 1}: {inv.error}</li>
                      ))}
                      {validationResult.invalidRecords.length > 3 && (
                        <li>...and {validationResult.invalidRecords.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Duplicate IDs Alert if any */}
                {validationResult.duplicateIdCount > 0 && (
                  <div style={{ padding: '0.75rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '0.1rem', color: '#d97706' }} />
                    <div>
                      <strong>Duplicate Customer IDs ({validationResult.duplicateIdCount}):</strong>{' '}
                      Found records sharing IDs with existing profiles ({validationResult.duplicateIds.slice(0, 4).join(', ')}{validationResult.duplicateIds.length > 4 ? ` +${validationResult.duplicateIds.length - 4} more` : ''}).
                      <div style={{ marginTop: '0.2rem', color: '#78350f' }}>
                        Under <em>Safe Merge (Skip Duplicates)</em>, your existing customer records are never overwritten or deleted.
                      </div>
                    </div>
                  </div>
                )}

                {/* Safe Merge Strategy Selector */}
                <div style={{ border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-navy)', marginBottom: '0.75rem' }}>
                    Choose Import Strategy
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Strategy 1: Safe Merge (Skip Duplicates) - DEFAULT */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: mergeStrategy === 'skip-duplicates' ? 'var(--primary-light)' : '#f8fafc',
                        border: mergeStrategy === 'skip-duplicates' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="mergeStrategy"
                        value="skip-duplicates"
                        checked={mergeStrategy === 'skip-duplicates'}
                        onChange={() => setMergeStrategy('skip-duplicates')}
                        style={{ marginTop: '0.2rem' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-navy)' }}>
                          Safe Merge (Skip Duplicates) — Default & Recommended
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Adds only new unique customer records. Preserves all {totalCount} existing records without modifying or overwriting them.
                        </div>
                      </div>
                    </label>

                    {/* Strategy 2: Update Existing by ID + Append New */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: mergeStrategy === 'merge-overwrite' ? 'var(--primary-light)' : '#f8fafc',
                        border: mergeStrategy === 'merge-overwrite' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="mergeStrategy"
                        value="merge-overwrite"
                        checked={mergeStrategy === 'merge-overwrite'}
                        onChange={() => setMergeStrategy('merge-overwrite')}
                        style={{ marginTop: '0.2rem' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-navy)' }}>
                          Update Existing by ID + Append New
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Updates existing records that match the customer ID (e.g. D2L-1001) and inserts any new unique records.
                        </div>
                      </div>
                    </label>

                    {/* Strategy 3: Full Replacement */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: mergeStrategy === 'full-replace' ? '#fef2f2' : '#f8fafc',
                        border: mergeStrategy === 'full-replace' ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="mergeStrategy"
                        value="full-replace"
                        checked={mergeStrategy === 'full-replace'}
                        onChange={() => setMergeStrategy('full-replace')}
                        style={{ marginTop: '0.2rem' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#991b1b' }}>
                          Full Dataset Replacement (Destructive)
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#7f1d1d', marginTop: '0.15rem' }}>
                          Overwrites all current {totalCount} records in localStorage with the imported valid records.
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Explicit confirmation checkbox for full replacement */}
                  {mergeStrategy === 'full-replace' && (
                    <div style={{ marginTop: '0.85rem', padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: 'var(--radius-sm)', border: '1px solid #f87171' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, color: '#991b1b', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={confirmReplace}
                          onChange={(e) => setConfirmReplace(e.target.checked)}
                        />
                        <span>I confirm I want to overwrite all {totalCount} local customer records with this file.</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Preview Table of First 5 Valid Records */}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-navy)', marginBottom: '0.5rem' }}>
                    File Record Preview (Showing first {Math.min(5, validationResult.validRecords.length)} of {validationResult.validRecords.length}):
                  </div>
                  <div className="table-responsive" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    <table className="data-table" style={{ fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Full Name</th>
                          <th>Contact</th>
                          <th>Category</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationResult.validRecords.slice(0, 5).map((rec, i) => {
                          const isExistingId = customers.some((c) => c.id === rec.id);
                          return (
                            <tr key={i}>
                              <td style={{ fontWeight: 600 }}>{rec.id}</td>
                              <td>{rec.fullName}</td>
                              <td>{rec.primaryContact}</td>
                              <td>{rec.category}</td>
                              <td>
                                {isExistingId ? (
                                  <Badge variant="warning">Matches Existing</Badge>
                                ) : (
                                  <Badge variant="success">New Record</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Template & Field Guide */}
            {!validationResult && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                    Standard Format Compatibility
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <Badge variant="info">JSON v1.0</Badge>
                    <Badge variant="success">CSV Spreadsheet</Badge>
                  </div>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={14} color="#10b981" /> Full Name (≥2 chars), Age (1-120), Gender (Female/Male/Prefer not to say)
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={14} color="#10b981" /> 10-Digit Indian Mobile Primary Contact (e.g. 9876543210 or +91)
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={14} color="#10b981" /> Occupation and Valid Category (e.g. Business Owner, Professional, etc.)
                  </li>
                </ul>
              </div>
            )}
          </CardContent>

          <CardFooter style={{ justifyContent: 'space-between' }}>
            {!validationResult ? (
              <>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Active Storage: {totalCount} records
                </span>
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Select File (.json / .csv)
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={handleResetImport} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={isProcessing ? <RefreshCw size={14} className="spinner-rotate" /> : <Layers size={14} />}
                  onClick={handleExecuteImport}
                  disabled={
                    isProcessing ||
                    validationResult.validRecords.length === 0 ||
                    (mergeStrategy === 'full-replace' && !confirmReplace)
                  }
                >
                  {isProcessing
                    ? 'Processing...'
                    : mergeStrategy === 'full-replace'
                    ? `Replace with ${validationResult.validRecords.length} Records`
                    : `Confirm Import (${validationResult.validRecords.length} Records)`}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>

        {/* ===================================================================
            2. EXPORT HUB
           =================================================================== */}
        <Card>
          <CardHeader
            title="Export Customer Records"
            subtitle="Extract verified customer records from browser LocalStorage with full metadata"
          />
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Choose Export Format</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div
                    onClick={() => setExportFormat('json')}
                    style={{
                      padding: '0.85rem 0.75rem',
                      border: exportFormat === 'json' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: exportFormat === 'json' ? 'var(--primary)' : 'var(--text-secondary)',
                      backgroundColor: exportFormat === 'json' ? 'var(--primary-light)' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>JSON Dataset</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Full backup with schema metadata
                    </div>
                  </div>

                  <div
                    onClick={() => setExportFormat('csv')}
                    style={{
                      padding: '0.85rem 0.75rem',
                      border: exportFormat === 'csv' ? '2px solid #059669' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: exportFormat === 'csv' ? '#059669' : 'var(--text-secondary)',
                      backgroundColor: exportFormat === 'csv' ? '#ecfdf5' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>CSV Spreadsheet</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Excel / Sheets compatible format
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Data Source & Storage Key</label>
                <div style={{ padding: '0.85rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div>Storage Key: <code>door2life_customers_v1</code></div>
                  <div style={{ marginTop: '0.25rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                    Total Persisted Records: {totalCount}
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Includes sequential IDs (D2L-1001, D2L-1002, etc.), full contact details, and audit timestamps.
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Export Metadata Package</label>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-navy)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <ShieldCheck size={14} color="#10b981" />
                    <span>Included in export:</span>
                  </div>
                  • Application: <code>Door2Life</code><br />
                  • Format: <code>{exportFormat.toUpperCase()}</code><br />
                  • Total Record Count: {totalCount}<br />
                  • Complete Customer fields: Demographics, Contact, Category, Location, Notes
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
              icon={exportFormat === 'csv' ? <FileSpreadsheet size={16} /> : <Download size={16} />}
              onClick={handleExport}
              disabled={totalCount === 0}
            >
              Export {exportFormat.toUpperCase()} ({totalCount})
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
