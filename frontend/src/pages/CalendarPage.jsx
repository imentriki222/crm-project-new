import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2, Video, CalendarDays, MapPin } from 'lucide-react';
import api from '../api/client';
import { PageHeader, Button, Spinner, ErrorBanner, EmptyState, Modal, Field, inputClass, Toast } from '../components/ui';
import { formatTime, fullName } from '../utils/format';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TYPE_META = {
  google_meet: { color: 'bg-sky-500/15 text-sky-300 border-sky-500/30', icon: Video },
  zoom: { color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', icon: Video },
  in_person: { color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', icon: MapPin },
};

const EMPTY_MEETING = { lead_id: '', title: '', description: '', start_time: '', end_time: '', type: 'google_meet' };

export default function CalendarPage() {
  const [meetings, setMeetings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_MEETING);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/meetings');
      setMeetings(res.data.data || []);
    } catch {
      setError('Could not load meetings.');
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

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday-first
    const gridStart = new Date(year, month, 1 - startOffset);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      cells.push(date);
    }
    return cells;
  }, [cursor]);

  const meetingsByDay = useMemo(() => {
    const map = {};
    meetings.forEach((m) => {
      const key = new Date(m.start_time).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return map;
  }, [meetings]);

  const monthLabel = cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const createMeeting = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/meetings', {
        lead_id: Number(form.lead_id),
        title: form.title,
        description: form.description,
        start_time: form.start_time,
        end_time: form.end_time,
        type: form.type,
      });
      setMeetings((prev) => [...prev, res.data.data]);
      setFormOpen(false);
      setForm(EMPTY_MEETING);
      notify('Meeting scheduled');
    } catch (err) {
      notify(err.response?.data?.message || 'Could not schedule meeting', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteMeeting = async (id) => {
    if (!window.confirm('Cancel this meeting?')) return;
    try {
      await api.delete(`/meetings/${id}`);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
      setSelected(null);
      notify('Meeting cancelled');
    } catch {
      notify('Could not cancel meeting', 'error');
    }
  };

  const dayMeetings = selected ? meetingsByDay[selected.toDateString()] || [] : [];

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <PageHeader
        title="Calendar"
        subtitle="Schedule meetings, demos and follow-ups with your leads."
        actions={<Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> New Meeting</Button>}
      />
      <ErrorBanner message={error} onRetry={load} />

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          {/* Month grid */}
          <div className="xl:col-span-3 glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-bold text-white font-heading">{monthLabel}</h3>
                <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <Button
                variant="secondary"
                className="!py-1.5 !text-xs"
                onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }}
              >
                Today
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-500 py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((date) => {
                const inMonth = date.getMonth() === cursor.getMonth();
                const today = date.toDateString() === new Date().toDateString();
                const list = meetingsByDay[date.toDateString()] || [];
                const isSelected = selected?.toDateString() === date.toDateString();
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelected(date)}
                    className={`min-h-[84px] rounded-xl border p-1.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500/60 bg-indigo-500/10'
                        : inMonth
                          ? 'border-slate-800 bg-slate-900/40 hover:border-slate-600'
                          : 'border-slate-800/50 bg-slate-900/20 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between px-1">
                      <span className={`text-xs font-semibold ${today ? 'text-white bg-indigo-600 rounded-full h-6 w-6 flex items-center justify-center' : inMonth ? 'text-slate-300' : 'text-slate-600'}`}>
                        {date.getDate()}
                      </span>
                      {list.length > 0 && <span className="text-[10px] text-indigo-300 font-bold">{list.length}</span>}
                    </div>
                    <div className="mt-1.5 space-y-1">
                      {list.slice(0, 2).map((m) => (
                        <div key={m.id} className={`rounded-md px-1.5 py-0.5 text-[9px] font-medium border truncate ${TYPE_META[m.type]?.color || ''}`}>
                          {formatTime(m.start_time)} {m.title}
                        </div>
                      ))}
                      {list.length > 2 && <p className="text-[9px] text-slate-500 px-1">+{list.length - 2} more</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day panel */}
          <div className="glass-card rounded-2xl p-5 h-fit">
            <h3 className="font-semibold text-white font-heading mb-1">
              {selected ? selected.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Select a day'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{dayMeetings.length} meeting{dayMeetings.length === 1 ? '' : 's'}</p>

            {!selected ? (
              <EmptyState icon={CalendarDays} title="No day selected" message="Click any day on the calendar to see its meetings." />
            ) : dayMeetings.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No meetings" message="Schedule a meeting for this day." />
            ) : (
              <ul className="space-y-3">
                {dayMeetings.map((m) => (
                  <li key={m.id} className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-white">{m.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{m.lead ? fullName(m.lead.first_name, m.lead.last_name) : 'Unknown lead'}</p>
                      </div>
                      <button onClick={() => deleteMeeting(m.id)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs">
                      <span className="text-slate-400">{formatTime(m.start_time)} – {formatTime(m.end_time)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${TYPE_META[m.type]?.color || ''}`}>
                        {m.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {m.meeting_link && (
                      <a href={m.meeting_link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                        <Video className="h-3.5 w-3.5" /> Join meeting
                      </a>
                    )}
                    {m.description && <p className="text-xs text-slate-500 mt-2">{m.description}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* New Meeting Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Schedule a meeting">
        <form onSubmit={createMeeting} className="space-y-4">
          <Field label="Lead" required>
            <select required value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })} className={inputClass}>
              <option value="">Select a lead...</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{fullName(l.first_name, l.last_name)}{l.company_name ? ` · ${l.company_name}` : ''}</option>
              ))}
            </select>
          </Field>
          <Field label="Title" required>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Product demo call" />
          </Field>
          <Field label="Description">
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-none`} placeholder="Agenda, notes..." />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start" required>
              <input required type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className={inputClass} />
            </Field>
            <Field label="End" required>
              <input required type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Type">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
              {['google_meet', 'zoom', 'in_person'].map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </Field>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
