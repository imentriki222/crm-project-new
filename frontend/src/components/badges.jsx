/* eslint-disable react-refresh/only-export-components */
/** Color-coded status / priority / score badges. */

const STATUS_STYLES = {
  new: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  contacted: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  qualified: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  proposal: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  negotiation: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  won: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  lost: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

const PRIORITY_STYLES = {
  low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

export function StatusBadge({ status, label }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.new
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {label || status}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {priority || 'medium'}
    </span>
  )
}

export function ScoreBadge({ score }) {
  const num = Number(score || 0)
  const color =
    num >= 70 ? 'text-emerald-400' : num >= 30 ? 'text-amber-400' : 'text-slate-400'
  const bg =
    num >= 70 ? 'bg-emerald-500/10' : num >= 30 ? 'bg-amber-500/10' : 'bg-slate-500/10'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${color} ${bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${num >= 70 ? 'bg-emerald-400' : num >= 30 ? 'bg-amber-400' : 'bg-slate-500'}`} />
      {num}
    </span>
  )
}

const STAGE_STYLES = {
  new_lead: 'border-sky-500/30 text-sky-300 bg-sky-500/10',
  contacted: 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10',
  meeting_scheduled: 'border-violet-500/30 text-violet-300 bg-violet-500/10',
  proposal_sent: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
  negotiation: 'border-orange-500/30 text-orange-300 bg-orange-500/10',
  won: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
  lost: 'border-rose-500/30 text-rose-300 bg-rose-500/10',
}

export function StageBadge({ stage }) {
  const style = STAGE_STYLES[stage] || STAGE_STYLES.new_lead
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide border ${style}`}>
      {stage.replace(/_/g, ' ')}
    </span>
  )
}

export const CAMPAIGN_STATUS_STYLES = {
  draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  scheduled: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  sending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

export function CampaignStatusBadge({ status }) {
  const style = CAMPAIGN_STATUS_STYLES[status] || CAMPAIGN_STATUS_STYLES.draft
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${style}`}>
      {status}
    </span>
  )
}
