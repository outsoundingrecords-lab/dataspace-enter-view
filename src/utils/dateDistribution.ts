import { InventoryRow } from '../types';
import { formatBytes } from '../utils';

export type AgeBracketId = 'recent' | 'active' | 'stable' | 'aging' | 'stale';

export interface AgeBracketConfig {
  id: AgeBracketId;
  label: string;
  shortLabel: string;
  sublabel: string;
  minDays: number;
  maxDays: number; // Infinity for > 365 days
  color: string;
  hoverColor: string;
}

export const AGE_BRACKETS: AgeBracketConfig[] = [
  {
    id: 'recent',
    label: 'Recent (< 30 days)',
    shortLabel: '< 30d',
    sublabel: 'Last 30 days',
    minDays: 0,
    maxDays: 30,
    color: '#10b981', // emerald
    hoverColor: '#34d399',
  },
  {
    id: 'active',
    label: 'Active (30–90 days)',
    shortLabel: '30–90d',
    sublabel: '1 to 3 months',
    minDays: 30,
    maxDays: 90,
    color: '#06b6d4', // cyan
    hoverColor: '#22d3ee',
  },
  {
    id: 'stable',
    label: 'Stable (90–180 days)',
    shortLabel: '90–180d',
    sublabel: '3 to 6 months',
    minDays: 90,
    maxDays: 180,
    color: '#6366f1', // indigo
    hoverColor: '#818cf8',
  },
  {
    id: 'aging',
    label: 'Aging (180–365 days)',
    shortLabel: '180–365d',
    sublabel: '6 to 12 months',
    minDays: 180,
    maxDays: 365,
    color: '#f59e0b', // amber
    hoverColor: '#fbbf24',
  },
  {
    id: 'stale',
    label: 'Stale / Obsolete (> 1 year)',
    shortLabel: '> 1 yr',
    sublabel: 'Over 1 year ago',
    minDays: 365,
    maxDays: Infinity,
    color: '#f43f5e', // rose
    hoverColor: '#fb7185',
  },
];

export interface FormatSummary {
  extension: string;
  count: number;
  sizeBytes: number;
  percentage: number;
}

export interface AgeBucketDistribution {
  id: AgeBracketId;
  label: string;
  shortLabel: string;
  sublabel: string;
  color: string;
  hoverColor: string;
  fileCount: number;
  totalSizeBytes: number;
  sizeMB: number;
  sizeFormatted: string;
  percentOfTotalCount: number;
  percentOfTotalSize: number;
  primaryFormats: FormatSummary[];
}

export function getFileAgeBracket(modifiedUtcStr: string, referenceTimeMs: number = Date.now()): AgeBracketId {
  try {
    const fileTime = new Date(modifiedUtcStr).getTime();
    if (isNaN(fileTime) || fileTime <= 0) {
      return 'stale';
    }
    const diffDays = Math.max(0, (referenceTimeMs - fileTime) / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return 'recent';
    if (diffDays < 90) return 'active';
    if (diffDays < 180) return 'stable';
    if (diffDays < 365) return 'aging';
    return 'stale';
  } catch {
    return 'stale';
  }
}

export function calculateDateDistribution(
  rows: InventoryRow[],
  referenceTimeMs: number = Date.now()
): {
  buckets: AgeBucketDistribution[];
  totalFiles: number;
  totalBytes: number;
  staleCount: number;
  staleBytes: number;
  recentCount: number;
} {
  const totalFiles = rows.length;
  let totalBytes = 0;

  // Initialize accumulators
  const accumulators = new Map<AgeBracketId, {
    count: number;
    bytes: number;
    extMap: Map<string, { count: number; bytes: number }>;
  }>();

  for (const b of AGE_BRACKETS) {
    accumulators.set(b.id, {
      count: 0,
      bytes: 0,
      extMap: new Map(),
    });
  }

  for (const row of rows) {
    totalBytes += row.size_bytes;
    const bracketId = getFileAgeBracket(row.modified_utc, referenceTimeMs);
    const acc = accumulators.get(bracketId)!;
    acc.count++;
    acc.bytes += row.size_bytes;

    const ext = (row.extension || 'no ext').toLowerCase();
    const extAcc = acc.extMap.get(ext) || { count: 0, bytes: 0 };
    extAcc.count++;
    extAcc.bytes += row.size_bytes;
    acc.extMap.set(ext, extAcc);
  }

  const buckets: AgeBucketDistribution[] = AGE_BRACKETS.map(cfg => {
    const acc = accumulators.get(cfg.id)!;
    const count = acc.count;
    const bytes = acc.bytes;

    // Determine top 4 primary formats
    const extList: FormatSummary[] = Array.from(acc.extMap.entries())
      .map(([extension, data]) => ({
        extension,
        count: data.count,
        sizeBytes: data.bytes,
        percentage: count > 0 ? Math.round((data.count / count) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return {
      id: cfg.id,
      label: cfg.label,
      shortLabel: cfg.shortLabel,
      sublabel: cfg.sublabel,
      color: cfg.color,
      hoverColor: cfg.hoverColor,
      fileCount: count,
      totalSizeBytes: bytes,
      sizeMB: Number((bytes / (1024 * 1024)).toFixed(2)),
      sizeFormatted: formatBytes(bytes),
      percentOfTotalCount: totalFiles > 0 ? Math.round((count / totalFiles) * 100) : 0,
      percentOfTotalSize: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
      primaryFormats: extList,
    };
  });

  const staleBucket = buckets.find(b => b.id === 'stale');
  const recentBucket = buckets.find(b => b.id === 'recent');

  return {
    buckets,
    totalFiles,
    totalBytes,
    staleCount: staleBucket?.fileCount || 0,
    staleBytes: staleBucket?.totalSizeBytes || 0,
    recentCount: recentBucket?.fileCount || 0,
  };
}
