import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, Cpu, Webhook, Zap } from 'lucide-react';
import api from '../api/client';
import { PageHeader, Button, Spinner, ErrorBanner, EmptyState, Modal, Field, inputClass, Toast } from '../components/ui';
import { triggerLabel } from '../utils/format';

const TRIGGERS = ['lead.created', 'lead.score_updated', 'lead.status_updated'];
const OPERATORS = ['equals', 'greater_than', 'less_than', 'empty'];
const ACTION_TYPES = ['assign_user', 'send_message', 'trigger_webhook'];

const EMPTY_RULE = {
  name: '',
  trigger_event: 'lead.created',
  conditions: { field: 'lead_score', operator: 'greater_than', value: '80' },
  actions: { action_type: 'trigger_webhook', parameters: { url: '' } },
};

export default function AutomationsPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_RULE);
  const [saving, setSaving] = useState(false);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/automations');
      setRules(res.data.data || []);
    } catch {
      setError('Could not load automation rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createRule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/automations', form);
      setFormOpen(false);
      setForm(EMPTY_RULE);
      notify('Automation rule created');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not create rule', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (rule) => {
    try {
      const res = await api.post(`/automations/${rule.id}/toggle`);
      setRules((prev) => prev.map((r) => (r.id === rule.id ? res.data.data : r)));
      notify(`Rule ${res.data.data.is_active ? 'activated' : 'paused'}`);
    } catch {
      notify('Could not toggle rule', 'error');
    }
  };

  const deleteRule = async (id) => {
    if (!window.confirm('Delete this automation rule?')) return;
    try {
      await api.delete(`/automations/${id}`);
      notify('Rule deleted');
      load();
    } catch {
      notify('Could not delete rule', 'error');
    }
  };

  const actionLabel = (actions) => {
    const t = actions?.action_type || '—';
    const labels = { assign_user: 'Assign user', send_message: 'Send message', trigger_webhook: 'Trigger webhook' };
    return labels[t] || t;
  };

  const conditionText = (c) => {
    if (!c) return 'Always';
    const { field, operator, value } = c;
    if (operator === 'empty') return `${field} is empty`;
    return `${field} ${operator.replace(/_/g, ' ')} ${value}`;
  };

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <PageHeader
        title="Workflow Automations"
        subtitle="Define rules that run automatically when lead events fire."
        actions={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> New Rule</Button>}
      />
      <ErrorBanner message={error} onRetry={load} />

      {/* n8n webhook banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/50 via-violet-950/40 to-transparent border border-indigo-800/30 p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Webhook className="h-4 w-4 text-indigo-400" />
          <h3 className="font-semibold text-white">n8n Integration Webhook</h3>
        </div>
        <p className="text-sm text-slate-400 mb-3">
          Trigger events from external tools (WhatsApp replies, email opens, form fills) by POSTing to:
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-indigo-300 text-xs">
            POST /api/webhooks/n8n
          </code>
          <code className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700 text-slate-400 text-xs">
            {'{"lead_id": 1, "action": "whatsapp_reply", "message": "Interested!", "update_data": {"priority": "high"}}'}
          </code>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : rules.length === 0 ? (
        <div className="glass-card rounded-2xl">
          <EmptyState icon={Cpu} title="No automation rules" message="Create your first rule to auto-assign leads, send messages or trigger webhooks." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rules.map((rule) => (
            <div key={rule.id} className={`glass-card rounded-2xl p-6 transition-all ${rule.is_active ? 'hover:border-indigo-500/30' : 'opacity-60'}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${rule.is_active ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{rule.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Trigger: {triggerLabel(rule.trigger_event)}</p>
                  </div>
                </div>
                <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors cursor-pointer">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs mb-4">
                <div className="rounded-xl bg-slate-900/50 border border-slate-800 px-3 py-2">
                  <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] mb-0.5">When</p>
                  <p className="text-slate-300">IF {conditionText(rule.conditions)}</p>
                </div>
                <div className="rounded-xl bg-slate-900/50 border border-slate-800 px-3 py-2">
                  <p className="text-slate-500 font-semibold uppercase tracking-wide text-[10px] mb-0.5">Then</p>
                  <p className="text-slate-300">{actionLabel(rule.actions)}</p>
                  {rule.actions?.parameters && Object.keys(rule.actions.parameters).length > 0 && (
                    <pre className="mt-1.5 text-[10px] text-slate-500 whitespace-pre-wrap">{JSON.stringify(rule.actions.parameters, null, 2)}</pre>
                  )}
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => toggleRule(rule)}
                className="flex items-center justify-between w-full rounded-xl px-3 py-2 bg-slate-900/50 border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer"
              >
                <span className={`text-xs font-semibold ${rule.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {rule.is_active ? 'Active' : 'Paused'}
                </span>
                <span className={`relative h-5 w-9 rounded-full transition-colors ${rule.is_active ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${rule.is_active ? 'left-[18px]' : 'left-0.5'}`} />
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Rule Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Create automation rule">
        <form onSubmit={createRule} className="space-y-4">
          <Field label="Rule name" required>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Auto-assign hot leads" />
          </Field>
          <Field label="Trigger event" required>
            <select value={form.trigger_event} onChange={(e) => setForm({ ...form, trigger_event: e.target.value })} className={inputClass}>
              {TRIGGERS.map((t) => <option key={t} value={t}>{triggerLabel(t)}</option>)}
            </select>
          </Field>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Conditions</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Field">
                <input value={form.conditions.field} onChange={(e) => setForm({ ...form, conditions: { ...form.conditions, field: e.target.value } })} className={inputClass} placeholder="lead_score" />
              </Field>
              <Field label="Operator">
                <select value={form.conditions.operator} onChange={(e) => setForm({ ...form, conditions: { ...form.conditions, operator: e.target.value } })} className={inputClass}>
                  {OPERATORS.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                </select>
              </Field>
              <Field label="Value">
                <input value={form.conditions.value} onChange={(e) => setForm({ ...form, conditions: { ...form.conditions, value: e.target.value } })} className={inputClass} placeholder="80" />
              </Field>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Action</p>
            <Field label="Action type">
              <select value={form.actions.action_type} onChange={(e) => setForm({ ...form, actions: { action_type: e.target.value, parameters: {} } })} className={inputClass}>
                {ACTION_TYPES.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
            {form.actions.action_type === 'trigger_webhook' && (
              <div className="mt-3">
                <Field label="Webhook URL">
                  <input value={form.actions.parameters?.url || ''} onChange={(e) => setForm({ ...form, actions: { ...form.actions, parameters: { url: e.target.value } } })} className={inputClass} placeholder="https://n8n.yourcompany.com/webhook/..." />
                </Field>
              </div>
            )}
            {form.actions.action_type === 'assign_user' && (
              <div className="mt-3">
                <Field label="User role to assign">
                  <select value={form.actions.parameters?.user_role || 'commercial'} onChange={(e) => setForm({ ...form, actions: { ...form.actions, parameters: { user_role: e.target.value } } })} className={inputClass}>
                    <option value="commercial">Commercial</option>
                    <option value="manager">Manager</option>
                  </select>
                </Field>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
