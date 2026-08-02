import { useEffect, useState } from 'react';
import { Plus, Send, Trash2, Pencil, Loader2, Megaphone, FileText } from 'lucide-react';
import api from '../api/client';
import { PageHeader, Button, Spinner, ErrorBanner, EmptyState, Modal, Field, inputClass, Toast } from '../components/ui';
import { CampaignStatusBadge } from '../components/badges';
import { formatDateTime } from '../utils/format';

const TYPE_STYLES = {
  email: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
  whatsapp: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  sms: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
};

function TypeBadge({ type }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${TYPE_STYLES[type] || ''}`}>
      {type}
    </span>
  );
}

function StatBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-slate-500 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-slate-300 font-medium shrink-0">{value}</span>
    </div>
  );
}

const EMPTY_TEMPLATE = { name: '', type: 'email', subject: '', body: '' };
const EMPTY_CAMPAIGN = { name: '', template_id: '', scheduled_at: '' };

export default function CampaignsPage() {
  const [tab, setTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [campModal, setCampModal] = useState(false);
  const [campForm, setCampForm] = useState(EMPTY_CAMPAIGN);
  const [sendingId, setSendingId] = useState(null);

  const [tplModal, setTplModal] = useState(false);
  const [tplForm, setTplForm] = useState(EMPTY_TEMPLATE);
  const [editingTpl, setEditingTpl] = useState(null);
  const [savingTpl, setSavingTpl] = useState(false);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [c, t] = await Promise.all([api.get('/campaigns'), api.get('/templates')]);
      setCampaigns(c.data.data || []);
      setTemplates(t.data.data || []);
    } catch {
      setError('Could not load campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createCampaign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/campaigns', {
        name: campForm.name,
        template_id: Number(campForm.template_id),
        scheduled_at: campForm.scheduled_at || undefined,
      });
      setCampModal(false);
      setCampForm(EMPTY_CAMPAIGN);
      notify('Campaign created');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not create campaign', 'error');
    }
  };

  const sendCampaign = async (id) => {
    setSendingId(id);
    try {
      const res = await api.post(`/campaigns/${id}/send`);
      notify(res.data.message || 'Campaign sent');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not send campaign', 'error');
    } finally {
      setSendingId(null);
    }
  };

  const deleteCampaign = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      notify('Campaign deleted');
      load();
    } catch {
      notify('Could not delete campaign', 'error');
    }
  };

  const saveTemplate = async (e) => {
    e.preventDefault();
    setSavingTpl(true);
    try {
      if (editingTpl) {
        await api.put(`/templates/${editingTpl.id}`, tplForm);
        notify('Template updated');
      } else {
        await api.post('/templates', tplForm);
        notify('Template created');
      }
      setTplModal(false);
      setEditingTpl(null);
      setTplForm(EMPTY_TEMPLATE);
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Could not save template', 'error');
    } finally {
      setSavingTpl(false);
    }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`/templates/${id}`);
      notify('Template deleted');
      load();
    } catch {
      notify('Could not delete template', 'error');
    }
  };

  const totalSent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <PageHeader
        title="Campaigns"
        subtitle={`${campaigns.length} campaigns · ${templates.length} templates · ${totalSent.toLocaleString()} total sends`}
        actions={
          tab === 'campaigns' ? (
            <Button onClick={() => setCampModal(true)}><Plus className="h-4 w-4" /> New Campaign</Button>
          ) : (
            <Button onClick={() => { setEditingTpl(null); setTplForm(EMPTY_TEMPLATE); setTplModal(true); }}>
              <Plus className="h-4 w-4" /> New Template
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 glass-card rounded-2xl p-1.5 w-fit">
        {[
          { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
          { key: 'templates', label: 'Templates', icon: FileText },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              tab === t.key ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-400 hover:text-white'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      <ErrorBanner message={error} onRetry={load} />

      {loading ? (
        <Spinner />
      ) : tab === 'campaigns' ? (
        campaigns.length === 0 ? (
          <div className="glass-card rounded-2xl">
            <EmptyState icon={Megaphone} title="No campaigns yet" message="Create a campaign from a template and send it to your leads." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {campaigns.map((c) => (
              <div key={c.id} className="glass-card rounded-2xl p-6 hover:border-indigo-500/25 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-white font-heading">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <TypeBadge type={c.type} />
                      <CampaignStatusBadge status={c.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => sendCampaign(c.id)}
                      disabled={sendingId === c.id || c.status === 'completed'}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      title="Send now"
                    >
                      {sendingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                    <button onClick={() => deleteCampaign(c.id)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors cursor-pointer" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  Template: <span className="text-slate-300">{c.template?.name || `#${c.template_id}`}</span>
                  {c.scheduled_at && <> · Scheduled: {formatDateTime(c.scheduled_at)}</>}
                </p>

                <div className="space-y-2">
                  <StatBar label="Sent" value={c.sent_count || 0} max={c.sent_count || 1} color="bg-indigo-500" />
                  <StatBar label="Delivered" value={c.delivered_count || 0} max={c.sent_count || 1} color="bg-sky-500" />
                  <StatBar label="Opened" value={c.opened_count || 0} max={c.sent_count || 1} color="bg-violet-500" />
                  <StatBar label="Clicked" value={c.clicked_count || 0} max={c.sent_count || 1} color="bg-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : templates.length === 0 ? (
        <div className="glass-card rounded-2xl">
          <EmptyState icon={FileText} title="No templates yet" message="Create email, WhatsApp and SMS templates to reuse across campaigns." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {templates.map((t) => (
            <div key={t.id} className="glass-card rounded-2xl p-6 flex flex-col hover:border-indigo-500/25 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-white">{t.name}</h3>
                  <div className="mt-2"><TypeBadge type={t.type} /></div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingTpl(t); setTplForm({ name: t.name, type: t.type, subject: t.subject || '', body: t.body || '' }); setTplModal(true); }} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-indigo-300 transition-colors cursor-pointer" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteTemplate(t.id)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors cursor-pointer" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {t.type === 'email' && t.subject && (
                <p className="text-xs text-slate-400 mb-2"><span className="text-slate-500 font-semibold">Subject:</span> {t.subject}</p>
              )}
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-4 whitespace-pre-wrap flex-1">{t.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* New Campaign Modal */}
      <Modal open={campModal} onClose={() => setCampModal(false)} title="Create a campaign">
        <form onSubmit={createCampaign} className="space-y-4">
          <Field label="Campaign name" required>
            <input required value={campForm.name} onChange={(e) => setCampForm({ ...campForm, name: e.target.value })} className={inputClass} placeholder="Summer Newsletter 2026" />
          </Field>
          <Field label="Template" required>
            <select required value={campForm.template_id} onChange={(e) => setCampForm({ ...campForm, template_id: e.target.value })} className={inputClass}>
              <option value="">Select a template...</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
            </select>
          </Field>
          <Field label="Schedule (optional)">
            <input type="datetime-local" value={campForm.scheduled_at} onChange={(e) => setCampForm({ ...campForm, scheduled_at: e.target.value })} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setCampModal(false)}>Cancel</Button>
            <Button type="submit">Create campaign</Button>
          </div>
        </form>
      </Modal>

      {/* Template Modal */}
      <Modal open={tplModal} onClose={() => setTplModal(false)} title={editingTpl ? 'Edit template' : 'Create template'}>
        <form onSubmit={saveTemplate} className="space-y-4">
          <Field label="Template name" required>
            <input required value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} className={inputClass} placeholder="WhatsApp Demo Invite" />
          </Field>
          <Field label="Type" required>
            <select value={tplForm.type} onChange={(e) => setTplForm({ ...tplForm, type: e.target.value })} className={inputClass}>
              {['email', 'whatsapp', 'sms'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          {tplForm.type === 'email' && (
            <Field label="Subject">
              <input value={tplForm.subject} onChange={(e) => setTplForm({ ...tplForm, subject: e.target.value })} className={inputClass} placeholder="Welcome, {{first_name}}!" />
            </Field>
          )}
          <Field label="Body" required>
            <textarea
              required
              rows={6}
              value={tplForm.body}
              onChange={(e) => setTplForm({ ...tplForm, body: e.target.value })}
              className={`${inputClass} resize-y font-mono`}
              placeholder="Hi {{first_name}},&#10;&#10;Thanks for reaching out..."
            />
          </Field>
          <p className="text-xs text-slate-500">You can use placeholders: <code className="text-indigo-400">{"{{first_name}}"}</code>, <code className="text-indigo-400">{"{{meeting_link}}"}</code></p>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setTplModal(false)}>Cancel</Button>
            <Button type="submit" disabled={savingTpl}>
              {savingTpl && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingTpl ? 'Save changes' : 'Create template'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
