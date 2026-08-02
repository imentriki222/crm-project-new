import { useCallback, useEffect, useState } from 'react';
import {
  Plus, Search, Download, Upload, Eye, Pencil, Trash2, Users, ChevronLeft, ChevronRight,
} from 'lucide-react';
import api from '../api/client';
import { PageHeader, Button, Spinner, ErrorBanner, EmptyState, Modal, inputClass, Toast } from '../components/ui';
import { StatusBadge, PriorityBadge, ScoreBadge } from '../components/badges';
import { initials, fullName, formatDate, timeAgo } from '../utils/format';
import LeadFormModal from './leads/LeadFormModal';
import LeadDetailModal from './leads/LeadDetailModal';

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [meta, setMeta] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [filters, setFilters] = useState({ status: '', priority: '', lead_source: '' });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Debounce the search box so we don't fire an API call per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, search };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const res = await api.get('/leads', { params });
      setLeads(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch {
      setError('Could not load leads.');
    } finally {
      setLoading(false);
    }
  }, [page, filters, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/users').then((res) => setUsers(res.data.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (payload) => {
    if (editing) {
      await api.put(`/leads/${editing.id}`, payload);
      notify('Lead updated successfully');
    } else {
      await api.post('/leads', payload);
      notify('Lead created successfully');
    }
    setEditing(null);
    setFormOpen(false);
    load();
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/leads/${deleting.id}`);
      notify('Lead deleted');
      setDeleting(null);
      load();
    } catch {
      notify('Failed to delete lead', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/leads/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads_export.csv';
      a.click();
      URL.revokeObjectURL(url);
      notify('Leads exported to CSV');
    } catch {
      notify('Export failed', 'error');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/leads/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      notify(res.data.message || 'Leads imported');
      load();
    } catch {
      notify('Import failed — check your CSV format', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const totalPages = meta?.last_page || 1;

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <PageHeader
        title="Leads"
        subtitle="Manage, score and qualify your prospects."
        actions={
          <>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700">
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleImport} />
              <Upload className="h-4 w-4" /> Import CSV
            </label>
            <Button variant="secondary" onClick={handleExport}><Download className="h-4 w-4" /> Export</Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> New Lead
            </Button>
          </>
        }
      />

      <ErrorBanner message={error} onRetry={load} />

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, company..."
              className={`${inputClass} pl-10`}
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
            className={inputClass}
          >
            <option value="">All statuses</option>
            {['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}
            className={inputClass}
          >
            <option value="">All priorities</option>
            {['low', 'medium', 'high'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filters.lead_source}
            onChange={(e) => { setFilters({ ...filters, lead_source: e.target.value }); setPage(1); }}
            className={inputClass}
          >
            <option value="">All sources</option>
            {['organic', 'google_ads', 'social_media', 'referral', 'cold_call', 'facebook_ads', 'website', 'other'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : leads.length === 0 ? (
        <div className="glass-card rounded-2xl">
          <EmptyState icon={Users} title="No leads found" message="Try adjusting your filters or create your first lead." />
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <th className="px-5 py-4 font-semibold">Lead</th>
                  <th className="px-5 py-4 font-semibold hidden lg:table-cell">Contact</th>
                  <th className="px-5 py-4 font-semibold hidden md:table-cell">Source</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold hidden sm:table-cell">Priority</th>
                  <th className="px-5 py-4 font-semibold">Score</th>
                  <th className="px-5 py-4 font-semibold hidden lg:table-cell">Assigned</th>
                  <th className="px-5 py-4 font-semibold hidden xl:table-cell">Created</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => setDetailId(lead.id)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
                          {initials(lead.first_name, lead.last_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">{fullName(lead.first_name, lead.last_name)}</p>
                          <p className="text-xs text-slate-500 truncate">{lead.job_title || '—'} {lead.company_name && `· ${lead.company_name}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-slate-300">{lead.email || '—'}</p>
                      <p className="text-xs text-slate-500">{lead.phone || lead.whatsapp || '—'}</p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-slate-400 capitalize">{lead.lead_source.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-4"><StatusBadge status={lead.status} /></td>
                    <td className="px-5 py-4 hidden sm:table-cell"><PriorityBadge priority={lead.priority} /></td>
                    <td className="px-5 py-4"><ScoreBadge score={lead.lead_score} /></td>
                    <td className="px-5 py-4 hidden lg:table-cell text-slate-400">
                      {lead.assignee ? <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{lead.assignee.first_name}</span> : <span className="text-slate-600">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4 hidden xl:table-cell text-slate-500" title={formatDate(lead.created_at)}>{timeAgo(lead.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-indigo-300 transition-colors cursor-pointer" title="View" onClick={() => setDetailId(lead.id)}>
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-indigo-300 transition-colors cursor-pointer" title="Edit" onClick={() => { setEditing(lead); setFormOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors cursor-pointer" title="Delete" onClick={() => setDeleting(lead)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">
                Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total} leads
              </p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)} className="!px-3 !py-1.5">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-400">Page {page} / {totalPages}</span>
                <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="!px-3 !py-1.5">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <LeadFormModal
        key={editing?.id ?? 'new'}
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        lead={editing}
        users={users}
      />
      <LeadDetailModal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        leadId={detailId}
        onUpdated={() => { setDetailId(null); setEditing(leads.find((l) => l.id === detailId) || null); setFormOpen(true); }}
      />
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete lead?">
        <p className="text-sm text-slate-400">
          This will permanently remove{' '}
          <span className="text-white font-medium">{deleting && fullName(deleting.first_name, deleting.last_name)}</span>
          {' '}and all associated data.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}><Trash2 className="h-4 w-4" /> Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
