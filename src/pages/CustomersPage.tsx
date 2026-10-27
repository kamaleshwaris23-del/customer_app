import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  X,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge, type BadgeVariant } from '../components/common/Badge';
import type { Customer, CustomerCategory, Gender } from '../types/customer';
import {
  useCustomers,
  deleteCustomer,
  exportCustomersToJSON,
} from '../services/customerStorage';
import { useSettings } from '../services/settingsStorage';
import { useDemoRole } from '../services/roleStorage';

const CATEGORY_LIST: CustomerCategory[] = [
  'Business Owner',
  'Entrepreneur',
  'Student',
  'Professional',
  'Self-employed',
  'Investor',
  'General Customer',
];

const GENDER_LIST: Gender[] = ['Female', 'Male', 'Prefer not to say'];

type SortField = 'fullName' | 'id' | 'category' | 'createdAt';
type SortDirection = 'asc' | 'desc';

// Helper for category badge styling
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

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const { customers, totalCount } = useCustomers();
  const { categories: dynamicCategories } = useSettings();
  const { isAdmin } = useDemoRole();
  const categoryOptions = dynamicCategories && dynamicCategories.length > 0 ? dynamicCategories : CATEGORY_LIST;

  // Search & Filtering State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [genderFilter, setGenderFilter] = useState<string>('All');

  // Sorting State
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Modal States
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Reset pagination when search or filters change
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryFilter(val);
    setCurrentPage(1);
  };

  const handleGenderFilterChange = (val: string) => {
    setGenderFilter(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (val: number) => {
    setPageSize(val);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'createdAt' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  // Filter & Sort Logic
  const sortedAndFilteredCustomers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    const cleanPhoneQuery = query.replace(/^\+91[\s-]*/, '').replace(/[\s-]/g, '');

    const filtered = customers.filter((c) => {
      const cleanStoredContact = c.primaryContact.replace(/^\+91[\s-]*/, '').replace(/[\s-]/g, '');

      const matchesSearch =
        !query ||
        c.fullName.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query) ||
        c.primaryContact.toLowerCase().includes(query) ||
        (cleanPhoneQuery.length > 0 && cleanStoredContact.includes(cleanPhoneQuery));

      const matchesCategory =
        categoryFilter === 'All' || c.category === categoryFilter;

      const matchesGender = genderFilter === 'All' || c.gender === genderFilter;

      return matchesSearch && matchesCategory && matchesGender;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'fullName') {
        comparison = a.fullName.localeCompare(b.fullName);
      } else if (sortField === 'id') {
        const numA = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
        comparison = numA !== numB ? numA - numB : a.id.localeCompare(b.id);
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortField === 'createdAt') {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        comparison = timeA - timeB;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [customers, searchTerm, categoryFilter, genderFilter, sortField, sortDirection]);

  // Pagination calculation
  const totalRecords = sortedAndFilteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedCustomers = sortedAndFilteredCustomers.slice(startIndex, endIndex);

  const handleDeleteConfirm = () => {
    if (!customerToDelete) return;
    const deleted = deleteCustomer(customerToDelete.id);
    if (deleted) {
      setActionNotice(`Customer ${customerToDelete.fullName} (${customerToDelete.id}) was permanently deleted.`);
      setTimeout(() => setActionNotice(null), 4000);
    }
    setCustomerToDelete(null);
  };

  const handleExportJSON = () => {
    if (customers.length === 0) {
      alert('There are no saved customer records to export. Add a customer first.');
      return;
    }
    const result = exportCustomersToJSON();
    if (result.success) {
      setActionNotice(`Exported ${result.count} customer records to JSON file.`);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} style={{ opacity: 0.4, marginLeft: '0.35rem' }} />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={13} style={{ color: 'var(--primary)', marginLeft: '0.35rem' }} />
    ) : (
      <ArrowDown size={13} style={{ color: 'var(--primary)', marginLeft: '0.35rem' }} />
    );
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Search, view, manage, and export verified customer records with real browser-side persistence."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Download size={16} />}
              onClick={handleExportJSON}
              title="Download saved customer records as a .json file"
            >
              Export JSON
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

      {/* Action Notification Banner */}
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
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter and Control Bar */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-faint)',
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
                placeholder="Search by name, ID, phone..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={15} style={{ color: 'var(--text-muted)' }} />
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '150px' }}
                value={categoryFilter}
                onChange={(e) => handleCategoryFilterChange(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="All">All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '130px' }}
                value={genderFilter}
                onChange={(e) => handleGenderFilterChange(e.target.value)}
                aria-label="Filter by gender"
              >
                <option value="All">All Genders</option>
                {GENDER_LIST.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rows per page selector and counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>Rows:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.3rem 1.75rem 0.3rem 0.6rem', fontSize: '0.85rem' }}
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total: <strong>{totalCount}</strong>
            </div>
          </div>
        </div>
      </Card>

      {/* Customer Table or Empty State */}
      <Card>
        <CardContent style={{ padding: 0 }}>
          {totalCount === 0 ? (
            /* Empty State: No saved customers in storage yet */
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users size={32} />
              </div>
              <h3 className="empty-state-title">No customers registered yet</h3>
              <p className="empty-state-text">
                Your customer directory is currently empty. Start by capturing your first customer profile with full demographic and contact information.
              </p>
              <Button
                variant="primary"
                icon={<UserPlus size={16} />}
                onClick={() => navigate('/add-customer')}
              >
                Add First Customer
              </Button>
            </div>
          ) : sortedAndFilteredCustomers.length === 0 ? (
            /* Empty Filter State */
            <div className="empty-state" style={{ padding: '3rem 1.5rem' }}>
              <div className="empty-state-icon" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                <Search size={28} />
              </div>
              <h3 className="empty-state-title">No matching customers</h3>
              <p className="empty-state-text">
                No customer profiles match your current search query or filter selections. Try clearing filters or searching for another term.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('All');
                  setGenderFilter('All');
                  setCurrentPage(1);
                }}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            /* Responsive Data Table with Interactive Sorting */
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('fullName')}
                      title="Sort by Customer Name"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Customer Name {renderSortIndicator('fullName')}
                      </div>
                    </th>
                    <th
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('id')}
                      title="Sort by Customer ID"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Customer ID {renderSortIndicator('id')}
                      </div>
                    </th>
                    <th>Contact Info</th>
                    <th>Demographics</th>
                    <th
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('category')}
                      title="Sort by Category"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Category {renderSortIndicator('category')}
                      </div>
                    </th>
                    <th>Location</th>
                    <th
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => handleSort('createdAt')}
                      title="Sort by Created Date"
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Created {renderSortIndicator('createdAt')}
                      </div>
                    </th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map((customer) => (
                    <tr key={customer.id}>
                      {/* Name */}
                      <td>
                        <div
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-navy)',
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          title="Click to view full customer profile"
                        >
                          {customer.fullName}
                        </div>
                      </td>

                      {/* Customer ID */}
                      <td>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          title="Click to open customer profile"
                        >
                          {customer.id}
                        </div>
                      </td>

                      {/* Primary Contact & Email */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600 }}>
                          <Phone size={13} style={{ color: 'var(--text-faint)' }} />
                          {customer.primaryContact}
                        </div>
                        {customer.email ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <Mail size={13} style={{ color: 'var(--text-faint)' }} />
                            {customer.email}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                            No email provided
                          </span>
                        )}
                      </td>

                      {/* Demographics: Age, Gender, Occupation */}
                      <td>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-navy)', fontWeight: 500 }}>
                          {customer.occupation}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {customer.age} yrs • {customer.gender}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td>
                        <Badge variant={getCategoryBadgeVariant(customer.category)}>
                          {customer.category}
                        </Badge>
                      </td>

                      {/* Location */}
                      <td>
                        {customer.location ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                            <MapPin size={13} style={{ color: 'var(--text-faint)' }} />
                            <span>{customer.location}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                            —
                          </span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {formatDateTime(customer.createdAt)}
                        </span>
                      </td>

                      {/* Action Buttons: View, Edit, Delete */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye size={15} />}
                            title="View Full Profile"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            aria-label={`View ${customer.fullName}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Edit size={15} />}
                            title="Edit Profile"
                            onClick={() => navigate(`/customers/edit/${customer.id}`)}
                            aria-label={`Edit ${customer.fullName}`}
                          />
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              style={{ color: '#ef4444' }}
                              icon={<Trash2 size={15} />}
                              title="Delete Customer"
                              onClick={() => setCustomerToDelete(customer)}
                              aria-label={`Delete ${customer.fullName}`}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Footer with Pagination Controls */}
        {totalRecords > 0 && (
          <CardFooter style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of{' '}
              <strong>{totalRecords}</strong> filtered customer{totalRecords === 1 ? '' : 's'}
              {totalRecords !== totalCount && ` (filtered from ${totalCount} total)`}
            </span>

            {/* Pagination Button Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronsLeft size={15} />}
                disabled={activePage <= 1}
                onClick={() => setCurrentPage(1)}
                title="First Page"
                aria-label="First Page"
              />
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronLeft size={15} />}
                disabled={activePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
                aria-label="Previous Page"
              />

              <span style={{ padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-navy)' }}>
                Page {activePage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                icon={<ChevronRight size={15} />}
                disabled={activePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="Next Page"
                aria-label="Next Page"
              />
              <Button
                variant="outline"
                size="sm"
                icon={<ChevronsRight size={15} />}
                disabled={activePage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                title="Last Page"
                aria-label="Last Page"
              />
            </div>
          </CardFooter>
        )}
      </Card>

      {/* =====================================================================
          View Customer Profile Modal (Also kept for quick modal preview)
         ===================================================================== */}
      {viewCustomer && (
        <div className="ui-modal-overlay" onClick={() => setViewCustomer(null)}>
          <div
            className="ui-modal-container modal-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-customer-name"
          >
            <div className="ui-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div>
                  <h3 id="modal-customer-name" className="ui-modal-title">
                    {viewCustomer.fullName}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                    <Badge variant="primary">{viewCustomer.id}</Badge>
                    <Badge variant={getCategoryBadgeVariant(viewCustomer.category)}>
                      {viewCustomer.category}
                    </Badge>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="ui-modal-close"
                onClick={() => setViewCustomer(null)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="ui-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="detail-box">
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    Demographics & Profile
                  </h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Age</span>
                      <span className="detail-value">{viewCustomer.age} years old</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Gender</span>
                      <span className="detail-value">{viewCustomer.gender}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Occupation</span>
                      <span className="detail-value">{viewCustomer.occupation}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Category</span>
                      <span className="detail-value">{viewCustomer.category}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-box">
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                    Contact Information
                  </h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Primary Mobile Contact</span>
                      <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Phone size={14} color="var(--primary)" />
                        <a href={`tel:${viewCustomer.primaryContact}`} style={{ color: 'var(--primary)' }}>
                          {viewCustomer.primaryContact}
                        </a>
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email Address</span>
                      <span className="detail-value">
                        {viewCustomer.email ? (
                          <a href={`mailto:${viewCustomer.email}`} style={{ color: 'var(--primary)' }}>
                            {viewCustomer.email}
                          </a>
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>
                    <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                      <span className="detail-label">Location / Address</span>
                      <span className="detail-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={14} color="var(--text-faint)" />
                        {viewCustomer.location || 'No location provided'}
                      </span>
                    </div>
                  </div>
                </div>

                {(viewCustomer.interests || viewCustomer.notes) && (
                  <div className="detail-box">
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                      Background & Notes
                    </h4>
                    {viewCustomer.interests && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span className="detail-label">Interests & Preferences</span>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-navy)', marginTop: '0.2rem' }}>
                          {viewCustomer.interests}
                        </p>
                      </div>
                    )}
                    {viewCustomer.notes && (
                      <div>
                        <span className="detail-label">Field Notes</span>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem', whiteSpace: 'pre-wrap' }}>
                          {viewCustomer.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>
                  <span>Created: {formatDateTime(viewCustomer.createdAt)}</span>
                  <span>Last Updated: {formatDateTime(viewCustomer.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="ui-modal-footer">
              <Button variant="secondary" onClick={() => setViewCustomer(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                icon={<Eye size={15} />}
                onClick={() => {
                  const id = viewCustomer.id;
                  setViewCustomer(null);
                  navigate(`/customers/${id}`);
                }}
              >
                Go to Dedicated Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          Delete Confirmation Dialog Modal
         ===================================================================== */}
      {customerToDelete && (
        <div className="ui-modal-overlay" onClick={() => setCustomerToDelete(null)}>
          <div
            className="ui-modal-container"
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
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
                <h3 id="delete-dialog-title" className="ui-modal-title" style={{ color: '#991b1b' }}>
                  Delete Customer Record
                </h3>
              </div>
              <button
                type="button"
                className="ui-modal-close"
                onClick={() => setCustomerToDelete(null)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ui-modal-body">
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete customer{' '}
                <strong style={{ color: 'var(--text-navy)' }}>
                  {customerToDelete.fullName}
                </strong>{' '}
                (ID: <code>{customerToDelete.id}</code>)?
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                This record will be immediately removed from browser storage. This action cannot be undone.
              </p>
            </div>

            <div className="ui-modal-footer">
              <Button variant="secondary" onClick={() => setCustomerToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 size={16} />}
                onClick={handleDeleteConfirm}
              >
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
