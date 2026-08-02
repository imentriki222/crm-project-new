import { X } from 'lucide-react'

/** Small shared UI building blocks used across all pages. */

export function Spinner({ className = 'h-6 w-6' }) {
  return (
    <div className="flex items-center justify-center py-10">
      <div
        className={`${className} rounded-full border-2 border-slate-700 border-t-indigo-500 animate-spin`}
      />
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 border border-transparent',
    danger:
      'bg-red-600/15 hover:bg-red-600/25 text-red-400 border border-red-900/40',
  }
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto rounded-2xl glass-card p-6 text-slate-200 shadow-2xl`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white font-heading">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children, required = false }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl bg-slate-900/70 border border-slate-700/70 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all'

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-heading tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="p-4 rounded-2xl bg-slate-800/60 mb-4">
          <Icon className="h-8 w-8 text-slate-500" />
        </div>
      )}
      <h3 className="text-white font-semibold">{title}</h3>
      {message && <p className="text-sm text-slate-400 mt-1 max-w-sm">{message}</p>}
    </div>
  )
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="mb-5 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300 flex items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-red-300 underline underline-offset-2 hover:text-red-200 cursor-pointer shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export function Toast({ toast, onClose }) {
  if (!toast) return null
  const ok = toast.type === 'success'
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 rounded-xl glass-card px-4 py-3 shadow-2xl animate-[slideIn_.25s_ease-out]">
      <span
        className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'}`}
      />
      <span className="text-sm text-slate-100">{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-white cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
