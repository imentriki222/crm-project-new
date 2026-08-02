import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal, Field, inputClass, Button } from '../../components/ui';

const EMPTY = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  whatsapp: '',
  company_name: '',
  job_title: '',
  website: '',
  industry: '',
  company_size: '1-10',
  city: '',
  country: '',
  lead_source: 'organic',
  status: 'new',
  priority: 'medium',
  assigned_to: '',
};

export default function LeadFormModal({ open, onClose, onSubmit, lead, users = [] }) {
  const [form, setForm] = useState(lead ? { ...EMPTY, ...lead } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      payload.assigned_to = payload.assigned_to === '' ? null : Number(payload.assigned_to);
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const data = err.response?.data;
      const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null;
      setError(firstError || data?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={lead ? 'Edit Lead' : 'New Lead'} wide>
      {error && (
        <div className="mb-4 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">Personal information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First name" required>
              <input required value={form.first_name} onChange={set('first_name')} className={inputClass} placeholder="Jane" />
            </Field>
            <Field label="Last name" required>
              <input required value={form.last_name} onChange={set('last_name')} className={inputClass} placeholder="Doe" />
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={set('email')} className={inputClass} placeholder="jane@company.com" />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={set('phone')} className={inputClass} placeholder="+216 12 345 678" />
            </Field>
            <Field label="WhatsApp">
              <input value={form.whatsapp} onChange={set('whatsapp')} className={inputClass} placeholder="+216 12 345 678" />
            </Field>
            <Field label="Website">
              <input value={form.website} onChange={set('website')} className={inputClass} placeholder="www.company.com" />
            </Field>
          </div>
        </div>

        {/* Company */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">Company</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company name">
              <input value={form.company_name} onChange={set('company_name')} className={inputClass} placeholder="Company Inc." />
            </Field>
            <Field label="Job title">
              <input value={form.job_title} onChange={set('job_title')} className={inputClass} placeholder="CEO / Founder / Manager" />
            </Field>
            <Field label="Industry">
              <input value={form.industry} onChange={set('industry')} className={inputClass} placeholder="Technology" />
            </Field>
            <Field label="Company size">
              <select value={form.company_size} onChange={set('company_size')} className={inputClass}>
                {['1-10', '11-50', '51-200', '201-500', '500+'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="City">
              <input value={form.city} onChange={set('city')} className={inputClass} placeholder="Tunis" />
            </Field>
            <Field label="Country">
              <input value={form.country} onChange={set('country')} className={inputClass} placeholder="Tunisia" />
            </Field>
          </div>
        </div>

        {/* CRM */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-3">CRM details</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Lead source">
              <select value={form.lead_source} onChange={set('lead_source')} className={inputClass}>
                {['organic', 'google_ads', 'social_media', 'referral', 'cold_call', 'facebook_ads', 'website', 'other'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={set('status')} className={inputClass}>
                {['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={set('priority')} className={inputClass}>
                {['low', 'medium', 'high'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Assigned to">
              <select value={form.assigned_to ?? ''} onChange={set('assigned_to')} className={inputClass}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {lead ? 'Save changes' : 'Create lead'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
