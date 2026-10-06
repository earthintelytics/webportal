import { Line, Bar } from 'react-chartjs-2';
import { CHART_DEFAULTS } from '../constants/chartConfig';
import { SERIES } from './chartCatalog';

const noLegend = { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } } };
const CLASS_COLOUR = { best: '#3F8432', middle: '#D97706', worst: '#DC2626' };

const ChartCard = ({ title, text, empty, children }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-3">
    <div>
      <h3 className="font-display text-base font-semibold text-gray-900">{title}</h3>
      {text && <p className="text-sm text-gray-500 mt-1">{text}</p>}
    </div>
    <div className="h-[260px] relative">
      {empty ? <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 text-center px-6">{empty}</div> : children}
    </div>
  </div>
);

/**
 * The charts chosen for this crop or service (chartCatalog.js), drawn from
 * real readings only.
 *   trends   { ndvi: [{ label, date, mean }], ... }   farm averages, 6 months
 *   plots    latest value per block: valueOf(plot, key); classify(plot, key) → { label, rank }
 */
const OverviewCharts = ({ charts, trends, plots, classify, valueOf, primaryKey, unitLabel = 'blocks' }) => {
  if (!charts.length) return null;
  const unit = unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1);

  const render = (c) => {
    if (c.id.startsWith('trend:')) {
      const def = SERIES[c.index];
      const series = trends[c.index] || [];
      const data = {
        labels: series.map((p) => p.label || p.date),
        datasets: [{ label: c.title || def.title, data: series.map((p) => p.mean), borderColor: def.colour, backgroundColor: `${def.colour}14`, fill: true, tension: 0.35, pointRadius: 3, pointBackgroundColor: def.colour }],
      };
      const opts = { ...noLegend, scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, suggestedMin: def.range[0], suggestedMax: def.range[1] } } };
      return (
        <ChartCard key={c.id} title={c.title || def.title} text={c.text || def.text} empty={series.length ? null : 'No readings in the last 6 months yet. They appear after the next monitoring run.'}>
          <Line data={data} options={opts} />
        </ChartCard>
      );
    }

    const key = primaryKey;
    const rows = key ? plots.map((p) => ({ p, v: valueOf(p, key), cls: classify(p, key) })).filter((r) => r.v != null && !Number.isNaN(Number(r.v))) : [];

    if (c.id === 'classes') {
      const buckets = new Map();
      rows.forEach((r) => { if (r.cls) { const b = buckets.get(r.cls.label) || { n: 0, rank: r.cls.rank }; b.n += 1; buckets.set(r.cls.label, b); } });
      const entries = [...buckets.entries()].sort((a, b) => ['best', 'middle', 'worst'].indexOf(a[1].rank) - ['best', 'middle', 'worst'].indexOf(b[1].rank));
      const data = { labels: entries.map(([l]) => l), datasets: [{ data: entries.map(([, b]) => b.n), backgroundColor: entries.map(([, b]) => CLASS_COLOUR[b.rank]), borderRadius: 6 }] };
      return (
        <ChartCard key={c.id} title={c.title || `${unit} by condition`} text={c.text || `How many ${unitLabel} sit in each class on the map today.`} empty={entries.length ? null : `No ${unitLabel} have a reading yet.`}>
          <Bar data={data} options={{ ...noLegend, scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, ticks: { precision: 0 } } } }} />
        </ChartCard>
      );
    }

    if (c.id === 'weakest') {
      const worst = [...rows].sort((a, b) => a.v - b.v).slice(0, 10);
      const data = { labels: worst.map((r) => r.p.name || r.p.id), datasets: [{ data: worst.map((r) => r.v), backgroundColor: worst.map((r) => CLASS_COLOUR[r.cls?.rank] || '#9CA3AF'), borderRadius: 4 }] };
      return (
        <ChartCard key={c.id} title={c.title || `Weakest ${unitLabel}`} text={c.text || `The ${unitLabel} with the lowest reading today. Start inspections here.`} empty={worst.length ? null : `No ${unitLabel} have a reading yet.`}>
          <Bar data={data} options={{ ...noLegend, indexAxis: 'y' }} />
        </ChartCard>
      );
    }
    return null;
  };

  return <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">{charts.map(render)}</div>;
};

export default OverviewCharts;
