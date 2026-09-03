export interface IgnorePatternPreset {
  id: string;
  pattern: string;
  label: string;
  category: 'Version Control' | 'Dependency Directories' | 'System Metadata' | 'Build Outputs & Caches' | 'Custom';
  description: string;
  defaultSelected: boolean;
}

export const PRESET_IGNORE_PATTERNS: IgnorePatternPreset[] = [
  // Version Control
  {
    id: 'git',
    pattern: '.git',
    label: '.git',
    category: 'Version Control',
    description: 'Git repository metadata, history, and internal objects',
    defaultSelected: true,
  },
  {
    id: 'svn',
    pattern: '.svn',
    label: '.svn',
    category: 'Version Control',
    description: 'Subversion working copy admin metadata',
    defaultSelected: true,
  },
  {
    id: 'hg',
    pattern: '.hg',
    label: '.hg',
    category: 'Version Control',
    description: 'Mercurial source repository directory',
    defaultSelected: true,
  },

  // Dependency Directories
  {
    id: 'node_modules',
    pattern: 'node_modules',
    label: 'node_modules',
    category: 'Dependency Directories',
    description: 'Node.js npm/yarn/pnpm third-party packages',
    defaultSelected: true,
  },
  {
    id: 'vendor',
    pattern: 'vendor/',
    label: 'vendor/',
    category: 'Dependency Directories',
    description: 'Third-party vendor libraries (PHP Composer, Go, Ruby)',
    defaultSelected: true,
  },
  {
    id: 'venv',
    pattern: 'venv/',
    label: 'venv/',
    category: 'Dependency Directories',
    description: 'Python virtual environment directory',
    defaultSelected: true,
  },
  {
    id: 'dot_venv',
    pattern: '.venv/',
    label: '.venv/',
    category: 'Dependency Directories',
    description: 'Hidden Python virtual environment directory',
    defaultSelected: true,
  },

  // System Metadata
  {
    id: 'ds_store',
    pattern: '.DS_Store',
    label: '.DS_Store',
    category: 'System Metadata',
    description: 'macOS Finder view attributes and icon arrangement cache',
    defaultSelected: true,
  },
  {
    id: 'thumbs_db',
    pattern: 'Thumbs.db',
    label: 'Thumbs.db',
    category: 'System Metadata',
    description: 'Windows Explorer thumbnail preview cache file',
    defaultSelected: true,
  },
  {
    id: 'spotlight',
    pattern: '.Spotlight-V100',
    label: '.Spotlight-V100',
    category: 'System Metadata',
    description: 'macOS Spotlight search indexing directory',
    defaultSelected: true,
  },

  // Build Outputs & Caches
  {
    id: 'dist',
    pattern: 'dist/',
    label: 'dist/',
    category: 'Build Outputs & Caches',
    description: 'Compiled distribution code and frontend bundles',
    defaultSelected: true,
  },
  {
    id: 'build',
    pattern: 'build/',
    label: 'build/',
    category: 'Build Outputs & Caches',
    description: 'Compiler output and interim build artifacts',
    defaultSelected: true,
  },
  {
    id: 'pycache',
    pattern: '__pycache__/',
    label: '__pycache__/',
    category: 'Build Outputs & Caches',
    description: 'Python compiled bytecode (.pyc) cache folders',
    defaultSelected: true,
  },
  {
    id: 'next_cache',
    pattern: '.next/',
    label: '.next/',
    category: 'Build Outputs & Caches',
    description: 'Next.js build compilation cache and pre-rendered pages',
    defaultSelected: true,
  },
  {
    id: 'cache',
    pattern: '.cache/',
    label: '.cache/',
    category: 'Build Outputs & Caches',
    description: 'Framework, Babel, and linter temporary cache files',
    defaultSelected: true,
  },
];

/**
 * Checks if a file path matches an ignore pattern.
 * Supports POSIX (/) and Windows (\) file path conventions,
 * exact names, directory prefix/segment matching, and glob wildcards (*).
 */
export function matchesPathPattern(filePath: string, pattern: string): boolean {
  if (!filePath || !pattern) return false;

  // Normalize path separators to POSIX
  const normalizedPath = filePath.replace(/\\/g, '/');
  const cleanPattern = pattern.trim().replace(/\\/g, '/');
  if (!cleanPattern) return false;

  const patternWithoutSlashes = cleanPattern.replace(/^\/+|\/+$/g, '');
  const segments = normalizedPath.split('/');
  const fileName = segments[segments.length - 1];

  // 1. Exact filename or folder name match (e.g. .DS_Store, Thumbs.db)
  if (fileName.toLowerCase() === patternWithoutSlashes.toLowerCase()) {
    return true;
  }

  // 2. Directory segment match (e.g. node_modules, .git, dist, build, venv)
  // Matches any segment in the relative path
  const lowerSegments = segments.map(s => s.toLowerCase());
  const lowerPatternWithoutSlashes = patternWithoutSlashes.toLowerCase();

  if (lowerSegments.includes(lowerPatternWithoutSlashes)) {
    return true;
  }

  if (normalizedPath.toLowerCase().startsWith(lowerPatternWithoutSlashes + '/')) {
    return true;
  }

  if (normalizedPath.toLowerCase().includes('/' + lowerPatternWithoutSlashes + '/')) {
    return true;
  }

  // 3. Glob match (e.g. *.log, temp/*, *.tmp)
  if (cleanPattern.includes('*')) {
    const regexPattern = cleanPattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    try {
      const regex = new RegExp(`(^|/)${regexPattern}($|/)`, 'i');
      if (regex.test(normalizedPath) || regex.test(fileName)) {
        return true;
      }
    } catch {
      // Ignore regex syntax errors
    }
  }

  return false;
}

export interface DetectedIgnoreRule extends IgnorePatternPreset {
  detectedCount: number;
  totalSizeBytes: number;
  samplePaths: string[];
}

export interface PreScanResult {
  hasSuggestions: boolean;
  totalCandidateFiles: number;
  totalCandidateBytes: number;
  detectedRules: DetectedIgnoreRule[];
  allPresets: IgnorePatternPreset[];
}

/**
 * Pre-scans a FileList or array of Files to identify recognized ignore patterns.
 */
export function preScanCandidateFiles(files: FileList | File[]): PreScanResult {
  const detectedMap = new Map<string, { count: number; size: number; samples: string[] }>();
  let totalBytes = 0;

  const fileCount = files.length;

  for (let i = 0; i < fileCount; i++) {
    const file = files[i];
    const path = file.webkitRelativePath || file.name;
    totalBytes += file.size;

    for (const preset of PRESET_IGNORE_PATTERNS) {
      if (matchesPathPattern(path, preset.pattern)) {
        const current = detectedMap.get(preset.id) || { count: 0, size: 0, samples: [] };
        current.count++;
        current.size += file.size;
        if (current.samples.length < 3) {
          current.samples.push(path);
        }
        detectedMap.set(preset.id, current);
      }
    }
  }

  const detectedRules: DetectedIgnoreRule[] = [];
  for (const preset of PRESET_IGNORE_PATTERNS) {
    const detected = detectedMap.get(preset.id);
    if (detected && detected.count > 0) {
      detectedRules.push({
        ...preset,
        detectedCount: detected.count,
        totalSizeBytes: detected.size,
        samplePaths: detected.samples,
      });
    }
  }

  // Sort by count descending
  detectedRules.sort((a, b) => b.detectedCount - a.detectedCount);

  return {
    hasSuggestions: detectedRules.length > 0,
    totalCandidateFiles: fileCount,
    totalCandidateBytes: totalBytes,
    detectedRules,
    allPresets: PRESET_IGNORE_PATTERNS,
  };
}

export interface WorkspaceIgnoreConfig {
  rememberChoice: boolean;
  enabledPatterns: string[];
  customPatterns: string[];
}

const STORAGE_KEY = 'workspace_ignore_preferences';

export function getStoredIgnoreConfig(): WorkspaceIgnoreConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        rememberChoice: Boolean(parsed.rememberChoice),
        enabledPatterns: Array.isArray(parsed.enabledPatterns) ? parsed.enabledPatterns : [],
        customPatterns: Array.isArray(parsed.customPatterns) ? parsed.customPatterns : [],
      };
    }
  } catch (e) {
    console.warn('Failed to load ignore config from localStorage', e);
  }

  return {
    rememberChoice: false,
    enabledPatterns: PRESET_IGNORE_PATTERNS.filter(p => p.defaultSelected).map(p => p.pattern),
    customPatterns: [],
  };
}

export function saveStoredIgnoreConfig(config: WorkspaceIgnoreConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save ignore config to localStorage', e);
  }
}
