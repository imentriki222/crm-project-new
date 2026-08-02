import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, Loader2, Copy, Check, MessageSquareText, Mail, Reply, Target } from 'lucide-react';
import api from '../api/client';
import { PageHeader, Button, Field, inputClass, Toast } from '../components/ui';
import { fullName } from '../utils/format';

const TABS = [
  { key: 'chat', label: 'Sales Assistant', icon: MessageSquareText },
  { key: 'email', label: 'Email Writer', icon: Mail },
  { key: 'reply', label: 'Reply Suggester', icon: Reply },
  { key: 'qualify', label: 'Lead Qualifier', icon: Target },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <button onClick={copy} className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export default function AssistantPage() {
  const [tab, setTab] = useState('chat');
  const [leads, setLeads] = useState([]);
  const [toast, setToast] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! I'm your AI Sales Assistant. Ask me about lead strategies, pitches or negotiation — or select a lead for context." },
  ]);
  const [chatLead, setChatLead] = useState('');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const chatEndRef = useRef(null);

  // Email state
  const [emailForm, setEmailForm] = useState({ lead_id: '', tone: 'professional', objective: '' });
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailOut, setEmailOut] = useState(null);

  // Reply state
  const [history, setHistory] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);
  const [suggestions, setSuggestions] = useState('');

  // Qualify state
  const [qualifyLead, setQualifyLead] = useState('');
  const [qualifyBusy, setQualifyBusy] = useState(false);
  const [qualifyOut, setQualifyOut] = useState('');

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    api.get('/leads', { params: { per_page: 100 } })
      .then((res) => setLeads(res.data.data || []))
      .catch(() => {});
  }, []);

  const sendChat = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || busy) return;
    const userMsg = { role: 'user', text: prompt };
    setMessages((m) => [...m, userMsg]);
    setPrompt('');
    setBusy(true);
    try {
      const res = await api.post('/ai/assistant', {
        prompt: userMsg.text,
        lead_id: chatLead ? Number(chatLead) : undefined,
      });
      setMessages((m) => [...m, { role: 'ai', text: res.data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'ai', text: 'Sorry, the assistant could not respond. Please try again.' }]);
    } finally {
      setBusy(false);
    }
  };

  const generateEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.lead_id || !emailForm.objective) return;
    setEmailBusy(true);
    setEmailOut(null);
    try {
      const res = await api.post('/ai/generate-email', emailForm);
      setEmailOut(res.data);
    } catch {
      setToast({ type: 'error', message: 'Could not generate email' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setEmailBusy(false);
    }
  };

  const suggestReply = async (e) => {
    e.preventDefault();
    if (!history.trim() || replyBusy) return;
    setReplyBusy(true);
    try {
      const res = await api.post('/ai/suggest-reply', { message_history: history });
      setSuggestions(res.data.suggestions);
    } catch {
      setToast({ type: 'error', message: 'Could not generate suggestions' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setReplyBusy(false);
    }
  };

  const qualify = async (e) => {
    e.preventDefault();
    if (!qualifyLead) return;
    setQualifyBusy(true);
    setQualifyOut('');
    try {
      const res = await api.post(`/ai/qualify-lead/${qualifyLead}`);
      setQualifyOut(res.data.analysis);
    } catch {
      setToast({ type: 'error', message: 'Could not run qualification' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setQualifyBusy(false);
    }
  };

  return (
    <div>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <PageHeader
        title="AI Assistant"
        subtitle="Leverage AI to write emails, suggest replies, qualify leads and get sales advice."
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 glass-card rounded-2xl p-1.5 w-fit">
        {TABS.map((t) => (
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

      {tab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div className="lg:col-span-3 glass-card rounded-2xl flex flex-col h-[560px]">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-slate-900/70 border border-slate-800 text-slate-200 rounded-bl-md'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    <span className="text-sm text-slate-400">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChat} className="p-4 border-t border-slate-800 flex gap-3">
              <select value={chatLead} onChange={(e) => setChatLead(e.target.value)} className={`${inputClass} !w-52 shrink-0 hidden sm:block`}>
                <option value="">No lead context</option>
                {leads.map((l) => <option key={l.id} value={l.id}>{fullName(l.first_name, l.last_name)}</option>)}
              </select>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask about a strategy, pitch, or next steps..."
                className={inputClass}
              />
              <Button type="submit" disabled={!prompt.trim() || busy} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>

          <div className="glass-card rounded-2xl p-5 h-fit">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h3 className="font-semibold text-white">Try asking</h3>
            </div>
            <ul className="space-y-2 text-sm">
              {[
                'Suggest a sales strategy for this lead',
                'What is the best time to follow up?',
                'How should I handle objections?',
                'Draft a negotiation approach for a 20k DT deal',
              ].map((q) => (
                <li key={q}>
                  <button
                    onClick={() => setPrompt(q)}
                    className="text-left w-full rounded-xl bg-slate-900/50 border border-slate-800 px-3 py-2.5 text-xs text-slate-300 hover:border-indigo-500/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'email' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Generate a personalized email</h3>
            <form onSubmit={generateEmail} className="space-y-4">
              <Field label="Lead" required>
                <select required value={emailForm.lead_id} onChange={(e) => setEmailForm({ ...emailForm, lead_id: e.target.value })} className={inputClass}>
                  <option value="">Select a lead...</option>
                  {leads.map((l) => <option key={l.id} value={l.id}>{fullName(l.first_name, l.last_name)}</option>)}
                </select>
              </Field>
              <Field label="Tone">
                <select value={emailForm.tone} onChange={(e) => setEmailForm({ ...emailForm, tone: e.target.value })} className={inputClass}>
                  {['professional', 'friendly', 'urgent', 'formal'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Objective" required>
                <input required value={emailForm.objective} onChange={(e) => setEmailForm({ ...emailForm, objective: e.target.value })} className={inputClass} placeholder="Book a demo / Follow up on proposal" />
              </Field>
              <Button type="submit" disabled={emailBusy || !emailForm.lead_id || !emailForm.objective}>
                {emailBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate email
              </Button>
            </form>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Generated email</h3>
            {emailOut ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Subject</p>
                    <CopyButton text={emailOut.subject} />
                  </div>
                  <p className="text-sm text-white font-medium">{emailOut.subject}</p>
                </div>
                <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Body</p>
                    <CopyButton text={emailOut.body} />
                  </div>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{emailOut.body}</pre>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-10 text-center">Your AI-written email will appear here.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'reply' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Customer message history</h3>
            <form onSubmit={suggestReply} className="space-y-4">
              <textarea
                required
                rows={8}
                value={history}
                onChange={(e) => setHistory(e.target.value)}
                className={`${inputClass} resize-y`}
                placeholder={'Customer: "Do you support n8n integration?"\nCustomer: "What are your prices?"'}
              />
              <Button type="submit" disabled={replyBusy || !history.trim()}>
                {replyBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Suggest replies
              </Button>
            </form>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Suggested replies</h3>
            {suggestions ? (
              <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{suggestions}</pre>
            ) : (
              <p className="text-sm text-slate-500 py-10 text-center">Three reply options will appear here.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'qualify' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Qualify a lead</h3>
            <form onSubmit={qualify} className="space-y-4">
              <Field label="Lead" required>
                <select required value={qualifyLead} onChange={(e) => setQualifyLead(e.target.value)} className={inputClass}>
                  <option value="">Select a lead...</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {fullName(l.first_name, l.last_name)} · {l.company_name || 'No company'} · Score {l.lead_score}
                    </option>
                  ))}
                </select>
              </Field>
              <Button type="submit" disabled={qualifyBusy || !qualifyLead}>
                {qualifyBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                Run analysis
              </Button>
            </form>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Analysis</h3>
            {qualifyOut ? (
              <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[480px] overflow-y-auto">{qualifyOut}</pre>
            ) : (
              <p className="text-sm text-slate-500 py-10 text-center">Qualification status, pain points and next steps will appear here.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
