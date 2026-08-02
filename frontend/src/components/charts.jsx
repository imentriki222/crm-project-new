/* eslint-disable react-refresh/only-export-components */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

const gridColor = 'rgba(148, 163, 184, 0.08)';
const tickColor = '#94a3b8';

export const axisDefaults = {
  grid: { color: gridColor },
  ticks: { color: tickColor },
  border: { color: gridColor },
};

const tooltipStyle = {
  backgroundColor: '#0f172a',
  borderColor: 'rgba(99, 102, 241, 0.4)',
  borderWidth: 1,
  titleColor: '#f1f5f9',
  bodyColor: '#cbd5e1',
  padding: 12,
  cornerRadius: 10,
};

export function ChartCard({ title, subtitle, children }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="font-semibold text-white font-heading">{title}</h3>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5 mb-4">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function LeadsGrowthChart({ data }) {
  const labels = Object.keys(data || {});
  const values = Object.values(data || {});
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Leads',
        data: values,
        backgroundColor: 'rgba(99, 102, 241, 0.65)',
        hoverBackgroundColor: 'rgba(129, 140, 248, 0.9)',
        borderRadius: 8,
        maxBarThickness: 42,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: tooltipStyle },
    scales: {
      x: { ...axisDefaults, grid: { display: false } },
      y: { ...axisDefaults, beginAtZero: true },
    },
  };
  return <Bar data={chartData} options={options} height={90} />;
}

export function SalesPerformanceChart({ data }) {
  const labels = Object.keys(data || {});
  const counts = Object.values(data || {}).map((s) => s?.count || 0);
  const chartData = {
    labels: labels.map((l) => l.replace(/_/g, ' ')),
    datasets: [
      {
        label: 'Deals',
        data: counts,
        backgroundColor: [
          '#38bdf8', '#818cf8', '#a78bfa', '#fbbf24', '#fb923c', '#34d399', '#fb7185',
        ],
        borderRadius: 6,
        maxBarThickness: 30,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: tooltipStyle,
    },
    scales: {
      x: { ...axisDefaults, grid: { display: false } },
      y: { ...axisDefaults, beginAtZero: true },
    },
  };
  return <Bar data={chartData} options={options} height={90} />;
}

export function CampaignStatsChart({ data }) {
  const stats = data || {};
  const chartData = {
    labels: ['Sent', 'Delivered', 'Opened', 'Clicked'],
    datasets: [
      {
        data: [
          stats.sent || 0,
          stats.delivered || 0,
          stats.opened || 0,
          stats.clicked || 0,
        ],
        backgroundColor: ['#6366f1', '#38bdf8', '#a78bfa', '#34d399'],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };
  const options = {
    responsive: true,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', boxWidth: 10, padding: 14, usePointStyle: true },
      },
      tooltip: tooltipStyle,
    },
  };
  return (
    <div className="max-w-[260px] mx-auto">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
