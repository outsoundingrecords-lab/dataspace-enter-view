import { InventoryRow, FileCategory } from '../types';
import { formatBytes } from '../utils';

export const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export interface CollisionBucket {
  id: string;
  label: string;
  shortLabel: string;
  minCopies: number;
  maxCopies: number;
  clusterCount: number; // Number of unique SHA-256 hashes with this collision frequency
  fileCount: number;    // Total files sharing hashes in this bucket
  totalBytes: number;
  wastedBytes: number;  // (copies - 1) * size_bytes
  hashes: string[];
  severity: 'normal' | 'moderate' | 'warning' | 'critical';
  color: string;
}

export interface CollisionClusterItem {
  sha256: string;
  shortHash: string;
  count: number;
  size_bytes: number;
  formattedSize: string;
  wastedBytes: number;
  formattedWasted: string;
  fileNames: string[];
  paths: string[];
  categories: FileCategory[];
  isZeroByte: boolean;
  isKnownEmptyHash: boolean;
  severity: 'normal' | 'moderate' | 'warning' | 'critical';
  anomalyNote?: string;
}

export interface HashCollisionAnalysis {
  totalFiles: number;
  totalHashes: number;
  uniqueHashCount: number;
  collisionHashCount: number;
  totalCollisionFiles: number;
  maxCollisionDepth: number;
  totalWastedBytes: number;
  formattedWastedBytes: string;
  buckets: CollisionBucket[];
  topClusters: CollisionClusterItem[];
  emptyFileClusterCount: number;
  emptyFileCount: number;
  errorFileCount: number;
  hasAnomalies: boolean;
  anomalySummary: {
    type: 'clean' | 'moderate' | 'warning' | 'critical';
    title: string;
    description: string;
  };
}

export function analyzeHashCollisions(inventory: InventoryRow[] | null | undefined): HashCollisionAnalysis {
  if (!inventory || inventory.length === 0) {
    return {
      totalFiles: 0,
      totalHashes: 0,
      uniqueHashCount: 0,
      collisionHashCount: 0,
      totalCollisionFiles: 0,
      maxCollisionDepth: 0,
      totalWastedBytes: 0,
      formattedWastedBytes: '0 B',
      buckets: [],
      topClusters: [],
      emptyFileClusterCount: 0,
      emptyFileCount: 0,
      errorFileCount: 0,
      hasAnomalies: false,
      anomalySummary: {
        type: 'clean',
        title: 'No Data Indexed',
        description: 'Scan or import a directory to analyze cryptographic SHA-256 collision frequencies.'
      }
    };
  }

  const hashGroups = new Map<string, InventoryRow[]>();
  let errorFileCount = 0;

  for (const file of inventory) {
    if (file.error) {
      errorFileCount++;
    }
    if (!file.sha256) continue;

    const existing = hashGroups.get(file.sha256);
    if (existing) {
      existing.push(file);
    } else {
      hashGroups.set(file.sha256, [file]);
    }
  }

  let uniqueHashCount = 0;
  let collisionHashCount = 0;
  let totalCollisionFiles = 0;
  let maxCollisionDepth = 0;
  let totalWastedBytes = 0;
  let emptyFileClusterCount = 0;
  let emptyFileCount = 0;

  const clusterItems: CollisionClusterItem[] = [];

  hashGroups.forEach((rows, hash) => {
    const count = rows.length;
    const size = rows[0]?.size_bytes || 0;
    const isZeroByte = size === 0;
    const isKnownEmptyHash = hash === EMPTY_SHA256;

    if (count === 1) {
      uniqueHashCount++;
      return;
    }

    // Collision (2 or more files share identical SHA-256)
    collisionHashCount++;
    totalCollisionFiles += count;
    if (count > maxCollisionDepth) {
      maxCollisionDepth = count;
    }

    const wasted = (count - 1) * size;
    totalWastedBytes += wasted;

    if (isZeroByte || isKnownEmptyHash) {
      emptyFileClusterCount++;
      emptyFileCount += count;
    }

    let severity: 'normal' | 'moderate' | 'warning' | 'critical' = 'normal';
    let anomalyNote: string | undefined = undefined;

    if (isZeroByte || isKnownEmptyHash) {
      severity = count >= 5 ? 'critical' : 'warning';
      anomalyNote = `Zero-byte payload (${count} empty placeholder files detected)`;
    } else if (count >= 10) {
      severity = 'critical';
      anomalyNote = `Severe duplication cluster: ${count} copies (${formatBytes(wasted)} wasted)`;
    } else if (count >= 5) {
      severity = 'warning';
      anomalyNote = `High collision density: ${count} copies`;
    } else if (count >= 3) {
      severity = 'moderate';
    }

    const categories = Array.from(new Set(rows.map(r => r.category).filter(Boolean))) as FileCategory[];

    clusterItems.push({
      sha256: hash,
      shortHash: `${hash.slice(0, 8)}...${hash.slice(-6)}`,
      count,
      size_bytes: size,
      formattedSize: formatBytes(size),
      wastedBytes: wasted,
      formattedWasted: formatBytes(wasted),
      fileNames: rows.map(r => r.file_name).slice(0, 4),
      paths: rows.map(r => r.relative_path).slice(0, 4),
      categories,
      isZeroByte,
      isKnownEmptyHash,
      severity,
      anomalyNote
    });
  });

  // Sort top clusters by copy count descending, then wasted space descending
  clusterItems.sort((a, b) => b.count - a.count || b.wastedBytes - a.wastedBytes);
  const topClusters = clusterItems.slice(0, 10);

  // Group into frequency distribution buckets
  // Buckets: 2x (Pairs), 3x (Triplets), 4x (Quads), 5–9x (Medium Clusters), 10–24x (High Clusters), 25+ (Severe Clusters)
  const bucketDefs = [
    { id: '2', label: '2 Copies (Pairs)', shortLabel: '2x', min: 2, max: 2, severity: 'normal' as const, color: '#6366f1' },
    { id: '3', label: '3 Copies (Triplets)', shortLabel: '3x', min: 3, max: 3, severity: 'moderate' as const, color: '#8b5cf6' },
    { id: '4', label: '4 Copies (Quads)', shortLabel: '4x', min: 4, max: 4, severity: 'moderate' as const, color: '#a855f7' },
    { id: '5-9', label: '5–9 Copies', shortLabel: '5–9x', min: 5, max: 9, severity: 'warning' as const, color: '#f59e0b' },
    { id: '10-24', label: '10–24 Copies', shortLabel: '10–24x', min: 10, max: 24, severity: 'critical' as const, color: '#f97316' },
    { id: '25+', label: '25+ Copies (Critical)', shortLabel: '25+x', min: 25, max: Infinity, severity: 'critical' as const, color: '#f43f5e' }
  ];

  const buckets: CollisionBucket[] = bucketDefs.map(def => {
    let clusterCount = 0;
    let fileCount = 0;
    let totalBytes = 0;
    let wastedBytes = 0;
    const bucketHashes: string[] = [];

    for (const item of clusterItems) {
      if (item.count >= def.min && item.count <= def.max) {
        clusterCount++;
        fileCount += item.count;
        totalBytes += item.size_bytes * item.count;
        wastedBytes += item.wastedBytes;
        bucketHashes.push(item.sha256);
      }
    }

    return {
      id: def.id,
      label: def.label,
      shortLabel: def.shortLabel,
      minCopies: def.min,
      maxCopies: def.max,
      clusterCount,
      fileCount,
      totalBytes,
      wastedBytes,
      hashes: bucketHashes,
      severity: def.severity,
      color: def.color
    };
  });

  // Evaluate integrity anomaly status
  let anomalySummary: HashCollisionAnalysis['anomalySummary'];
  const hasSevereCluster = clusterItems.some(c => c.count >= 10);
  const hasZeroByteCluster = emptyFileClusterCount > 0;

  if (collisionHashCount === 0) {
    anomalySummary = {
      type: 'clean',
      title: 'Cryptographic Integrity Verified',
      description: 'Zero hash collisions detected. All files possess unique SHA-256 digests with no redundant clusters.'
    };
  } else if (hasZeroByteCluster && hasSevereCluster) {
    anomalySummary = {
      type: 'critical',
      title: 'Severe Duplication & Zero-Byte Clusters Detected',
      description: `Detected ${emptyFileCount} empty zero-byte files and high-multiplicity clusters exceeding 10 copies. Review for sync artifacts or failed download runs.`
    };
  } else if (hasSevereCluster) {
    anomalySummary = {
      type: 'critical',
      title: 'Large Duplication Clusters Detected',
      description: `Top cluster has ${maxCollisionDepth} identical copies. Inspect for recursive directory copies or repeated build artifacts.`
    };
  } else if (hasZeroByteCluster) {
    anomalySummary = {
      type: 'warning',
      title: 'Zero-Byte File Collision Cluster',
      description: `${emptyFileCount} empty files share the standard empty SHA-256 digest. These may be placeholders or abandoned files.`
    };
  } else {
    anomalySummary = {
      type: 'moderate',
      title: 'Expected Workspace Duplication',
      description: `${collisionHashCount} distinct SHA-256 collision groups identified across ${totalCollisionFiles} files, consuming ${formatBytes(totalWastedBytes)} of redundant space.`
    };
  }

  return {
    totalFiles: inventory.length,
    totalHashes: hashGroups.size,
    uniqueHashCount,
    collisionHashCount,
    totalCollisionFiles,
    maxCollisionDepth,
    totalWastedBytes,
    formattedWastedBytes: formatBytes(totalWastedBytes),
    buckets,
    topClusters,
    emptyFileClusterCount,
    emptyFileCount,
    errorFileCount,
    hasAnomalies: hasSevereCluster || hasZeroByteCluster,
    anomalySummary
  };
}
