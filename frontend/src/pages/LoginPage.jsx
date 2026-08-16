import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, Mail, Lock, Loader2, ArrowRight, BarChart3, Users2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { inputClass, Button } from '../components/ui';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0b0f19]">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-transparent to-violet-900/30" />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl animate-pulse-slow" />

        <div className="relative flex items-center gap-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/40">
            <BrainCircuit className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-heading">LeadFlow CRM</h1>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-widest">CRM & Marketing Automation</span>
          </div>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-bold text-white font-heading leading-tight mb-4">
            Generate, qualify & convert leads automatically.
          </h2>
          <p className="text-slate-400 text-lg max-w-md">
            Centralize contacts, score prospects with AI, trigger multi-channel marketing campaigns and track your sales performance in real time.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { icon: Users2, label: 'Lead scoring' },
              { icon: Zap, label: 'Automations' },
              { icon: BarChart3, label: 'Live analytics' },
            ].map((f) => (
              <div key={f.label} className="glass-card rounded-2xl p-4">
                <f.icon className="h-6 w-6 text-indigo-400 mb-2" />
                <p className="text-sm font-medium text-slate-200">{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-500">© 2026LeadFlow CRM CRM. Powered by Laravel + React.</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-white font-heading">LeadFlow CRM CRM</h1>
          </div>

          <h2 className="text-3xl font-bold text-white font-heading mb-2">Welcome back</h2>
          <p className="text-slate-400 mb-8">Sign in to access your sales workspace.</p>

          {error && (
            <div className="mb-5 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`${inputClass} pl-10`}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`${inputClass} pl-10`}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full py-3">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              Create one
            </Link>
          </p>

          <div className="mt-8 rounded-xl glass-card p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1.5">Demo accounts</p>
            <p>admin@crm.com / manager@crm.com / commercial@crm.com</p>
            <p className="text-slate-500">Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
