import { useEffect, useState } from 'react';
import { Plus, GripVertical, Loader2, KanbanSquare } from 'lucide-react';
import api from '../api/client';
import { PageHeader, Button, Spinner, ErrorBanner, EmptyState, Modal, Field, inputClass, Toast } from '../components/ui';
import { fullName, formatMoney } from '../utils/format';

const STAGES = [
  { key: 'new_lead', label: 'New Lead', dot: 'bg-sky-400', ring: 'border-sky-500/20', header: 'text-sky-300' },
  { key: 'contacted', label: 'Contacted', dot: 'bg-indigo-400', ring: 'border-indigo-500/20', header: 'text-indigo-300' },
  { key: 'meeting_scheduled', label: 'Meeting', dot: 'bg-violet-400', ring: 'border-violet-500/20', header: 'text-violet-300' },
  { key: 'proposal_sent', label: 'Proposal', dot: 'bg-amber-400', ring: 'border-amber-500/20', header: 'text-amber-300' },
  { key: 'negotiation', label: 'Negotiation', dot: 'bg-orange-400', ring: 'border-orange-500/20', header: 'text-orange-300' },
  { key: 'won', label: 'Won', dot: 'bg-emerald-400', ring: 'border-emerald-500/20', header: 'text-emerald-300' },
  { key: 'lost', label: 'Lost', dot: 'bg-rose-400', ring: 'border-rose-500/20', header: 'text-rose-300' },
];

export default function PipelinePage() {
  const [deals, setDeals] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ lead_id: '', name: '', value: '', stage: 'new_lead' });
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/deals');
      setDeals(res.data.data || []);
    } catch {
      setError('Could not load the pipeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    api.get('/leads', { params: { per_page: 100 } })
      .then((res) => setLeads(res.data.data || []))
      .catch(() => {});
  }, []);

  const moveStage = async (dealId, stage) => {
    // optimistic update
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage } : d)));
    try {
      await api.put(`/deals/${dealId}/stage`, { stage });
      notify('Deal moved to ' + stage.replace(/_/g, ' '));
    } catch {
      load();
      notify('Could not move deal', 'error');
    }
  };

  const createDeal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/deals', {
        lead_id: Number(form.lead_id),
        name: form.name,
        value: Number(form.value),
        stage: form.stage,
      });
      setDeals((prev) => [res.data.data, ...prev]);
      setFormOpen(false);
      setForm({ lead_id: '', name: '', value: '', stage: 'new_lead' });
      notify('Deal created');
    } catch (err) {
      notify(err.response?.data?.message || 'Could not create deal', 'error');
    } finally {
      setSaving(false);
    }
  };

  const grouped = STAGES.map((stage) => ({
    ...stage,
    deals: deals.filter((d) => d.stage === stage.key),
  }));

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <PageHeader
        title="Sales Pipeline"
        subtitle="Drag deals between stages — lead statuses sync automatically."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> New Deal
          </Button>
        }
      />
      <ErrorBanner message={error} onRetry={load} />

      {loading ? (
        <Spinner />
      ) : deals.length === 0 && leads.length === 0 ? (
        <div className="glass-card rounded-2xl">
          <EmptyState icon={KanbanSquare} title="No deals yet" message="Create your first deal from a lead to start building the pipeline." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7 gap-4 items-start">
          {grouped.map((stage) => {
            const total = stage.deals.reduce((sum, d) => sum + Number(d.value || 0), 0);
            return (
              <div
                key={stage.key}
                onDragOver={(e) => { e.preventDefault(); setOverStage(stage.key); }}
                onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
                onDrop={() => { if (dragId) moveStage(dragId, stage.key); setOverStage(null); setDragId(null); }}
                className={`glass-card rounded-2xl p-3 min-h-[120px] transition-all duration-200 ${overStage === stage.key ? 'ring-2 ring-indigo-500/50 border-indigo-500/40' : ''}`}
              >
                <div className="flex items-center justify-between px-1 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${stage.dot}`} />
                    <h3 className={`text-sm font-bold uppercase tracking-wide ${stage.header}`}>{stage.label}</h3>
                    <span className="text-xs text-slate-500 font-semibold bg-slate-800/70 rounded-full px-2 py-0.5">{stage.deals.length}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {stage.deals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => setDragId(deal.id)}
                      onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      className={`group rounded-xl bg-slate-900/70 border border-slate-700/60 p-3 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-grab active:cursor-grabbing ${dragId === deal.id ? 'opacity-40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white leading-snug">{deal.name}</p>
                        <GripVertical className="h-4 w-4 text-slate-600 group-hover:text-slate-400 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {deal.lead ? fullName(deal.lead.first_name, deal.lead.last_name) : 'Unknown lead'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-emerald-400">{formatMoney(deal.value)}</span>
                        {deal.lead?.company_name && (
                          <span className="text-[10px] text-slate-500 truncate max-w-[45%]">{deal.lead.company_name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {stage.deals.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-700/60 p-3 text-center text-xs text-slate-600">
                      Drop deals here
                    </div>
                  )}
                </div>

                {total > 0 && (
                  <p className="text-[11px] text-slate-500 mt-3 px-1">Total: <span className="text-slate-300 font-semibold">{formatMoney(total)}</span></p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Deal Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Create a new deal">
        <form onSubmit={createDeal} className="space-y-4">
          <Field label="Lead" required>
            <select required value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })} className={inputClass}>
              <option value="">Select a lead...</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{fullName(l.first_name, l.last_name)}{l.company_name ? ` · ${l.company_name}` : ''}</option>
              ))}
            </select>
          </Field>
          <Field label="Deal name" required>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="e.g. Enterprise SaaS contract" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Value (DT)" required>
              <input required type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={inputClass} placeholder="15000" />
            </Field>
            <Field label="Stage">
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className={inputClass}>
                {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.lead_id}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create deal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
