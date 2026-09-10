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
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
  Layers,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  Info,
  Filter,
  X,
  AlertCircle,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { InventoryRow } from '../types';
import {
  analyzeHashCollisions,
  CollisionBucket,
  CollisionClusterItem
} from '../utils/collisionAnalysis';
import { formatBytes } from '../utils';

interface HashCollisionChartProps {
  inventory: InventoryRow[];
  selectedHash?: string | null;
  onSelectHash?: (hash: string | null) => void;
  onNavigateToDuplicates?: () => void;
  onNavigateToExplorer?: () => void;
  onApplyFilter?: (searchTerm: string) => void;
}

export function HashCollisionChart({
  inventory,
  selectedHash,
  onSelectHash,
  onNavigateToDuplicates,
  onNavigateToExplorer,
  onApplyFilter
}: HashCollisionChartProps) {
  // Mode: 'distribution' (Histogram by collision multiplicity: 2x, 3x, 4x, etc.)
  //       'top-hashes' (Bar chart of specific top SHA-256 hashes by copy count)
  const [viewMode, setViewMode] = useState<'distribution' | 'top-hashes'>('distribution');
  
  // Distribution metric: 'clusters' (distinct hashes), 'files' (total copies), or 'wasted' (bytes)
  const [metric, setMetric] = useState<'clusters' | 'files' | 'wasted'>('clusters');
  
  // Selected bucket for drilldown
  const [activeBucketId, setActiveBucketId] = useState<string | null>(null);
  
  // Copied hash state
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const analysis = useMemo(() => {
    return analyzeHashCollisions(inventory);
  }, [inventory]);

  const handleCopy = (e: React.MouseEvent, hash: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filter out empty buckets for cleaner histogram rendering
  const activeBuckets = useMemo(() => {
    return analysis.buckets.filter(b => b.clusterCount > 0);
  }, [analysis.buckets]);

  // Distribution chart data
  const distributionChartData = useMemo(() => {
    return activeBuckets.map(b => ({
      id: b.id,
      name: b.label,
      shortLabel: b.shortLabel,
      clusters: b.clusterCount,
      files: b.fileCount,
      wasted: b.wastedBytes,
      wastedFormatted: formatBytes(b.wastedBytes),
      color: b.color,
      severity: b.severity,
      hashes: b.hashes
    }));
  }, [activeBuckets]);

  // Top hashes chart data
  const topHashesChartData = useMemo(() => {
    return analysis.topClusters.map(c => ({
      sha256: c.sha256,
      shortHash: c.shortHash,
      name: c.shortHash,
      copies: c.count,
      sizeBytes: c.size_bytes,
      formattedSize: c.formattedSize,
      wastedBytes: c.wastedBytes,
      formattedWasted: c.formattedWasted,
      sampleFile: c.fileNames[0] || 'Unknown',
      fileNames: c.fileNames,
      isZeroByte: c.isZeroByte,
      severity: c.severity,
      anomalyNote: c.anomalyNote
    }));
  }, [analysis.topClusters]);

  // Custom Tooltip for Distribution Bar Chart
  const DistributionTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    if (!item) return null;

    return (
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-xl p-3.5 shadow-2xl max-w-xs text-xs z-50 animate-in fade-in-50">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="font-semibold text-zinc-100">{item.name}</span>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {item.shortLabel}
          </span>
        </div>

        <div className="space-y-1.5 text-zinc-300">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Hash Collision Clusters:</span>
            <span className="font-semibold text-zinc-200">{item.clusters.toLocaleString()} distinct hashes</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Affected Files:</span>
            <span className="font-semibold text-indigo-400">{item.files.toLocaleString()} files</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Redundant Storage:</span>
            <span className="font-semibold text-rose-400">{item.wastedFormatted}</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 flex items-center gap-1">
          <Filter className="w-3 h-3 text-indigo-400" />
          <span>Click bar to inspect clusters in this collision depth</span>
        </div>
      </div>
    );
  };

  // Custom Tooltip for Top Hashes Bar Chart
  const TopHashesTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    if (!item) return null;

    return (
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-xl p-3.5 shadow-2xl max-w-sm text-xs z-50 animate-in fade-in-50">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-mono font-semibold text-zinc-100">{item.shortHash}</span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            item.isZeroByte
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : item.copies >= 10
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
          }`}>
            {item.copies} Identical Copies
          </span>
        </div>

        <div className="space-y-1.5 text-zinc-300">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Single Copy Size:</span>
            <span className="font-mono text-zinc-200">{item.formattedSize}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500">Wasted Storage:</span>
            <span className="font-mono font-semibold text-rose-400">{item.formattedWasted}</span>
          </div>
          {item.anomalyNote && (
            <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1.5 mt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{item.anomalyNote}</span>
            </div>
          )}
          <div className="pt-1.5">
            <span className="text-[10px] text-zinc-500 block mb-1">Sample Files:</span>
            <ul className="space-y-0.5 max-h-24 overflow-y-auto">
              {item.fileNames.map((fn: string, idx: number) => (
                <li key={idx} className="font-mono text-[11px] text-zinc-400 truncate flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-zinc-600" />
                  <span className="truncate">{fn}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-indigo-400" />
            Click bar to filter workspace by this hash
          </span>
        </div>
      </div>
    );
  };

  const anomalyIcon = () => {
    switch (analysis.anomalySummary.type) {
      case 'clean':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'moderate':
        return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
    }
  };

  const anomalyBadgeClass = () => {
    switch (analysis.anomalySummary.type) {
      case 'clean':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'moderate':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div id="hash-collision-section" className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
      {/* Background ambient glow based on anomaly status */}
      <div 
        className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${
          analysis.anomalySummary.type === 'clean' 
            ? 'bg-emerald-500' 
            : analysis.anomalySummary.type === 'critical' 
              ? 'bg-rose-500' 
              : analysis.anomalySummary.type === 'warning'
                ? 'bg-amber-500'
                : 'bg-indigo-500'
        }`}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Fingerprint className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-medium text-zinc-100">
              SHA-256 Hash Collision Frequency & Cluster Analysis
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1.5 font-medium ${anomalyBadgeClass()}`}>
              {anomalyIcon()}
              <span>{analysis.anomalySummary.title}</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Detects identical cryptographic digests across files to visualize duplication cluster depths, identify zero-byte corruption loops, and locate unexpected multi-copy anomalies.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800 flex items-center">
            <button
              onClick={() => setViewMode('distribution')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'distribution'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Collision Depth
            </button>
            <button
              onClick={() => setViewMode('top-hashes')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'top-hashes'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Top Hashes ({analysis.topClusters.length})
            </button>
          </div>

          {onNavigateToDuplicates && analysis.collisionHashCount > 0 && (
            <button
              onClick={onNavigateToDuplicates}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
              title="Jump to Duplicates Resolver"
            >
              <span>Inspect Duplicates</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 relative z-10">
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] mb-1">
            <span>Unique Digests</span>
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-semibold text-zinc-100">
            {analysis.uniqueHashCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500">
            {analysis.totalHashes > 0 
              ? `${Math.round((analysis.uniqueHashCount / analysis.totalHashes) * 100)}% collision-free` 
              : '0%'}
          </div>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] mb-1">
            <span>Collision Clusters</span>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-lg font-semibold text-indigo-400">
            {analysis.collisionHashCount.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500">
            {analysis.totalCollisionFiles.toLocaleString()} files affected
          </div>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] mb-1">
            <span>Max Collision Depth</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${analysis.maxCollisionDepth >= 10 ? 'text-rose-400' : 'text-amber-400'}`} />
          </div>
          <div className={`text-lg font-semibold ${analysis.maxCollisionDepth >= 10 ? 'text-rose-400' : 'text-zinc-100'}`}>
            {analysis.maxCollisionDepth > 1 ? `${analysis.maxCollisionDepth}x` : '1x'}
          </div>
          <div className="text-[10px] text-zinc-500">
            {analysis.maxCollisionDepth >= 10 ? 'Heavy cluster alert' : 'Normal distribution'}
          </div>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-zinc-500 text-[11px] mb-1">
            <span>Wasted Storage</span>
            <HardDrive className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-lg font-semibold text-rose-400">
            {analysis.formattedWastedBytes}
          </div>
          <div className="text-[10px] text-zinc-500">
            Redundant copies
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      {analysis.totalFiles === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
          <Fingerprint className="w-8 h-8 text-zinc-600 mb-2" />
          <span>No workspace inventory loaded yet.</span>
        </div>
      ) : analysis.collisionHashCount === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border border-emerald-500/20 bg-emerald-500/5 rounded-xl text-center px-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <h4 className="text-sm font-medium text-emerald-300 mb-1">
            Zero Cryptographic Collisions Detected
          </h4>
          <p className="text-xs text-zinc-400 max-w-md">
            All {analysis.totalFiles.toLocaleString()} files possess distinct SHA-256 digests. No exact binary duplication, zero-byte file spam, or repeated sync corruption was found.
          </p>
        </div>
      ) : viewMode === 'distribution' ? (
        <div>
          {/* Sub-controls for Distribution: Metric Toggle & Active Filter Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="text-zinc-500">Histogram Metric:</span>
              <div className="inline-flex rounded-md bg-zinc-950 p-0.5 border border-zinc-800">
                <button
                  onClick={() => setMetric('clusters')}
                  className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                    metric === 'clusters' ? 'bg-zinc-800 text-indigo-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Hash Clusters
                </button>
                <button
                  onClick={() => setMetric('files')}
                  className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                    metric === 'files' ? 'bg-zinc-800 text-indigo-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Affected Files
                </button>
                <button
                  onClick={() => setMetric('wasted')}
                  className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                    metric === 'wasted' ? 'bg-zinc-800 text-rose-400 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Wasted Volume
                </button>
              </div>
            </div>

            {activeBucketId && (
              <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs px-2.5 py-1 rounded-lg">
                <span>Filter: {analysis.buckets.find(b => b.id === activeBucketId)?.label}</span>
                <button
                  onClick={() => {
                    setActiveBucketId(null);
                    if (onSelectHash) onSelectHash(null);
                  }}
                  className="hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distributionChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const payload = e.activePayload[0].payload;
                    if (payload && payload.id) {
                      const nextId = activeBucketId === payload.id ? null : payload.id;
                      setActiveBucketId(nextId);
                      if (payload.hashes && payload.hashes[0] && onSelectHash) {
                        onSelectHash(nextId ? payload.hashes[0] : null);
                      }
                      if (nextId && onApplyFilter && payload.hashes && payload.hashes[0]) {
                        onApplyFilter(payload.hashes[0]);
                      }
                    }
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="shortLabel"
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  tickFormatter={(val) => {
                    if (metric === 'wasted') return formatBytes(val);
                    return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val;
                  }}
                />
                <RechartsTooltip content={<DistributionTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                <Bar
                  dataKey={metric}
                  radius={[4, 4, 0, 0]}
                  className="cursor-pointer"
                >
                  {distributionChartData.map((entry, index) => {
                    const isSelected = activeBucketId === entry.id;
                    return (
                      <Cell
                        key={`cell-dist-${index}`}
                        fill={entry.color}
                        opacity={activeBucketId ? (isSelected ? 1 : 0.4) : 0.9}
                        stroke={isSelected ? '#ffffff' : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div>
          {/* Top Hashes View */}
          <div className="flex items-center justify-between mb-3 text-xs text-zinc-400">
            <span>Ranked by collision multiplicity (number of identical file copies sharing exact SHA-256):</span>
            <span className="text-zinc-500 font-mono text-[11px]">Top 10 Duplication Hashes</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topHashesChartData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload.length) {
                    const item = e.activePayload[0].payload;
                    if (item && item.sha256) {
                      if (onSelectHash) onSelectHash(item.sha256);
                      if (onApplyFilter) onApplyFilter(item.sha256);
                    }
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#71717a"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  label={{ value: 'Identical Copies', position: 'insideBottomRight', offset: -4, fill: '#71717a', fontSize: 10 }}
                />
                <YAxis
                  dataKey="shortHash"
                  type="category"
                  stroke="#71717a"
                  fontSize={11}
                  fontFamily="monospace"
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <RechartsTooltip content={<TopHashesTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                <Bar
                  dataKey="copies"
                  radius={[0, 4, 4, 0]}
                  className="cursor-pointer"
                >
                  {topHashesChartData.map((entry, index) => {
                    const isSelected = selectedHash === entry.sha256;
                    const barColor = entry.isZeroByte
                      ? '#f59e0b'
                      : entry.copies >= 10
                        ? '#f43f5e'
                        : entry.copies >= 5
                          ? '#f97316'
                          : '#6366f1';
                    return (
                      <Cell
                        key={`cell-top-${index}`}
                        fill={barColor}
                        opacity={selectedHash ? (isSelected ? 1 : 0.4) : 0.9}
                        stroke={isSelected ? '#ffffff' : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Anomaly & Inspection Insights Footer */}
      {analysis.collisionHashCount > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{analysis.anomalySummary.description}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {analysis.emptyFileClusterCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {analysis.emptyFileCount} Zero-Byte Files
              </span>
            )}
            {onNavigateToExplorer && (
              <button
                onClick={onNavigateToExplorer}
                className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
              >
                <span>Filter in Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
