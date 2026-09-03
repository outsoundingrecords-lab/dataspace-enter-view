import { FileCategory } from './types';

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FILE_CATEGORIES: FileCategory[] = [
  'Source Code',
  'Documentation',
  'Configuration',
  'Assets',
  'Other'
];

// Sets of extensions for fast lookup (case-insensitive with leading dot)
const SOURCE_CODE_EXTENSIONS = new Set([
  // JavaScript & TypeScript
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  // Web Frameworks & Markup
  '.vue', '.svelte', '.astro', '.html', '.htm',
  // Styling
  '.css', '.scss', '.sass', '.less', '.styl',
  // Python & Data Science
  '.py', '.pyw', '.ipynb',
  // Java, Kotlin, Scala
  '.java', '.kt', '.kts', '.scala',
  // C, C++, C#, Objective-C
  '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.hh', '.cs', '.m', '.mm',
  // Go, Rust
  '.go', '.rs',
  // PHP, Ruby, Perl
  '.php', '.phtml', '.rb', '.erb', '.pl', '.pm',
  // Shell scripts
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.psm1', '.bat', '.cmd',
  // Database & Query
  '.sql', '.graphql', '.gql', '.prisma',
  // Swift, Dart, Lua, R, others
  '.swift', '.dart', '.lua', '.r', '.elm', '.clj', '.cljs', '.ex', '.exs', '.erl', '.hrl', '.hs', '.lhs', '.pas', '.asm', '.s', '.proto'
]);

const DOCUMENTATION_EXTENSIONS = new Set([
  '.md', '.markdown', '.mdx',
  '.txt', '.rtf', '.pdf',
  '.doc', '.docx', '.odt', '.pages',
  '.epub', '.tex', '.latex',
  '.rst', '.adoc', '.asciidoc', '.man',
  '.log'
]);

const CONFIGURATION_EXTENSIONS = new Set([
  '.json', '.jsonc', '.json5',
  '.yaml', '.yml',
  '.toml', '.xml',
  '.ini', '.env', '.cfg', '.conf', '.config',
  '.properties', '.plist',
  '.lock', '.lockb',
  '.editorconfig', '.prettierrc', '.eslintrc', '.babelrc', '.npmrc', '.nvmrc'
]);

// Special exact file names (case-insensitive) for Configuration or Documentation
const CONFIG_FILE_NAMES = new Set([
  'dockerfile', 'containerfile', 'vagrantfile', 'procfile', 'gemfile', 'rakefile', 'makefile', 'cmakelists.txt',
  '.gitignore', '.gitattributes', '.gitmodules', '.dockerignore', '.npmignore', '.env', '.env.local',
  '.env.development', '.env.production', '.env.example', 'license', 'licence', 'notice', 'authors',
  'codeowners', 'browserslist', 'tsconfig.json', 'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'
]);

const DOC_FILE_NAMES = new Set([
  'readme', 'changelog', 'changes', 'contributing', 'code_of_conduct', 'security', 'todo'
]);

const ASSET_EXTENSIONS = new Set([
  // Raster & Vector Images
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp', '.tiff', '.tif', '.avif', '.heic', '.heif', '.psd', '.ai', '.eps', '.raw', '.cdr',
  // Audio
  '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma', '.mid', '.midi', '.opus',
  // Video
  '.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp',
  // Fonts
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  // 3D / CAD
  '.obj', '.fbx', '.gltf', '.glb', '.blend', '.stl', '.dae', '.3ds'
]);

export function getFileCategory(fileName: string, extension: string, mimeType?: string): FileCategory {
  const lowerName = (fileName || '').toLowerCase().trim();
  const lowerExt = (extension || '').toLowerCase().trim();
  const lowerMime = (mimeType || '').toLowerCase().trim();

  // Check known special files by exact name (e.g. Dockerfile, README)
  if (CONFIG_FILE_NAMES.has(lowerName) || CONFIG_FILE_NAMES.has(lowerName.replace(/^\./, ''))) {
    return 'Configuration';
  }
  if (DOC_FILE_NAMES.has(lowerName) || DOC_FILE_NAMES.has(lowerName.replace(/\.[^/.]+$/, ''))) {
    return 'Documentation';
  }

  // Check extension sets
  if (lowerExt) {
    if (SOURCE_CODE_EXTENSIONS.has(lowerExt)) {
      return 'Source Code';
    }
    if (DOCUMENTATION_EXTENSIONS.has(lowerExt)) {
      return 'Documentation';
    }
    if (CONFIGURATION_EXTENSIONS.has(lowerExt)) {
      return 'Configuration';
    }
    if (ASSET_EXTENSIONS.has(lowerExt)) {
      return 'Assets';
    }
  }

  // Check MIME type hints
  if (lowerMime) {
    if (
      lowerMime.startsWith('image/') ||
      lowerMime.startsWith('audio/') ||
      lowerMime.startsWith('video/') ||
      lowerMime.startsWith('font/')
    ) {
      return 'Assets';
    }
    if (
      lowerMime.includes('javascript') ||
      lowerMime.includes('typescript') ||
      lowerMime.includes('x-python') ||
      lowerMime.includes('x-sh') ||
      lowerMime.includes('x-c')
    ) {
      return 'Source Code';
    }
    if (
      lowerMime.includes('json') ||
      lowerMime.includes('yaml') ||
      lowerMime.includes('toml') ||
      lowerMime.includes('xml')
    ) {
      return 'Configuration';
    }
    if (
      lowerMime.includes('pdf') ||
      lowerMime.includes('word') ||
      lowerMime.includes('document') ||
      lowerMime.includes('text/markdown')
    ) {
      return 'Documentation';
    }
  }

  return 'Other';
}

export const CATEGORY_STYLES: Record<FileCategory, {
  label: string;
  badgeClass: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  dotColor: string;
}> = {
  'Source Code': {
    label: 'Source Code',
    badgeClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    textClass: 'text-indigo-400',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/20',
    dotColor: '#818cf8'
  },
  'Documentation': {
    label: 'Documentation',
    badgeClass: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    textClass: 'text-sky-400',
    bgClass: 'bg-sky-500/10',
    borderClass: 'border-sky-500/20',
    dotColor: '#38bdf8'
  },
  'Configuration': {
    label: 'Configuration',
    badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    dotColor: '#34d399'
  },
  'Assets': {
    label: 'Assets',
    badgeClass: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    textClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/20',
    dotColor: '#c084fc'
  },
  'Other': {
    label: 'Other',
    badgeClass: 'text-zinc-400 bg-zinc-800/80 border-zinc-700/60',
    textClass: 'text-zinc-400',
    bgClass: 'bg-zinc-800/80',
    borderClass: 'border-zinc-700/60',
    dotColor: '#a1a1aa'
  }
};

