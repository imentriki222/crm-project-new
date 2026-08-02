import { useEffect, useState } from 'react';
import { Mail, Phone, MessageCircle, Globe, Building2, Briefcase, MapPin, Loader2, Sparkles } from 'lucide-react';
import api from '../../api/client';
import { Modal, Button, Spinner } from '../../components/ui';
import { StatusBadge, PriorityBadge, ScoreBadge, StageBadge } from '../../components/badges';
import { initials, fullName, formatDate, timeAgo, formatMoney, triggerLabel } from '../../utils/format';

export default function LeadDetailModal({ open, onClose, leadId, onUpdated }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!open || !leadId) return;
    setLoading(true);
    setAnalysis('');
    api.get(`/leads/${leadId}`)
      .then((res) => setLead(res.data.data))
      .catch(() => setLead(null))
      .finally(() => setLoading(false));
  }, [open, leadId]);

  const qualify = async () => {
    setAnalyzing(true);
    setAnalysis('');
    try {
      const res = await api.post(`/ai/qualify-lead/${leadId}`);
      setAnalysis(res.data.analysis);
    } catch {
      setAnalysis('Qualification failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const infoRows = [
    { icon: Mail, label: 'Email', value: lead?.email },
    { icon: Phone, label: 'Phone', value: lead?.phone },
    { icon: MessageCircle, label: 'WhatsApp', value: lead?.whatsapp },
    { icon: Globe, label: 'Website', value: lead?.website },
    { icon: Building2, label: 'Company', value: lead?.company_name },
    { icon: Briefcase, label: 'Job title', value: lead?.job_title },
    { icon: MapPin, label: 'Location', value: [lead?.city, lead?.country].filter(Boolean).join(', ') },
  ].filter((r) => r.value);

  return (
    <Modal open={open} onClose={onClose} title="Lead details" wide>
      {loading || !lead ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-lg font-bold">
                {initials(lead.first_name, lead.last_name)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-heading">{fullName(lead.first_name, lead.last_name)}</h3>
                <p className="text-sm text-slate-400">{lead.job_title || 'No title'} {lead.company_name && `at ${lead.company_name}`}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <StatusBadge status={lead.status} />
                  <PriorityBadge priority={lead.priority} />
                  <ScoreBadge score={lead.lead_score} />
                  <span className="text-xs text-slate-500">Source: {lead.lead_source}</span>
                </div>
              </div>
            </div>
            <Button variant="secondary" onClick={onUpdated}>
              Edit
            </Button>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {infoRows.map((r) => (
              <div key={r.label} className="flex items-center gap-3 rounded-xl bg-slate-900/50 border border-slate-800 px-4 py-3">
                <r.icon className="h-4 w-4 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">{r.label}</p>
                  <p className="text-sm text-slate-200 truncate">{r.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* AI qualification */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 to-violet-950/30 border border-indigo-800/30 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <h4 className="font-semibold text-white">AI Lead Qualification</h4>
              </div>
              <Button variant="secondary" onClick={qualify} disabled={analyzing} className="!py-1.5 !text-xs">
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Analyze
              </Button>
            </div>
            {analysis ? (
              <pre className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed max-h-64 overflow-y-auto">{analysis}</pre>
            ) : (
              <p className="text-sm text-slate-500">Run an AI analysis to qualify this lead, discover pain points and get recommended next steps.</p>
            )}
          </div>

          {/* Deals */}
          {lead.deals?.length > 0 && (
            <div>
              <h4 className="font-semibold text-white mb-3">Deals</h4>
              <div className="space-y-2">
                {lead.deals.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl bg-slate-900/50 border border-slate-800 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{d.name}</p>
                      <p className="text-xs text-slate-500">{formatMoney(d.value)}</p>
                    </div>
                    <StageBadge stage={d.stage} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meetings */}
          {lead.meetings?.length > 0 && (
            <div>
              <h4 className="font-semibold text-white mb-3">Meetings</h4>
              <div className="space-y-2">
                {lead.meetings.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl bg-slate-900/50 border border-slate-800 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{m.title}</p>
                      <p className="text-xs text-slate-500">{formatDate(m.start_time)} · {m.type.replace(/_/g, ' ')}</p>
                    </div>
                    {m.meeting_link && (
                      <a href={m.meeting_link} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300">Join →</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity log */}
          {lead.activity_logs?.length > 0 && (
            <div>
              <h4 className="font-semibold text-white mb-3">Activity history</h4>
              <ul className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {lead.activity_logs.map((log) => (
                  <li key={log.id} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                    <div>
                      <p className="text-sm text-slate-200 capitalize">{triggerLabel(log.action)}</p>
                      {log.details && typeof log.details === 'object' && (
                        <p className="text-xs text-slate-500">{JSON.stringify(log.details)}</p>
                      )}
                      <p className="text-[11px] text-slate-600">{timeAgo(log.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
