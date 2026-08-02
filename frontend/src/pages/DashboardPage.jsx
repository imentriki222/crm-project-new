import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Flame,
  Percent,
  Wallet,
  Activity,
  ArrowUpRight,
  TrendingUp,
  MailOpen,
  MousePointerClick,
  CalendarDays,
} from 'lucide-react';
import api from '../api/client';
import { Spinner, ErrorBanner } from '../components/ui';
import { LeadsGrowthChart, SalesPerformanceChart, CampaignStatsChart, ChartCard } from '../components/charts';

function StatCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
      <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full ${accent} blur-2xl opacity-40 group-hover:opacity-60 transition-opacity`} />
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${accent} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-600" />
      </div>
      <p className="text-3xl font-bold text-white font-heading">{value}</p>
      <p className="text-sm text-slate-400 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-2">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, chartsRes, actRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/charts'),
        api.get('/dashboard/activities'),
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
      setActivities(actRes.data.data || []);
    } catch {
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <ErrorBanner message={error} onRetry={load} />

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time overview of your sales performance.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Live metrics
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard icon={Users} label="Total Leads" value={stats?.total_leads ?? 0} accent="bg-indigo-600" />
        <StatCard icon={Flame} label="Hot Leads" value={stats?.hot_leads ?? 0} accent="bg-orange-600" sub={`${stats?.cold_leads ?? 0} cold leads`} />
        <StatCard icon={Percent} label="Conversion Rate" value={`${stats?.conversion_rate ?? 0}%`} accent="bg-violet-600" />
        <StatCard icon={Wallet} label="Revenue (Won Deals)" value={Number(stats?.revenue ?? 0).toLocaleString() + ' DT'} accent="bg-emerald-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="xl:col-span-2">
          <ChartCard title="Sales Performance by Stage" subtitle="Number of deals in each pipeline stage">
            <SalesPerformanceChart data={charts?.sales_performance} />
          </ChartCard>
        </div>
        <ChartCard title="Campaign Engagement" subtitle="Aggregated stats across all campaigns">
          <CampaignStatsChart data={charts?.campaigns} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <ChartCard title="Leads Growth" subtitle="Monthly new leads">
            <LeadsGrowthChart data={charts?.leads_growth} />
          </ChartCard>
        </div>

        {/* Activity feed */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400" />
              <h3 className="font-semibold text-white font-heading">Recent Activity</h3>
            </div>
            <Link to="/leads" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
              View leads →
            </Link>
          </div>

          {activities.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No activity yet.</p>
          ) : (
            <ul className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {activities.map((act) => (
                <li key={act.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 leading-snug">
                      <span className="font-medium capitalize">{act.action.replace(/_/g, ' ')}</span>
                      <span className="text-slate-400"> · {act.lead_name}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {act.user_name} · {act.created_at}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: MailOpen, label: 'Campaigns', value: charts?.campaigns?.sent ?? 0 },
              { icon: MousePointerClick, label: 'Clicks', value: charts?.campaigns?.clicked ?? 0 },
              { icon: CalendarDays, label: 'Opens', value: charts?.campaigns?.opened ?? 0 },
            ].map((m) => (
              <div key={m.label} className="rounded-xl bg-slate-900/50 border border-slate-800 p-3">
                <m.icon className="h-4 w-4 text-indigo-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-white">{m.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
