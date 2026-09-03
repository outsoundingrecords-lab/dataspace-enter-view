import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell
} from 'recharts';
import {
  Clock,
  HardDrive,
  Filter,
  X,
  ExternalLink,
  Info,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { InventoryRow } from '../types';
import {
  calculateDateDistribution,
  AgeBracketId,
  AgeBucketDistribution,
  AGE_BRACKETS
} from '../utils/dateDistribution';
import { formatBytes } from '../utils';

interface ModificationDateChartProps {
  inventory: InventoryRow[];
  selectedAgeBracket: AgeBracketId | null;
  onSelectAgeBracket: (bracketId: AgeBracketId | null) => void;
  onNavigateToExplorer?: () => void;
}

export function ModificationDateChart({
  inventory,
  selectedAgeBracket,
  onSelectAgeBracket,
  onNavigateToExplorer,
}: ModificationDateChartProps) {
  // Metric toggle: 'count' (File Count) or 'size' (Aggregate Volume in MB)
  const [metric, setMetric] = useState<'count' | 'size'>('count');

  const { buckets, totalFiles, totalBytes, staleCount, staleBytes } = useMemo(() => {
    return calculateDateDistribution(inventory);
  }, [inventory]);

  // Chart data formatting
  const chartData = useMemo(() => {
    return buckets.map(b => ({
      id: b.id,
      name: b.shortLabel,
      fullLabel: b.label,
      sublabel: b.sublabel,
      count: b.fileCount,
      sizeMB: b.sizeMB,
      sizeFormatted: b.sizeFormatted,
      color: b.color,
      hoverColor: b.hoverColor,
      percentOfTotalCount: b.percentOfTotalCount,
      percentOfTotalSize: b.percentOfTotalSize,
      primaryFormats: b.primaryFormats,
    }));
  }, [buckets]);

  const activeBucket = useMemo(() => {
    if (!selectedAgeBracket) return null;
    return buckets.find(b => b.id === selectedAgeBracket) || null;
  }, [buckets, selectedAgeBracket]);

  const handleBarClick = (data: any) => {
    if (!data || !data.id) return;
    const clickedId = data.id as AgeBracketId;
    if (selectedAgeBracket === clickedId) {
      onSelectAgeBracket(null);
    } else {
      onSelectAgeBracket(clickedId);
    }
  };

  // Custom tooltip component showing file count, storage footprint, and primary file formats
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    if (!item) return null;

    return (
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-xl p-3.5 shadow-2xl max-w-xs text-xs z-50 animate-in fade-in-50">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-semibold text-zinc-100">{item.fullLabel}</span>
          </div>
          <span className="text-[11px] text-zinc-400">{item.sublabel}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
            <span className="text-[10px] uppercase text-zinc-500 block font-medium">File Count</span>
            <span className="text-zinc-200 font-bold text-sm">
              {item.count.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-400 ml-1">({item.percentOfTotalCount}%)</span>
          </div>
          <div className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
            <span className="text-[10px] uppercase text-zinc-500 block font-medium">Volume</span>
            <span className="text-zinc-200 font-bold text-sm">
              {item.sizeFormatted}
            </span>
            <span className="text-[10px] text-zinc-400 ml-1">({item.percentOfTotalSize}%)</span>
          </div>
        </div>

        {/* Primary File Formats */}
        <div>
          <span className="text-[10px] uppercase text-zinc-400 block font-semibold mb-1">
            Primary Formats
          </span>
          {item.primaryFormats && item.primaryFormats.length > 0 ? (
            <div className="space-y-1">
              {item.primaryFormats.map((fmt: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-indigo-300 font-medium">
                    {fmt.extension}
                  </span>
                  <span className="text-zinc-400">
                    {fmt.count.toLocaleString()} files ({fmt.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-zinc-500 italic">No files in this bucket</span>
          )}
        </div>

        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400 flex items-center justify-between">
          <span>Click bar to filter File Explorer</span>
          <span className="text-indigo-400 font-medium">⚡ Click</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              File Modification Date Distribution
            </h3>
            {staleCount > 0 && (
              <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {staleCount.toLocaleString()} stale files ({formatBytes(staleBytes)})
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Analyze file freshness to discover inactive libraries, stale assets, and candidate components for archiving.
          </p>
        </div>

        {/* Metric Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 flex text-xs">
            <button
              type="button"
              onClick={() => setMetric('count')}
              className={`px-3 py-1 rounded-md transition-colors font-medium ${
                metric === 'count'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              File Count
            </button>
            <button
              type="button"
              onClick={() => setMetric('size')}
              className={`px-3 py-1 rounded-md transition-colors font-medium ${
                metric === 'size'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Volume (MB)
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Bar (if user clicked a bar) */}
      {activeBucket && (
        <div className="mb-4 px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-400">Active Date Filter:</span>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium border"
              style={{
                backgroundColor: `${activeBucket.color}15`,
                borderColor: `${activeBucket.color}40`,
                color: activeBucket.color,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeBucket.color }} />
              {activeBucket.label}
              <span className="text-zinc-400 text-[11px]">({activeBucket.fileCount.toLocaleString()} files)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToExplorer && (
              <button
                type="button"
                onClick={onNavigateToExplorer}
                className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline"
              >
                <span>View in File Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectAgeBracket(null)}
              className="text-zinc-400 hover:text-zinc-200 p-1 rounded hover:bg-zinc-800"
              title="Clear date filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#71717a"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={metric === 'size'}
              tickFormatter={(val) => {
                if (metric === 'count') {
                  return val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val;
                }
                return val >= 1024 ? `${(val / 1024).toFixed(1)}GB` : `${val}MB`;
              }}
            />
            <RechartsTooltip
              content={<CustomTooltip />}
              cursor={{ fill: '#27272a33' }}
            />
            <Bar
              dataKey={metric === 'count' ? 'count' : 'sizeMB'}
              radius={[6, 6, 0, 0]}
              onClick={handleBarClick}
              className="cursor-pointer transition-all duration-200"
            >
              {chartData.map((entry) => {
                const isSelected = selectedAgeBracket === entry.id;
                const isDimmed = selectedAgeBracket !== null && !isSelected;
                return (
                  <Cell
                    key={`cell-${entry.id}`}
                    fill={entry.color}
                    opacity={isDimmed ? 0.35 : 1}
                    stroke={isSelected ? '#ffffff' : undefined}
                    strokeWidth={isSelected ? 2 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Legend with Clickable Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-4 border-t border-zinc-800/80">
        {buckets.map((b) => {
          const isSelected = selectedAgeBracket === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                if (selectedAgeBracket === b.id) onSelectAgeBracket(null);
                else onSelectAgeBracket(b.id);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-zinc-800 border-zinc-600 ring-1 ring-zinc-500 shadow-md'
                  : 'bg-zinc-950/40 border-zinc-800/60 hover:bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                <span className="text-[11px] font-medium text-zinc-300 truncate">{b.shortLabel}</span>
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-xs font-semibold text-zinc-100">
                  {metric === 'count' ? b.fileCount.toLocaleString() : b.sizeFormatted}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {metric === 'count' ? `${b.percentOfTotalCount}%` : `${b.percentOfTotalSize}%`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
