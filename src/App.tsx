/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  FolderSearch, 
  Download, 
  Database, 
  FileJson,
  FileSpreadsheet,
  AlertTriangle, ShieldAlert,
  RefreshCw,
  CheckCircle,
  FolderArchive,
  HardDrive,
  Search,
  ArrowUpDown,
  Trash2,
  X,
  Copy,
  Edit2,
  Save,
  Wand2,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Folder,
  File as FileIcon,
  Check,
  ArrowUp,
  ArrowDown,
  Tag,
  History,
  GitCompare,
  FolderOpen,
  Settings,
  ArrowRightLeft,
  Command,
  PanelRight,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Layers,
  Smartphone,
  Monitor,
  Menu,
  LayoutDashboard,
  FolderTree,
  FileText,
  FileCode,
  Image as ImageIcon,
  Clock,
  Table,
  Fingerprint
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Treemap, ScatterChart, Scatter, ZAxis
} from 'recharts';
const RechartsLegend: any = Legend;

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { motion, useReducedMotion } from 'motion/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { InventoryRow, DuplicateGroup, FileRecord, FileCategory } from './types';
import { DirectoryTree } from './components/DirectoryTree';
import { CountUp } from './components/CountUp';
import { Thumbnail } from './components/Thumbnail';
import { ToastContainer, ToastMessage } from './components/Toast';
import { KeyboardShortcutsModal } from './components/KeyboardShortcuts';
import { Breadcrumbs } from './components/Breadcrumbs';
import { HighlightText } from './components/HighlightText';
import { FilePreview } from './components/FilePreview';
import { FileComparisonModal } from './components/FileComparisonModal';
import { ConfirmModal } from './components/ConfirmModal';
import { DependencyMap } from './components/DependencyMap';
import { CommandPalette, CommandItem } from './components/CommandPalette';
import { MobileBottomDock, MobileTab } from './components/MobileBottomDock';
import { DesktopSidebar, DesktopNavModule } from './components/DesktopSidebar';
import { InspectorPanel } from './components/InspectorPanel';
import { GovernanceAuditModal } from './components/GovernanceAuditModal';
import { IgnorePatternModal } from './components/IgnorePatternModal';
import { ModificationDateChart } from './components/ModificationDateChart';
import { HashCollisionChart } from './components/HashCollisionChart';
import { PreferencesModal } from './components/PreferencesModal';
import {
  PreScanResult,
  preScanCandidateFiles,
  matchesPathPattern,
  WorkspaceIgnoreConfig,
  getStoredIgnoreConfig,
  saveStoredIgnoreConfig
} from './utils/ignorePatterns';
import {
  AgeBracketId,
  AGE_BRACKETS,
  getFileAgeBracket
} from './utils/dateDistribution';
import {
  evaluateFuzzyMatch
} from './utils/fuzzySearch';
import { formatBytes, getFileCategory, FILE_CATEGORIES, CATEGORY_STYLES } from './utils';

export default function App() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentFile: '' });
  const [inventory, setInventory] = useState<InventoryRow[] | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [duplicateSearch, setDuplicateSearch] = useState('');
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [selectedFileDetails, setSelectedFileDetails] = useState<InventoryRow | null>(null);
  
  // Date and Search filters
  const [fileSearch, setFileSearch] = useState<string>('');
  const [fileSearchInput, setFileSearchInput] = useState<string>('');
  const [isSearchDebouncing, setIsSearchDebouncing] = useState(false);
  const [selectedAgeBracket, setSelectedAgeBracket] = useState<AgeBracketId | null>(null);
  const [showAgeMenu, setShowAgeMenu] = useState(false);

  // Automated Ignore Pattern Pre-scan suggestions
  const pendingFilesRef = useRef<FileList | File[] | null>(null);
  const [preScanResult, setPreScanResult] = useState<PreScanResult | null>(null);
  const [showIgnoreModal, setShowIgnoreModal] = useState<boolean>(false);
  const [ignoreConfig, setIgnoreConfig] = useState<WorkspaceIgnoreConfig>(getStoredIgnoreConfig);

  // 150ms debounce for fuzzy search query
  useEffect(() => {
    setIsSearchDebouncing(fileSearchInput !== fileSearch);
    const timer = setTimeout(() => {
      setFileSearch(fileSearchInput);
      setIsSearchDebouncing(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [fileSearchInput]);

  const handleSetSearch = (val: string) => {
    setFileSearchInput(val);
    setFileSearch(val);
    setIsSearchDebouncing(false);
  };

  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [categoryFilters, setCategoryFilters] = useState<Set<FileCategory>>(new Set());
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [extensionFilters, setExtensionFilters] = useState<Set<string>>(new Set());
  const [showExtMenu, setShowExtMenu] = useState(false);
  const [mimeTypeFilters, setMimeTypeFilters] = useState<Set<string>>(new Set());
  const [showMimeMenu, setShowMimeMenu] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopyPath = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  // Smart Keep state
  const [showSmartKeep, setShowSmartKeep] = useState(false);
  const [smartKeepKeyword, setSmartKeepKeyword] = useState('');

  // Compare Hash state
  const [compareHash, setCompareHash] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Rename states
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  // Tags/Notes states
  const [tagsInput, setTagsInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Preview state
  // (preview is now handled by FilePreview component)

  // Tree and AI states
  const [viewMode, setViewMode] = useState<'flat' | 'tree' | 'deps'>('flat');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [hashCalculationTimes, setHashCalculationTimes] = useState<{count: number, totalTime: number}>({count: 0, totalTime: 0});
  
  // Table Columns State
  const [columns, setColumns] = useState(() => {
    const defaultCols = {
      thumbnail: true,
      fileName: true,
      category: true,
      size: true,
      modified: true,
      type: true,
      mimeType: false,
      sha256: false,
      tags: true
    };
    try {
      const saved = localStorage.getItem('tableColumns');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { ...defaultCols, ...parsed, category: parsed.category ?? true };
        } catch (e) {
          console.error(e);
        }
      }
    } catch (e) {
      console.warn('localStorage is not available', e);
    }
    return defaultCols;
  });
  
  useEffect(() => {
    try {
      localStorage.setItem('tableColumns', JSON.stringify(columns));
    } catch (e) {
      console.warn('localStorage is not available', e);
    }
  }, [columns]);

  // Unified Responsive UI Redesign States
  const [mobileTab, setMobileTab] = useState<MobileTab>('overview');
  const [desktopModule, setDesktopModule] = useState<DesktopNavModule>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showGovernanceModal, setShowGovernanceModal] = useState(false);
  const [mobileShowTree, setMobileShowTree] = useState(false);
  const [selectedCollisionHash, setSelectedCollisionHash] = useState<string | null>(null);

  // Global Keyboard Shortcuts & Command Integration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + / for search
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setShowCleanupModal(true);
        setCleanupStep(0);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        setShowExportOptionsModal(true);
      }
      // Persistent Command Palette: Cmd/Ctrl + K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // Toggle Inspector: Cmd/Ctrl + I
      if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        setIsInspectorOpen(prev => !prev);
      }
      // Toggle Sidebar: Cmd/Ctrl + B
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      }
      // Esc to close modals
      if (e.key === 'Escape') {
        setSelectedFileDetails(null);
        setShowCleanupModal(false);
        setShowCleanupHistory(false);
        setShowBulkTagModal(false);
        setCompareInventory(null);
        setShowCompareModal(false);
        setShowExportOptionsModal(false);
        setShowConfigModal(false);
        setShowShortcutsModal(false);
        setShowCommandPalette(false);
        setShowGovernanceModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Duplicate Cleanup State
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupStep, setCleanupStep] = useState(0); // 0: Config, 1: Script/Review
  const [cleanupAction, setCleanupAction] = useState<'keep_oldest' | 'keep_newest' | 'keep_shortest_path'>('keep_oldest');
  const [cleanupHistory, setCleanupHistory] = useState<{ id: string, timestamp: number, action: string, count: number, size: number, paths: string[] }[]>([]);
  const [showCleanupHistory, setShowCleanupHistory] = useState(false);
  const [hideMarkedForCleanup, setHideMarkedForCleanup] = useState(false);
  const [hashFilter, setHashFilter] = useState('');
  
  // Bulk Tag State
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState('');

  const [showBulkRenameModal, setShowBulkRenameModal] = useState(false);
  const [bulkRenameMode, setBulkRenameMode] = useState<'prefix' | 'suffix' | 'replace'>('prefix');
  const [bulkRenamePrefix, setBulkRenamePrefix] = useState('');
  const [bulkRenameSuffix, setBulkRenameSuffix] = useState('');
  const [bulkRenameFind, setBulkRenameFind] = useState('');
  const [bulkRenameReplace, setBulkRenameReplace] = useState('');

  // Quick Start State
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [highlightDuplicates, setHighlightDuplicates] = useState(false);
  const [codeFilesOnly, setCodeFilesOnly] = useState(false);
  const [treeSearchTerm, setTreeSearchTerm] = useState('');
  const [selectedTreePath, setSelectedTreePath] = useState('');
  
  type SortField = 'file_name' | 'size_bytes' | 'modified_utc' | 'sha256' | 'category';
  type SortOrder = 'asc' | 'desc';
  const [filterOnlyDuplicates, setFilterOnlyDuplicates] = useState(false);
  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);
  const [hiddenExtensions, setHiddenExtensions] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('size_bytes');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileObjectsRef = useRef<Map<string, File>>(new Map());
  // Workspace Compare State
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareInventory, setCompareInventory] = useState<InventoryRow[] | null>(null);
  const [compareProcessing, setCompareProcessing] = useState(false);
  const [compareProgress, setCompareProgress] = useState({ current: 0, total: 0, currentFile: '' });
  const compareInputRef = useRef<HTMLInputElement>(null);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showExportOptionsModal, setShowExportOptionsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showFileComparisonModal, setShowFileComparisonModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{title: string, message: string, confirmText?: string, onConfirm: () => void} | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [exportIncludeStats, setExportIncludeStats] = useState(true);
  const [exportIncludeCharts, setExportIncludeCharts] = useState(true);
  const [exportScale, setExportScale] = useState<number>(2);
  const configInputRef = useRef<HTMLInputElement>(null);

  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleAdvancedExport = async () => {
    try {
      const images: { url: string, height: number, width: number }[] = [];
      const captureElement = async (id: string) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const url = await toPng(el, { backgroundColor: '#09090b', pixelRatio: exportScale, style: { transform: 'scale(1)', transformOrigin: 'top left' } });
        return new Promise<{url: string, height: number, width: number}>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ url, height: img.height, width: img.width });
          img.src = url;
        });
      };
      if (exportIncludeStats) {
        const data = await captureElement('stats-container');
        if (data) images.push(data);
      }
      if (exportIncludeCharts) {
        const data = await captureElement('charts-container');
        if (data) images.push(data);
      }
      if (images.length === 0) return;
      const padding = 32 * exportScale;
      const gap = 32 * exportScale;
      const totalWidth = Math.max(...images.map(i => i.width)) + (padding * 2);
      const totalHeight = images.reduce((acc, curr) => acc + curr.height, 0) + (padding * 2) + (gap * (images.length - 1));
      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, totalWidth, totalHeight);
      let currentY = padding;
      for (const imgData of images) {
        const img = new Image();
        await new Promise(r => { img.onload = r; img.src = imgData.url; });
        ctx.drawImage(img, (totalWidth - imgData.width) / 2, currentY);
        currentY += imgData.height + gap;
      }
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `workspace_dashboard_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setShowExportOptionsModal(false);
    } catch (e) {
      console.error('Error in advanced export:', e);
      addToast('Failed to export dashboard.', 'error');
    }
  };

  const saveWorkspaceConfig = () => {
    if (!inventory) return;
    
    const config = {
      inventory,
      duplicates,
      columns,
      hiddenExtensions: Array.from(hiddenExtensions),
      sortField,
      sortOrder,
      pageSize
    };
    
    const jsonString = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'workspace_config.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadWorkspaceConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target?.result as string);
        if (config.inventory) setInventory(config.inventory);
        if (config.duplicates) setDuplicates(config.duplicates);
        if (config.columns) setColumns(config.columns);
        if (config.hiddenExtensions) setHiddenExtensions(new Set(config.hiddenExtensions));
        if (config.sortField) setSortField(config.sortField);
        if (config.sortOrder) setSortOrder(config.sortOrder);
        if (config.pageSize) setPageSize(config.pageSize);
        setShowConfigModal(false);
      } catch (err) {
        console.error('Failed to parse workspace config', err);
        addToast('Invalid configuration file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Persistence
  useEffect(() => {
    try {
      const savedInventory = localStorage.getItem('fileInventory');
      const savedDuplicates = localStorage.getItem('fileDuplicates');
      const savedCleanupHistory = localStorage.getItem('cleanupHistory');
      if (savedInventory) {
        try { 
          const parsed = JSON.parse(savedInventory);
          setInventory(parsed.map((item: any) => ({
            ...item,
            modified_at: new Date(item.modified_at)
          }))); 
        } catch (e) { console.error(e); }
      }
      if (savedDuplicates) {
        try { setDuplicates(JSON.parse(savedDuplicates)); } catch (e) { console.error(e); }
      }
      if (savedCleanupHistory) {
        try { setCleanupHistory(JSON.parse(savedCleanupHistory)); } catch (e) { console.error(e); }
      }
    } catch (e) {
      console.warn('localStorage is not available', e);
    }
  }, []);

  useEffect(() => {
    if (inventory) {
      try {
        localStorage.setItem('fileInventory', JSON.stringify(inventory));
      } catch (e) {}
    }
  }, [inventory]);

  useEffect(() => {
    if (duplicates && duplicates.length > 0) {
      try {
        localStorage.setItem('fileDuplicates', JSON.stringify(duplicates));
      } catch (e) {}
    }
  }, [duplicates]);

  useEffect(() => {
    if (cleanupHistory && cleanupHistory.length > 0) {
      try {
        localStorage.setItem('cleanupHistory', JSON.stringify(cleanupHistory));
      } catch (e) {}
    }
  }, [cleanupHistory]);

  useEffect(() => {
    if (!selectedFileDetails) {
      // preview url cleanup was here, now handled by FilePreview
    }
  }, [selectedFileDetails]);

  const processFiles = async (files: FileList | File[]) => {
    setProcessing(true);
    setInventory(null);
    setDuplicates([]);
    fileObjectsRef.current.clear();
    
    const rows: InventoryRow[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ current: i + 1, total: files.length, currentFile: file.webkitRelativePath || file.name });
      
      let hashHex = '';
      let errorMsg = undefined;
      
      try {
        const buffer = await file.arrayBuffer();
        const t0 = performance.now();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const t1 = performance.now();
        setHashCalculationTimes(prev => ({ count: prev.count + 1, totalTime: prev.totalTime + (t1 - t0) }));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (err: any) {
        console.warn("Failed to hash file", file.name, err);
        errorMsg = err.message || 'Failed to read file';
      }
      
      const extension = file.name.includes('.') ? '.' + file.name.split('.').pop()?.toLowerCase() : '';
      const relativePath = file.webkitRelativePath || file.name;
      const category = getFileCategory(file.name, extension, file.type);
      
      fileObjectsRef.current.set(relativePath, file);

      rows.push({
        relative_path: relativePath,
        file_name: file.name,
        extension: extension,
        category: category,
        size_bytes: file.size,
        modified_utc: new Date(file.lastModified).toISOString(),
        mime_type: file.type || '',
        sha256: hashHex,
        error: errorMsg
      });
      
      // Yield to main thread to update UI
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Group duplicates
    const grouped = new Map<string, InventoryRow[]>();
    rows.forEach(row => {
      if (row.sha256 && !row.error) {
        if (!grouped.has(row.sha256)) {
          grouped.set(row.sha256, []);
        }
        grouped.get(row.sha256)!.push(row);
      }
    });
    
    const dups: DuplicateGroup[] = [];
    grouped.forEach((groupRows, hash) => {
      if (groupRows.length > 1) {
        dups.push({
          sha256: hash,
          size_bytes: groupRows[0].size_bytes,
          count: groupRows.length,
          paths: groupRows.map(r => r.relative_path).sort()
        });
      }
    });
    
    // Sort by count descending, then by size descending
    dups.sort((a, b) => b.count - a.count || b.size_bytes - a.size_bytes);
    
    setInventory(rows);
    setDuplicates(dups);
    setProcessing(false);
  };

  const initiateFileSelection = (files: FileList | File[]) => {
    // 1. Run Pre-scan for Automated Ignore Pattern Suggestions
    const preScan = preScanCandidateFiles(files);
    
    // If recognized build system, source control, or system metadata patterns are detected,
    // prompt suggested exclude rules before starting full index execution.
    if (preScan.hasSuggestions) {
      pendingFilesRef.current = files;
      setPreScanResult(preScan);
      setShowIgnoreModal(true);
      return;
    }

    // No suggestions detected, directly process files
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      initiateFileSelection(e.target.files);
    }
  };

  const processCompareFiles = async (files: FileList) => {
    setCompareProcessing(true);
    setCompareInventory(null);
    
    const rows: InventoryRow[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCompareProgress({ current: i + 1, total: files.length, currentFile: file.webkitRelativePath || file.name });
      
      let hashHex = '';
      let errorMsg = undefined;
      
      try {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (err: any) {
        errorMsg = err.message || 'Failed to read file';
      }
      
      const extension = file.name.includes('.') ? '.' + file.name.split('.').pop()?.toLowerCase() : '';
      const relativePath = file.webkitRelativePath || file.name;
      const category = getFileCategory(file.name, extension, file.type);
      
      rows.push({
        relative_path: relativePath,
        file_name: file.name,
        extension: extension,
        category: category,
        size_bytes: file.size,
        modified_utc: new Date(file.lastModified).toISOString(),
        mime_type: file.type || '',
        sha256: hashHex,
        error: errorMsg
      });
      
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    setCompareInventory(rows);
    setCompareProcessing(false);
  };

  const handleCompareFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processCompareFiles(e.target.files);
    }
  };

  const handleBatchValidate = async () => {
    if (!inventory) return;
    const errorFiles = inventory.filter(f => f.error);
    if (errorFiles.length === 0) return;

    setProcessing(true);
    const updatedInventory = [...inventory];
    
    for (let i = 0; i < errorFiles.length; i++) {
      const fileRow = errorFiles[i];
      setProgress({ current: i + 1, total: errorFiles.length, currentFile: fileRow.relative_path });
      
      const file = fileObjectsRef.current.get(fileRow.relative_path);
      if (file) {
        try {
          const buffer = await file.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          
          const index = updatedInventory.findIndex(r => r.relative_path === fileRow.relative_path);
          if (index !== -1) {
            updatedInventory[index] = { ...updatedInventory[index], sha256: hashHex, error: undefined };
          }
        } catch (err: any) {
          // Still failed
        }
      }
      
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Recalculate duplicates
    const grouped = new Map<string, InventoryRow[]>();
    updatedInventory.forEach(row => {
      if (row.sha256 && !row.error) {
        if (!grouped.has(row.sha256)) {
          grouped.set(row.sha256, []);
        }
        grouped.get(row.sha256)!.push(row);
      }
    });
    
    const dups: DuplicateGroup[] = [];
    grouped.forEach((groupRows, hash) => {
      if (groupRows.length > 1) {
        dups.push({
          sha256: hash,
          size_bytes: groupRows[0].size_bytes,
          count: groupRows.length,
          paths: groupRows.map(r => r.relative_path).sort()
        });
      }
    });
    
    dups.sort((a, b) => b.count - a.count || b.size_bytes - a.size_bytes);

    setInventory(updatedInventory);
    setDuplicates(dups);
    setProcessing(false);
  };

  const downloadHashesTXT = () => {
    if (!sortedInventory) return;
    const hashes = sortedInventory.filter(f => f.sha256).map(f => f.sha256).join('\n');
    const blob = new Blob([hashes], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `workspace_hashes_${Date.now()}.txt`;
    link.click();
    setShowExportMenu(false);
    setShowExportOptionsModal(false);
  };

  const downloadSummary = () => {
    if (!inventory) return;
    const totalSize = inventory.reduce((acc, r) => acc + r.size_bytes, 0);
    const summary = `WORKSPACE CLEANUP SUMMARY\n` +
      `Generated: ${new Date().toLocaleString()}\n\n` +
      `Total Files Scanned: ${inventory.length}\n` +
      `Total Workspace Size: ${formatBytes(totalSize)}\n` +
      `Duplicate Groups Found: ${duplicates.length}\n` +
      `Duplicate Files Count: ${duplicates.reduce((acc, d) => acc + d.count, 0)}\n\n` +
      `End of Report\n`;
    
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace_summary_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (downloadType: 'all' | 'filtered' = 'all') => {
    const dataToDownload = downloadType === 'filtered' ? sortedInventory : inventory;
    if (!dataToDownload || dataToDownload.length === 0) return;
    
    const keys: (keyof InventoryRow)[] = [
      'relative_path', 'file_name', 'category', 'extension', 
      'size_bytes', 'modified_utc', 'mime_type', 'sha256'
    ];
    
    const header = keys.join(',');
    const body = dataToDownload.map(row => {
      return keys.map(k => {
        let rawVal = row[k];
        if (k === 'category' && !rawVal) {
          rawVal = getFileCategory(row.file_name, row.extension, row.mime_type);
        }
        let val = rawVal === null || rawVal === undefined ? '' : String(rawVal);
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',');
    }).join('\n');
    
    const csvContent = `${header}\n${body}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', downloadType === 'filtered' ? 'inventory_filtered.csv' : 'inventory_all.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyAsMarkdownTable = async () => {
    if (!sortedInventory || sortedInventory.length === 0) {
      addToast('No files in the current filtered inventory to copy', 'info');
      setShowExportMenu(false);
      return;
    }

    const escapeCell = (val: any): string => {
      if (val === null || val === undefined) return '';
      return String(val).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').trim();
    };

    const headers = ['File Name', 'Relative Path', 'Category', 'Size', 'Modified (UTC)', 'Extension', 'SHA-256'];
    const headerRow = `| ${headers.join(' | ')} |`;
    const separatorRow = `| :--- | :--- | :--- | :---: | :--- | :---: | :--- |`;

    const rows = sortedInventory.map(row => {
      const category = row.category || getFileCategory(row.file_name, row.extension, row.mime_type);
      const formattedSize = formatBytes(row.size_bytes);
      const ext = row.extension || (row.file_name.includes('.') ? `.${row.file_name.split('.').pop()}` : '-');
      const hash = row.sha256 ? `\`${row.sha256}\`` : '-';

      return `| ${escapeCell(row.file_name)} | ${escapeCell(row.relative_path)} | ${escapeCell(category)} | ${formattedSize} | ${escapeCell(row.modified_utc)} | ${escapeCell(ext)} | ${hash} |`;
    });

    const markdownTable = [headerRow, separatorRow, ...rows].join('\n');

    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(markdownTable);
        copied = true;
      }
    } catch (e) {
      console.warn('Navigator clipboard API failed, attempting fallback', e);
    }

    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = markdownTable;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch (e) {
        console.error('Fallback clipboard copy failed', e);
      }
    }

    setShowExportMenu(false);

    if (copied) {
      addToast(`Copied Markdown table of ${sortedInventory.length.toLocaleString()} filtered files to clipboard!`, 'success');
    } else {
      addToast('Could not copy to clipboard. Please check browser permissions.', 'error');
    }
  };


  const handleClearTags = () => {
    if (!inventory || selectedPaths.size === 0) return;
    const updatedInventory = inventory.map(file => {
      if (selectedPaths.has(file.relative_path)) {
        return { ...file, tags: [] };
      }
      return file;
    });
    setInventory(updatedInventory);
  };

  const handleBulkRename = () => {
    if (!inventory || selectedPaths.size === 0) return;
    const updatedInventory = inventory.map(file => {
      if (selectedPaths.has(file.relative_path)) {
        let newName = file.file_name;
        if (bulkRenameMode === 'prefix' && bulkRenamePrefix) {
          newName = bulkRenamePrefix + newName;
        } else if (bulkRenameMode === 'suffix' && bulkRenameSuffix) {
          const lastDotIdx = newName.lastIndexOf('.');
          if (lastDotIdx !== -1) {
            newName = newName.slice(0, lastDotIdx) + bulkRenameSuffix + newName.slice(lastDotIdx);
          } else {
            newName = newName + bulkRenameSuffix;
          }
        } else if (bulkRenameMode === 'replace' && bulkRenameFind) {
          newName = newName.split(bulkRenameFind).join(bulkRenameReplace);
        }
        
        const pathParts = file.relative_path.split('/');
        pathParts[pathParts.length - 1] = newName;
        const newRelativePath = pathParts.join('/');
        const newExt = newName.includes('.') ? '.' + newName.split('.').pop()?.toLowerCase() : '';
        const updatedCat = getFileCategory(newName, newExt, file.mime_type);

        return {
          ...file,
          file_name: newName,
          relative_path: newRelativePath,
          extension: newExt,
          category: updatedCat
        };
      }
      return file;
    });
    setInventory(updatedInventory);
    setShowBulkRenameModal(false);
    setSelectedPaths(new Set());
  };

  const handleBulkTag = () => {
    if (!inventory || !bulkTagInput.trim() || selectedPaths.size === 0) return;
    
    const newTags = bulkTagInput.split(',').map(t => t.trim()).filter(t => t);
    
    setInventory(inventory.map(file => {
      if (selectedPaths.has(file.relative_path)) {
        const existingTags = file.tags || [];
        // Only add tags that don't already exist
        const tagsToAdd = newTags.filter(t => !existingTags.includes(t));
        return {
          ...file,
          tags: [...existingTags, ...tagsToAdd]
        };
      }
      return file;
    }));
    
    setBulkTagInput('');
    setShowBulkTagModal(false);
  };

  const handleRefresh = () => {
    setShowResetConfirm(true);
  };

  const confirmRefresh = () => {
    setInventory(null);
    setDuplicates([]);
    fileObjectsRef.current.clear();
    setFileSearch('');
    setSelectedPaths(new Set());
    try {
      localStorage.removeItem('fileInventory');
      localStorage.removeItem('fileDuplicates');
    } catch (e) {}
    setShowResetConfirm(false);
  };

  const downloadFilteredJSON = () => {
    if (!sortedInventory) return;
    const blob = new Blob([JSON.stringify(sortedInventory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtered_inventory_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (!inventory) return;
    
    const summary = {
      file_count: inventory.length,
      total_size_bytes: inventory.reduce((acc, row) => acc + row.size_bytes, 0),
      exact_duplicate_groups: duplicates.length,
      exact_duplicate_files: duplicates.reduce((acc, group) => acc + group.count, 0),
      groups: duplicates
    };
    
    const jsonString = JSON.stringify(summary, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'duplicates.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSelectedJSON = () => {
    if (!inventory || selectedPaths.size === 0) return;
    const selectedRows = inventory.filter(row => selectedPaths.has(row.relative_path));
    const jsonString = JSON.stringify(selectedRows, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'selected_files.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCharts = async () => {
    const chartsContainer = document.getElementById('charts-container');
    if (!chartsContainer) return;
    try {
      const url = await toPng(chartsContainer, { backgroundColor: '#09090b' });
      const a = document.createElement('a');
      a.href = url;
      a.download = `workspace_charts_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Error exporting charts:', e);
    }
  };

  const exportPDF = () => {
    if (!inventory) return;
    setIsExportingPDF(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Workspace Analysis Report', 14, 22);
        
        doc.setFontSize(12);
        doc.text(`Total Files: ${inventory.length}`, 14, 32);
        doc.text(`Total Size: ${formatBytes(totalSize)}`, 14, 40);
        doc.text(`Duplicate Groups: ${duplicates.length}`, 14, 48);
        doc.text(`Wasted Space: ${formatBytes(duplicateSize)}`, 14, 56);

        const largestFiles = [...inventory].sort((a, b) => b.size_bytes - a.size_bytes).slice(0, 20);
        
        doc.text('Top 20 Largest Files:', 14, 70);
        const largestFilesData = largestFiles.map(file => [
          file.file_name,
          file.extension || 'none',
          formatBytes(file.size_bytes),
          file.relative_path
        ]);
        
        autoTable(doc, {
          startY: 75,
          head: [['File Name', 'Extension', 'Size', 'Path']],
          body: largestFilesData,
        });
        
        if (duplicates.length > 0) {
          const finalY = (doc as any).lastAutoTable?.finalY || 120;
          doc.text('Top Duplicates:', 14, finalY + 14);
          const tableData = duplicates.slice(0, 20).map(group => [
            group.sha256.substring(0, 12) + '...',
            group.count.toString(),
            formatBytes(group.size_bytes),
            group.paths[0]
          ]);
          
          autoTable(doc, {
            startY: finalY + 20,
            head: [['Hash', 'Count', 'Size Each', 'Example Path']],
            body: tableData,
          });
        }

        doc.save(`workspace-report-${Date.now()}.pdf`);
      } catch (err) {
        console.error('Error generating PDF:', err);
      } finally {
        setIsExportingPDF(false);
      }
    }, 100);
  };

  const totalSize = inventory ? inventory.reduce((acc, r) => acc + r.size_bytes, 0) : 0;
  const duplicateSize = duplicates.reduce((acc, g) => acc + (g.size_bytes * (g.count - 1)), 0);

  const emptyFiles = useMemo(() => inventory ? inventory.filter(f => f.size_bytes === 0) : [], [inventory]);
  const foldersCount = useMemo(() => {
    if (!inventory) return 0;
    const folders = new Set();
    inventory.forEach(f => {
      let currentPath = '';
      const parts = f.relative_path.split('/');
      parts.pop(); // remove file name
      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        folders.add(currentPath);
      }
    });
    return folders.size || 1; // avoid division by zero
  }, [inventory]);
  const averageFilesPerFolder = inventory ? (inventory.length / foldersCount).toFixed(1) : '0';

  const extensionData = useMemo(() => {
    if (!inventory) return [];
    const counts = new Map<string, number>();
    inventory.forEach(f => {
      const ext = f.extension || 'none';
      counts.set(ext, (counts.get(ext) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [inventory]);

  const visibleExtensionData = useMemo(() => extensionData.filter(d => !hiddenExtensions.has(d.name)), [extensionData, hiddenExtensions]);

  const scatterData = useMemo(() => {
    if (!inventory) return [];
    // We want all files grouped by hash
    const map = new Map<string, { size: number, count: number, name: string }>();
    inventory.forEach(f => {
      if (!f.sha256) return;
      if (!map.has(f.sha256)) {
        map.set(f.sha256, { size: f.size_bytes, count: 1, name: f.file_name });
      } else {
        map.get(f.sha256)!.count++;
      }
    });
    return Array.from(map.values()).map(d => ({
      x: d.size,
      y: d.count,
      name: d.name
    }));
  }, [inventory]);

  const hashUniquenessData = useMemo(() => {
    if (!inventory) return [];
    const counts = new Map<string, number>();
    inventory.forEach(f => {
      if (f.sha256) counts.set(f.sha256, (counts.get(f.sha256) || 0) + 1);
    });
    const frequencies = { '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0 };
    counts.forEach(count => {
      if (count === 1) frequencies['1'] += count;
      else if (count === 2) frequencies['2'] += count;
      else if (count === 3) frequencies['3'] += count;
      else if (count === 4) frequencies['4'] += count;
      else frequencies['5+'] += count;
    });
    return [
      { name: '1 Copy (Unique)', value: frequencies['1'] },
      { name: '2 Copies', value: frequencies['2'] },
      { name: '3 Copies', value: frequencies['3'] },
      { name: '4 Copies', value: frequencies['4'] },
      { name: '5+ Copies', value: frequencies['5+'] }
    ].filter(d => d.value > 0);
  }, [inventory]);

  const sizeHistogramData = useMemo(() => {
    if (!inventory) return [];
    const buckets = [
      { name: '< 100KB', min: 0, max: 100 * 1024, count: 0 },
      { name: '100KB - 1MB', min: 100 * 1024, max: 1024 * 1024, count: 0 },
      { name: '1MB - 10MB', min: 1024 * 1024, max: 10 * 1024 * 1024, count: 0 },
      { name: '10MB - 100MB', min: 10 * 1024 * 1024, max: 100 * 1024 * 1024, count: 0 },
      { name: '> 100MB', min: 100 * 1024 * 1024, max: Infinity, count: 0 }
    ];
    
    inventory.forEach(f => {
      for (const b of buckets) {
        if (f.size_bytes >= b.min && f.size_bytes < b.max) {
          b.count++;
          break;
        }
      }
    });
    return buckets;
  }, [inventory]);

  const duplicateFrequencyData = useMemo(() => {
    if (duplicates.length === 0) return [];
    return duplicates
      .map((d, index) => ({ name: `Group ${index + 1}`, copies: d.count }))
      .sort((a, b) => b.copies - a.copies)
      .slice(0, 10);
  }, [duplicates]);

  const hashDistributionData = useMemo(() => {
    if (!inventory) return [];
    const duplicateFileCount = duplicates.reduce((acc, d) => acc + d.count, 0);
    const uniqueFileCount = inventory.length - duplicateFileCount;
    return [
      { name: 'Unique Files', value: uniqueFileCount },
      { name: 'Duplicate Files', value: duplicateFileCount }
    ];
  }, [inventory, duplicates]);

  const allCategoryCounts = useMemo(() => {
    if (!inventory) return [];
    const counts = new Map<FileCategory, number>();
    FILE_CATEGORIES.forEach(c => counts.set(c, 0));
    inventory.forEach(f => {
      const cat = f.category || getFileCategory(f.file_name, f.extension, f.mime_type);
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });
    return FILE_CATEGORIES.map(name => ({
      name,
      count: counts.get(name) || 0
    }));
  }, [inventory]);

  const categoryDistributionData = useMemo(() => {
    if (!inventory) return [];
    return allCategoryCounts.filter(c => c.count > 0).map(c => ({
      name: c.name,
      value: c.count
    }));
  }, [inventory, allCategoryCounts]);

  const allExtensionCounts = useMemo(() => {
    if (!inventory) return [];
    const counts = new Map<string, number>();
    inventory.forEach(f => {
      const ext = f.extension || 'none';
      counts.set(ext, (counts.get(ext) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [inventory]);

  const allMimeTypeCounts = useMemo(() => {
    if (!inventory) return [];
    const counts = new Map<string, number>();
    inventory.forEach(f => {
      const mime = f.mime_type || 'unknown/none';
      counts.set(mime, (counts.get(mime) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [inventory]);

  const treemapData = useMemo(() => {
    if (!inventory) return [];
    const map = new Map<string, { name: string, size: number, children: any[] }>();
    
    inventory.forEach(file => {
      const parts = file.relative_path.split('/');
      const topLevel = parts.length > 1 ? parts[0] : 'Root';
      
      if (!map.has(topLevel)) {
        map.set(topLevel, { name: topLevel, size: 0, children: [] });
      }
      
      const folder = map.get(topLevel)!;
      folder.children.push({
        name: file.relative_path,
        fileName: file.file_name,
        size: file.size_bytes
      });
      // Recharts Treemap auto-aggregates size if children exist, but calculating manually just in case
      folder.size += file.size_bytes;
    });
    
    return Array.from(map.values());
  }, [inventory]);

  const filteredDuplicates = useMemo(() => {
    let result = duplicates;
    if (hideMarkedForCleanup) {
      result = result.map(group => ({
        ...group,
        paths: group.paths.filter(p => !selectedPaths.has(p))
      })).filter(group => group.paths.length > 1);
    }
    if (!duplicateSearch) return result;
    const lowerSearch = duplicateSearch.toLowerCase();
    return result.filter(group => 
      group.paths.some(path => path.toLowerCase().includes(lowerSearch))
    );
  }, [duplicates, duplicateSearch, hideMarkedForCleanup, selectedPaths]);

  const duplicateCountsMap = useMemo(() => {
    const map = new Map<string, number>();
    duplicates.forEach(group => {
      if (group.sha256) {
        map.set(group.sha256, group.count);
      }
    });
    return map;
  }, [duplicates]);

  const sortedInventory = useMemo(() => {
    if (!inventory) return [];
    
    let filtered: Array<InventoryRow & { _fuzzyScore?: number; _matchNameIndices?: number[]; _matchPathIndices?: number[] }> = [...inventory];

    // Apply text search filter with fuzzy approximate matching & ranking
    if (fileSearch.trim()) {
      const query = fileSearch.trim();
      const queryLower = query.toLowerCase();
      const matched: typeof filtered = [];

      for (const f of filtered) {
        const cat = f.category || getFileCategory(f.file_name, f.extension, f.mime_type);
        const match = evaluateFuzzyMatch(f.file_name, f.relative_path, cat, f.extension, query);

        if (match) {
          matched.push({
            ...f,
            _fuzzyScore: match.score,
            _matchNameIndices: match.nameIndices,
            _matchPathIndices: match.pathIndices,
          });
        } else {
          // Broad fallback for mime type, hash, or loose substring
          const mimeMatch = f.mime_type && f.mime_type.toLowerCase().includes(queryLower);
          const hashMatch = f.sha256 && f.sha256.toLowerCase().includes(queryLower);
          if (mimeMatch || hashMatch) {
            matched.push({
              ...f,
              _fuzzyScore: 0.4,
            });
          }
        }
      }
      filtered = matched;
    }

    // Apply file modification date age bracket filter
    if (selectedAgeBracket) {
      filtered = filtered.filter(f => getFileAgeBracket(f.modified_utc) === selectedAgeBracket);
    }

    // Apply date range filters
    if (dateStart) {
      const start = new Date(dateStart).getTime();
      filtered = filtered.filter(f => new Date(f.modified_utc).getTime() >= start);
    }
    if (dateEnd) {
      // Set end of day for dateEnd
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(f => new Date(f.modified_utc).getTime() <= end.getTime());
    }

    // Apply category filters
    if (categoryFilters.size > 0) {
      filtered = filtered.filter(f => {
        const cat = f.category || getFileCategory(f.file_name, f.extension, f.mime_type);
        return categoryFilters.has(cat);
      });
    }

    // Apply extension filters
    if (extensionFilters.size > 0) {
      filtered = filtered.filter(f => extensionFilters.has(f.extension || 'none'));
    }

    // Apply mime-type filters
    if (mimeTypeFilters.size > 0) {
      filtered = filtered.filter(f => mimeTypeFilters.has(f.mime_type || 'unknown/none'));
    }

    if (codeFilesOnly) {
      const codeExtensions = new Set([
        '.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', 
        '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rs', '.php', '.rb',
        '.sh', '.yaml', '.yml', '.xml', '.sql'
      ]);
      filtered = filtered.filter(f => {
        const cat = f.category || getFileCategory(f.file_name, f.extension, f.mime_type);
        return cat === 'Source Code' || (f.extension && codeExtensions.has(f.extension.toLowerCase()));
      });
    }

    if (filterOnlyDuplicates) {
      const dupHashes = new Set(duplicates.map(d => d.sha256));
      filtered = filtered.filter(f => f.sha256 && dupHashes.has(f.sha256));
    }
    
    return filtered.sort((a, b) => {
      // When fuzzy search is active, prioritize match closeness unless user explicitly selected a non-path sort
      if (fileSearch.trim() && sortField === 'file_name') {
        const scoreA = a._fuzzyScore ?? 0;
        const scoreB = b._fuzzyScore ?? 0;
        if (Math.abs(scoreB - scoreA) > 0.05) {
          return scoreB - scoreA;
        }
      }

      let valA: any = sortField === 'category'
        ? (a.category || getFileCategory(a.file_name, a.extension, a.mime_type))
        : (a[sortField] || '');
      let valB: any = sortField === 'category'
        ? (b.category || getFileCategory(b.file_name, b.extension, b.mime_type))
        : (b[sortField] || '');
      
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [inventory, sortField, sortOrder, dateStart, dateEnd, fileSearch, selectedAgeBracket, categoryFilters, extensionFilters, mimeTypeFilters, filterOnlyDuplicates, duplicates, codeFilesOnly]);

  const totalPages = Math.max(1, Math.ceil(sortedInventory.length / pageSize));

  // Reset page to 1 when search, filters, sorting, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [fileSearch, selectedAgeBracket, dateStart, dateEnd, categoryFilters, extensionFilters, mimeTypeFilters, sortField, sortOrder, pageSize]);

  // Keep page within bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Staggered entrance animation epoch tracking for file inventory table
  const [tableAnimationEpoch, setTableAnimationEpoch] = useState<number>(0);
  const tableAnimationTimeRef = useRef<number>(Date.now());
  const lastTableFilterHashRef = useRef<string>('');

  const tableFilterHash = useMemo(() => {
    return [
      inventory ? inventory.length : 0,
      sortedInventory.length,
      fileSearch,
      selectedAgeBracket || '',
      dateStart || '',
      dateEnd || '',
      Array.from(categoryFilters).sort().join(','),
      Array.from(extensionFilters).sort().join(','),
      Array.from(mimeTypeFilters).sort().join(','),
      codeFilesOnly ? '1' : '0',
      filterOnlyDuplicates ? '1' : '0',
      sortField,
      sortOrder
    ].join('|');
  }, [
    inventory,
    sortedInventory.length,
    fileSearch,
    selectedAgeBracket,
    dateStart,
    dateEnd,
    categoryFilters,
    extensionFilters,
    mimeTypeFilters,
    codeFilesOnly,
    filterOnlyDuplicates,
    sortField,
    sortOrder
  ]);

  useEffect(() => {
    if (lastTableFilterHashRef.current !== tableFilterHash) {
      lastTableFilterHashRef.current = tableFilterHash;
      tableAnimationTimeRef.current = Date.now();
      setTableAnimationEpoch(prev => prev + 1);
      tableContainerRef.current?.scrollTo({ top: 0 });
    }
  }, [tableFilterHash]);
  
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not interfere if a modal is open or if user is typing in an input
      if (
        showConfigModal || showExportOptionsModal || showShortcutsModal || 
        showFileComparisonModal || showCleanupModal || showCleanupHistory || 
        showBulkRenameModal || showBulkTagModal || selectedFileDetails ||
        viewMode === 'tree' || document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' || confirmAction
      ) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedRowIndex(prev => {
          if (prev === -1) return 0;
          return Math.min(prev + 1, sortedInventory.length - 1);
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedRowIndex(prev => {
          if (prev === -1) return sortedInventory.length - 1;
          return Math.max(prev - 1, 0);
        });
      } else if (e.key === 'Enter') {
        if (focusedRowIndex >= 0 && focusedRowIndex < sortedInventory.length) {
          e.preventDefault();
          const file = sortedInventory[focusedRowIndex];
          setSelectedFileDetails(file);
          setIsRenaming(false);
          setRenameInput(file.file_name);
          setNotesInput(file.notes || '');
          setCompareHash('');
        }
      } else if (e.key === 'Escape') {
        if (focusedRowIndex >= 0) {
          setFocusedRowIndex(-1);
        }
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (focusedRowIndex >= 0 && focusedRowIndex < sortedInventory.length) {
          const file = sortedInventory[focusedRowIndex];
          const newSelected = new Set(selectedPaths);
          if (newSelected.has(file.relative_path)) {
            newSelected.delete(file.relative_path);
          } else {
            newSelected.add(file.relative_path);
          }
          setSelectedPaths(newSelected);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    showConfigModal, showExportOptionsModal, showShortcutsModal, 
    showFileComparisonModal, showCleanupModal, showCleanupHistory, 
    showBulkRenameModal, showBulkTagModal, selectedFileDetails,
    viewMode, sortedInventory, focusedRowIndex, selectedPaths, confirmAction
  ]);

  const virtualizer = useVirtualizer({
    count: sortedInventory.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48, // approximate height of a table row
    overscan: 5,
  });

  // Scroll focused item into view
  useEffect(() => {
    if (focusedRowIndex >= 0) {
      virtualizer.scrollToIndex(focusedRowIndex, { align: 'auto' });
    }
  }, [focusedRowIndex, virtualizer]);

  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedInventory.slice(start, start + pageSize);
  }, [sortedInventory, currentPage, pageSize]);

  const getPageNumbers = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);
    if (current > 3) pages.push('...');
    
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-400" /> : <ArrowDown className="w-3 h-3 text-indigo-400" />;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allPaths = new Set(inventory?.map(r => r.relative_path) || []);
      setSelectedPaths(allPaths);
    } else {
      setSelectedPaths(new Set());
    }
  };

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, path: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedPaths);
    if (e.target.checked) {
      newSelected.add(path);
    } else {
      newSelected.delete(path);
    }
    setSelectedPaths(newSelected);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagsInput.trim() && selectedFileDetails && inventory) {
      e.preventDefault();
      const newTag = tagsInput.trim();
      const currentTags = selectedFileDetails.tags || [];
      if (!currentTags.includes(newTag)) {
        const newTags = [...currentTags, newTag];
        const updatedInventory = inventory.map(f => 
          f.relative_path === selectedFileDetails.relative_path ? { ...f, tags: newTags } : f
        );
        setInventory(updatedInventory);
        setSelectedFileDetails({ ...selectedFileDetails, tags: newTags });
      }
      setTagsInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (selectedFileDetails && inventory) {
      const newTags = (selectedFileDetails.tags || []).filter(t => t !== tagToRemove);
      const updatedInventory = inventory.map(f => 
        f.relative_path === selectedFileDetails.relative_path ? { ...f, tags: newTags } : f
      );
      setInventory(updatedInventory);
      setSelectedFileDetails({ ...selectedFileDetails, tags: newTags });
    }
  };

  const handleSaveNotes = (notes: string) => {
    if (selectedFileDetails && inventory) {
      const updatedInventory = inventory.map(f => 
        f.relative_path === selectedFileDetails.relative_path ? { ...f, notes: notes.trim() } : f
      );
      setInventory(updatedInventory);
      setSelectedFileDetails({ ...selectedFileDetails, notes: notes.trim() });
    }
  };

  const handleRenameConfirm = () => {
    if (!selectedFileDetails || !renameInput.trim() || !inventory) return;
    
    const newName = renameInput.trim();
    const oldPath = selectedFileDetails.relative_path;
    
    // Calculate new path
    const pathParts = oldPath.split('/');
    pathParts[pathParts.length - 1] = newName;
    const newPath = pathParts.join('/');
    
    const newExt = newName.includes('.') ? '.' + newName.split('.').pop()?.toLowerCase() : '';
    
    const newInventory = inventory.map(item => {
      if (item.relative_path === oldPath) {
        return {
          ...item,
          file_name: newName,
          relative_path: newPath,
          extension: newExt,
          category: getFileCategory(newName, newExt, item.mime_type)
        };
      }
      return item;
    });
    
    setInventory(newInventory);
    
    // Update duplicates if necessary
    const newDuplicates = duplicates.map(group => {
      if (group.paths.includes(oldPath)) {
        return {
          ...group,
          paths: group.paths.map(p => p === oldPath ? newPath : p).sort()
        };
      }
      return group;
    });
    setDuplicates(newDuplicates);
    
    // Update selected details so modal updates
    setSelectedFileDetails({
      ...selectedFileDetails,
      file_name: newName,
      relative_path: newPath,
      extension: newExt,
      category: getFileCategory(newName, newExt, selectedFileDetails.mime_type)
    });
    setIsRenaming(false);
  };

  const handleAiOrganize = async () => {
    if (!inventory) return;
    setIsAiLoading(true);
    setAiSuggestion(null);
    try {
      const response = await fetch('/api/ai/organize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: inventory })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI request failed');
      
      setAiSuggestion(data.suggestion);
    } catch (err: any) {
      console.error(err);
      setAiSuggestion(err.message || "Failed to generate AI suggestion. Please check if the GEMINI_API_KEY is configured.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSmartKeep = (criteria: 'oldest' | 'newest' | 'keyword') => {
    if (!inventory) return;
    const newSelected = new Set(selectedPaths);
    
    duplicates.forEach(group => {
      const groupRows = group.paths.map(p => inventory.find(r => r.relative_path === p)).filter(Boolean) as InventoryRow[];
      if (groupRows.length < 2) return;
      
      if (criteria === 'oldest') {
        groupRows.sort((a, b) => new Date(a.modified_utc).getTime() - new Date(b.modified_utc).getTime());
        // Keep oldest (index 0), select rest
        for (let i = 1; i < groupRows.length; i++) newSelected.add(groupRows[i].relative_path);
      } else if (criteria === 'newest') {
        groupRows.sort((a, b) => new Date(b.modified_utc).getTime() - new Date(a.modified_utc).getTime());
        // Keep newest (index 0), select rest
        for (let i = 1; i < groupRows.length; i++) newSelected.add(groupRows[i].relative_path);
      } else if (criteria === 'keyword' && smartKeepKeyword.trim()) {
        const keyword = smartKeepKeyword.trim().toLowerCase();
        const hasKeyword = groupRows.some(r => r.file_name.toLowerCase().includes(keyword));
        if (hasKeyword) {
          groupRows.forEach(r => {
            if (!r.file_name.toLowerCase().includes(keyword)) {
              newSelected.add(r.relative_path);
            }
          });
        }
      }
    });
    
    setSelectedPaths(newSelected);
    setViewMode('flat');
    setShowSmartKeep(false);
  };

  const handleBulkDelete = () => {
    if (!inventory) return;
    const newInventory = inventory.filter(row => !selectedPaths.has(row.relative_path));
    
    // Recalculate duplicates
    const grouped = new Map<string, InventoryRow[]>();
    newInventory.forEach(row => {
      if (row.sha256 && !row.error) {
        if (!grouped.has(row.sha256)) {
          grouped.set(row.sha256, []);
        }
        grouped.get(row.sha256)!.push(row);
      }
    });
    
    const dups: DuplicateGroup[] = [];
    grouped.forEach((groupRows, hash) => {
      if (groupRows.length > 1) {
        dups.push({
          sha256: hash,
          size_bytes: groupRows[0].size_bytes,
          count: groupRows.length,
          paths: groupRows.map(r => r.relative_path).sort()
        });
      }
    });
    
    dups.sort((a, b) => b.count - a.count || b.size_bytes - a.size_bytes);
    
    setInventory(newInventory);
    setDuplicates(dups);
    setSelectedPaths(new Set());
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#64748b'];

  const commandPaletteItems: CommandItem[] = [
    {
      id: 'select-folder',
      title: 'Select Folder to Inventory',
      category: 'Actions',
      icon: <FolderSearch className="w-4 h-4" />,
      shortcut: 'Ctrl+O',
      perform: () => fileInputRef.current?.click(),
    },
    {
      id: 'view-overview',
      title: 'Go to Workspace Overview',
      category: 'Navigation',
      icon: <LayoutDashboard className="w-4 h-4" />,
      perform: () => {
        setDesktopModule('overview');
        setMobileTab('overview');
      },
    },
    {
      id: 'view-files',
      title: 'Go to File Explorer',
      category: 'Navigation',
      icon: <FolderTree className="w-4 h-4" />,
      perform: () => {
        setDesktopModule('files');
        setMobileTab('files');
      },
    },
    {
      id: 'view-duplicates',
      title: 'Go to Duplicate Resolution',
      category: 'Navigation',
      icon: <Copy className="w-4 h-4" />,
      shortcut: 'Ctrl+D',
      perform: () => {
        setDesktopModule('duplicates');
        setMobileTab('duplicates');
      },
    },
    {
      id: 'view-insights',
      title: 'Go to Insights & Charts',
      category: 'Navigation',
      icon: <PieChart className="w-4 h-4" />,
      perform: () => {
        setDesktopModule('insights');
        setMobileTab('insights');
      },
    },
    {
      id: 'view-deps',
      title: 'Go to Dependency Map',
      category: 'Navigation',
      icon: <GitCompare className="w-4 h-4" />,
      perform: () => {
        setViewMode('deps');
        setDesktopModule('deps');
      },
    },
    {
      id: 'advanced-export',
      title: 'Open Advanced Export Menu',
      category: 'Export',
      icon: <Download className="w-4 h-4" />,
      shortcut: 'Ctrl+E',
      perform: () => setShowExportOptionsModal(true),
    },
    {
      id: 'copy-markdown-table',
      title: 'Copy as Markdown Table (Filtered)',
      category: 'Export',
      icon: <Table className="w-4 h-4 text-indigo-400" />,
      perform: copyAsMarkdownTable,
    },
    {
      id: 'download-hashes-txt',
      title: 'Download Filtered Hashes (TXT)',
      category: 'Export',
      icon: <FileText className="w-4 h-4" />,
      perform: downloadHashesTXT,
    },
    {
      id: 'download-csv',
      title: 'Download inventory.csv',
      category: 'Export',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      perform: () => downloadCSV('filtered'),
    },
    {
      id: 'download-json',
      title: 'Download duplicates.json',
      category: 'Export',
      icon: <FileJson className="w-4 h-4" />,
      perform: downloadJSON,
    },
    {
      id: 'batch-validate',
      title: 'Validate File Hashes',
      category: 'Actions',
      icon: <AlertTriangle className="w-4 h-4" />,
      perform: handleBatchValidate,
    },
    {
      id: 'ai-organize',
      title: 'Run AI Organize Suggestion',
      category: 'Actions',
      icon: <Wand2 className="w-4 h-4" />,
      perform: handleAiOrganize,
    },
    {
      id: 'toggle-inspector',
      title: 'Toggle Inspector & Action Panel',
      category: 'View',
      icon: <PanelRightClose className="w-4 h-4" />,
      shortcut: 'Ctrl+I',
      perform: () => setIsInspectorOpen(prev => !prev),
    },
    {
      id: 'governance-audit',
      title: 'Operational Governance & Sign-Off Matrix',
      category: 'View',
      icon: <ShieldCheck className="w-4 h-4" />,
      perform: () => setShowGovernanceModal(true),
    },
    {
      id: 'open-preferences',
      title: 'Preferences',
      category: 'View',
      icon: <Settings className="w-4 h-4" />,
      perform: () => setShowPreferences(true),
    },
    {
      id: 'open-settings',
      title: 'Configuration Export',
      category: 'View',
      icon: <Settings className="w-4 h-4" />,
      perform: () => setShowConfigModal(true),
    },
    {
      id: 'filter-recent-files',
      title: 'Filter: Recent Files (< 30 days)',
      category: 'Actions',
      icon: <Clock className="w-4 h-4 text-emerald-400" />,
      perform: () => {
        setSelectedAgeBracket('recent');
        setDesktopModule('files');
        setMobileTab('files');
        addToast('Filtered to Recent files (< 30 days)', 'info');
      },
    },
    {
      id: 'filter-stale-files',
      title: 'Filter: Stale / Obsolete Files (> 1 year)',
      category: 'Actions',
      icon: <Clock className="w-4 h-4 text-rose-400" />,
      perform: () => {
        setSelectedAgeBracket('stale');
        setDesktopModule('files');
        setMobileTab('files');
        addToast('Filtered to Stale files (> 1 year)', 'info');
      },
    },
    {
      id: 'clear-date-filter',
      title: 'Clear Date Age Filter',
      category: 'Actions',
      icon: <Clock className="w-4 h-4" />,
      perform: () => {
        setSelectedAgeBracket(null);
        addToast('Cleared date age filter', 'info');
      },
    },
    {
      id: 'reset-workspace',
      title: 'Reset Workspace',
      category: 'Actions',
      icon: <RefreshCw className="w-4 h-4" />,
      perform: handleRefresh,
    },
    {
      id: 'filter-cat-source',
      title: 'Filter Category: Source Code',
      category: 'Actions',
      icon: <FileCode className="w-4 h-4 text-emerald-400" />,
      perform: () => {
        setCategoryFilters(new Set(['Source Code']));
        setDesktopModule('files');
        setMobileTab('files');
        addToast('Filtered to Source Code files', 'info');
      },
    },
    {
      id: 'filter-cat-docs',
      title: 'Filter Category: Documentation',
      category: 'Actions',
      icon: <FileText className="w-4 h-4 text-sky-400" />,
      perform: () => {
        setCategoryFilters(new Set(['Documentation']));
        setDesktopModule('files');
        setMobileTab('files');
        addToast('Filtered to Documentation files', 'info');
      },
    },
    {
      id: 'filter-cat-config',
      title: 'Filter Category: Configuration',
      category: 'Actions',
      icon: <Settings className="w-4 h-4 text-amber-400" />,
      perform: () => {
        setCategoryFilters(new Set(['Configuration']));
        setDesktopModule('files');
        setMobileTab('files');
        addToast('Filtered to Configuration files', 'info');
      },
    },
    {
      id: 'filter-cat-assets',
      title: 'Filter Category: Assets',
      category: 'Actions',
      icon: <ImageIcon className="w-4 h-4 text-violet-400" />,
      perform: () => {
        setCategoryFilters(new Set(['Assets']));
        setDesktopModule('files');
        setMobileTab('files');
        addToast('Filtered to Assets files', 'info');
      },
    },
    {
      id: 'clear-category-filters',
      title: 'Clear Category Filters',
      category: 'Actions',
      icon: <X className="w-4 h-4" />,
      perform: () => {
        setCategoryFilters(new Set());
        addToast('Cleared category filters', 'info');
      },
    }
  ];

  return (
    <div className="h-[100dvh] min-h-[100dvh] flex flex-col bg-zinc-950 text-zinc-300 font-sans selection:bg-indigo-500/30 overflow-hidden app-viewport">
      {/* Universal Responsive Top Navigation Bar */}
      <header className="h-14 sm:h-16 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 safe-top-padding">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100 text-sm sm:text-base tracking-tight leading-tight">
                Structure Architecture
              </span>
              {inventory && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {inventory.length} Files
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs text-zinc-500 hidden sm:inline">
              Deterministic Content Inspector & Analytics
            </span>
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors interactive-element"
            title="Open Command Palette (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Search commands & actions...</span>
            <span className="md:hidden">Search</span>
            <kbd className="hidden sm:inline text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded ml-1">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Action Icons & Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowGovernanceModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-colors"
            title="Operational Governance Verification Sign-off"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden lg:inline">Audit Sign-off</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing}
            className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 shadow-sm interactive-element disabled:opacity-50"
          >
            {processing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FolderSearch className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{processing ? 'Hashing...' : 'Select Folder'}</span>
          </button>

          {/* Right Inspector Toggle for Desktop */}
          <button
            onClick={() => setIsInspectorOpen(prev => !prev)}
            className={`hidden xl:flex items-center p-2 rounded-xl border transition-colors ${
              isInspectorOpen
                ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Right Inspector Panel (Ctrl+I)"
          >
            {isInspectorOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 3-Pane Ergonomic Shell */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Desktop Sidebar */}
        <DesktopSidebar
          activeModule={desktopModule}
          onSelectModule={(mod) => {
            setDesktopModule(mod);
            if (mod === 'deps') setViewMode('deps');
            else setViewMode('flat');
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          onSelectFolder={() => fileInputRef.current?.click()}
          onOpenQuickStart={() => setShowQuickStart(true)}
          onOpenCompare={() => setShowCompareModal(true)}
          onBatchValidate={handleBatchValidate}
          onOpenPreferences={() => setShowPreferences(true)}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onOpenGovernance={() => setShowGovernanceModal(true)}
          totalFiles={inventory ? inventory.length : 0}
          duplicateCount={duplicates.length}
          isProcessing={processing}
        />

        {/* Central Analytics Canvas */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-28 lg:pb-8 custom-scrollbar">
          {/* Hidden File Input always mounted for toolbar/command trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            // @ts-ignore - webkitdirectory is non-standard but widely supported
            webkitdirectory=""
            directory=""
            multiple
          />

          {/* Initial Input Area when no workspace is active */}
          {!inventory && !processing && (
            <>
              <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 border border-zinc-700/50 shadow-inner">
                  <FolderArchive className="w-8 h-8 text-zinc-400" />
                </div>
                
                <h2 className="text-lg font-medium text-zinc-200 mb-2">Inspect Workspace Directory</h2>
                <p className="text-zinc-500 text-sm mb-6 max-w-md">
                  Select a local folder to inventory. Processing happens securely in your browser—no files are uploaded to any server.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4 mb-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processing}
                    className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2"
                  >
                    <FolderSearch className="w-4 h-4" />
                    Select Folder to Inventory
                  </button>

                  <button
                    onClick={() => setShowQuickStart(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-zinc-700"
                  >
                    <Search className="w-4 h-4 text-zinc-400" />
                    Quick Start Guide
                  </button>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-zinc-200 mb-2">Organization Strategy</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Group files by functional domains (e.g., frontend, backend, docs) rather than by type (e.g., controllers, views) to improve discoverability and modularity in large workspaces.
                </p>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-zinc-200 mb-2">Duplicate Resolution</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  The system calculates SHA-256 hashes for all files to identify exact matches. Clean up duplicates to free up storage and reduce redundancy in your backup procedures.
                </p>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-zinc-200 mb-2">AI Organization</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Once your directory is scanned, use the AI Organize tool to generate a logical folder structure based on your specific project files and conventions.
                </p>
              </div>
            </div>
            </>
          )}

          {/* Progress */}
          {processing && (
            <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-2 text-sm text-zinc-400">
                <span>Processing {progress.current} of {progress.total} files</span>
                <span className="text-indigo-400 font-medium">{Math.round((progress.current / (progress.total || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-3 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-zinc-500 truncate" title={progress.currentFile}>
                Hashing: <span className="text-zinc-300">{progress.currentFile}</span>
              </p>
            </section>
          )}

          {/* Results Dashboard */}
          {inventory && !processing && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
              
              {/* Navigation Tabs (Quick View Mode Toggle) */}
              <div className="flex items-center gap-4 border-b border-zinc-800">
                <button
                  onClick={() => {
                    setViewMode('flat');
                    setDesktopModule('overview');
                  }}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${viewMode === 'flat' && desktopModule !== 'deps' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                  Workspace Dashboard
                </button>
                <button
                  onClick={() => {
                    setViewMode('deps');
                    setDesktopModule('deps');
                  }}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${viewMode === 'deps' || desktopModule === 'deps' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                  Dependency Map
                </button>
              </div>

              {(viewMode === 'deps' || desktopModule === 'deps') ? (
                <DependencyMap inventory={inventory} fileObjects={fileObjectsRef.current} />
              ) : (
                <>
                  {/* Overview Section: Metrics & Action Bar */}
                  <div className={`${mobileTab === 'overview' ? 'block' : 'hidden'} ${desktopModule === 'overview' ? 'lg:block' : 'lg:hidden'} space-y-6`}>
                    {/* Metrics Grid */}
                    <div id="stats-container" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                      <p className="text-sm text-zinc-500 mb-1 font-medium">Total Files</p>
                      <p className="text-2xl text-zinc-100 font-light"><CountUp end={inventory.length} /></p>
                    </div>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                      <p className="text-sm text-zinc-500 mb-1 font-medium">Total Size</p>
                      <p className="text-2xl text-zinc-100 font-light"><CountUp end={totalSize} formatFn={formatBytes} /></p>
                    </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <p className="text-sm text-zinc-500 mb-1 font-medium flex justify-between items-center">
                    Duplicate Groups
                    {duplicates.length > 0 && (
                      <button 
                        onClick={() => {
                          const newSelection = new Set(selectedPaths);
                          let added = 0;
                          duplicates.forEach(d => {
                            d.paths.forEach(p => {
                              newSelection.add(p);
                              added++;
                            });
                          });
                          setSelectedPaths(newSelection);
                          addToast(`Selected ${added} duplicate files`, 'success');
                        }}
                        className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded transition-colors"
                      >
                        Select All
                      </button>
                    )}
                  </p>
                  <p className="text-2xl text-rose-400 font-light"><CountUp end={duplicates.length} /></p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <p className="text-sm text-zinc-500 mb-1 font-medium">Wasted Space</p>
                  <p className="text-2xl text-rose-400 font-light"><CountUp end={duplicateSize} formatFn={formatBytes} /></p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <p className="text-sm text-zinc-500 mb-1 font-medium">Avg Hash Time</p>
                  <p className="text-2xl text-zinc-100 font-light">
                    {hashCalculationTimes.count > 0 
                      ? <CountUp end={Math.round(hashCalculationTimes.totalTime / hashCalculationTimes.count)} formatFn={(v) => v + ' ms'} /> 
                      : '0 ms'}
                  </p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <p className="text-sm text-zinc-500 mb-1 font-medium flex justify-between items-center">
                    Empty Files
                    {emptyFiles.length > 0 && (
                      <button 
                        onClick={() => {
                          const newSelection = new Set(selectedPaths);
                          emptyFiles.forEach(f => newSelection.add(f.relative_path));
                          setSelectedPaths(newSelection);
                          const el = document.getElementById('table-top');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-indigo-400 hover:text-indigo-300 text-xs border border-indigo-500/30 px-2 py-0.5 rounded-full"
                      >
                        Select All
                      </button>
                    )}
                  </p>
                  <p className="text-2xl text-amber-400 font-light">{emptyFiles.length}</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <p className="text-sm text-zinc-500 mb-1 font-medium">Avg Files/Folder</p>
                  <p className="text-2xl text-zinc-100 font-light">{averageFilesPerFolder}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[140px] relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    Exports <ChevronDown className="w-3 h-3 text-zinc-500" />
                  </button>
                  {showExportMenu && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowExportMenu(false)} />
                      <div className="absolute top-full left-0 min-w-[230px] w-full sm:w-60 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-30 animate-in fade-in zoom-in-95">
                        <button 
                          onClick={copyAsMarkdownTable} 
                          className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center justify-between group"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <Table className="w-4 h-4 text-indigo-400" />
                            Copy as Markdown Table
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 group-hover:bg-zinc-700">MD</span>
                        </button>
                        <div className="h-px bg-zinc-800 my-1" />
                        <button onClick={() => { downloadCSV('filtered'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                          Download inventory.csv
                        </button>
                        <button onClick={() => { downloadJSON(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                          Download duplicates.json
                        </button>
                        <button onClick={() => { downloadFilteredJSON(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                          Export Filtered View (JSON)
                        </button>
                        <button onClick={() => { exportPDF(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                          Export PDF Report
                        </button>
                        <button onClick={() => { downloadSummary(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                          Download Summary (TXT)
                        </button>
                        <button onClick={() => { downloadHashesTXT(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                          Download Hashes (TXT)
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowCompareModal(true)}
                  className="flex-1 min-w-[140px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                >
                  <GitCompare className="w-4 h-4 text-sky-400" />
                  Compare Workspace
                </button>
                <button
                  onClick={handleBatchValidate}
                  className="flex-1 min-w-[140px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Validate Hashes
                </button>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="flex-1 min-w-[140px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                >
                  <Settings className="w-4 h-4 text-zinc-400" />
                  Settings
                </button>
                <button
                  onClick={handleRefresh}
                  className="flex-none bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </button>
              </div>

              {/* Mobile Duplicates Quick Action Card */}
              {duplicates.length > 0 && (
                <div className="lg:hidden p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-rose-300 flex items-center gap-1.5">
                      <Copy className="w-4 h-4" />
                      {duplicates.length} Duplicate Groups
                    </div>
                    <div className="text-xs text-rose-400/80">
                      Wasting {formatBytes(duplicateSize)} of disk space
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileTab('duplicates')}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors"
                  >
                    Review
                  </button>
                </div>
              )}
            </div>

            {/* Charts & Visual Analytics Section */}
            <div id="charts-container" className={`${mobileTab === 'insights' ? 'block' : 'hidden'} ${(desktopModule === 'insights' || desktopModule === 'overview') ? 'lg:block' : 'lg:hidden'} space-y-6 mt-6`}>
              {/* Charts Section Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  Workspace Insights
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowExportOptionsModal(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Advanced Export
                  </button>
                  <button
                    onClick={handleAiOrganize}
                    disabled={isAiLoading || !inventory}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    AI Organize Suggestion
                  </button>
                </div>
              </div>

              {aiSuggestion && (
                <div className="bg-zinc-900/80 border border-indigo-500/30 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Wand2 className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-medium text-zinc-200">AI Organization Suggestion</h3>
                  </div>
                  <div className="prose prose-invert max-w-none text-sm text-zinc-300">
                    <pre className="whitespace-pre-wrap font-sans text-sm bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">{aiSuggestion}</pre>
                  </div>
                </div>
              )}

              <div id="charts-container" className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-zinc-950 p-2 -mx-2 rounded-xl">
                {/* File Modification Date Distribution Histogram */}
                <div className="lg:col-span-2">
                  <ModificationDateChart
                    inventory={inventory || []}
                    selectedAgeBracket={selectedAgeBracket}
                    onSelectAgeBracket={(bracketId) => {
                      setSelectedAgeBracket(bracketId);
                      if (bracketId) {
                        const bracket = AGE_BRACKETS.find(b => b.id === bracketId);
                        addToast(`Filtered inventory to ${bracket?.label || bracketId}`, 'info');
                      } else {
                        addToast('Cleared date modification filter', 'info');
                      }
                    }}
                    onNavigateToExplorer={() => {
                      setDesktopModule('files');
                      setMobileTab('files');
                    }}
                  />
                </div>

                {/* SHA-256 Hash Collision Frequency & Cluster Analysis */}
                <div className="lg:col-span-2">
                  <HashCollisionChart
                    inventory={inventory || []}
                    selectedHash={selectedCollisionHash}
                    onSelectHash={(hash) => {
                      setSelectedCollisionHash(hash);
                      if (hash) {
                        setFileSearch(hash);
                        addToast(`Filtered inventory by SHA-256: ${hash.slice(0, 8)}...`, 'info');
                      } else {
                        setSelectedCollisionHash(null);
                      }
                    }}
                    onNavigateToDuplicates={() => {
                      setDesktopModule('duplicates');
                      setMobileTab('duplicates');
                    }}
                    onNavigateToExplorer={() => {
                      setDesktopModule('files');
                      setMobileTab('files');
                    }}
                    onApplyFilter={(filterTerm) => {
                      setFileSearch(filterTerm);
                      setDesktopModule('files');
                      setMobileTab('files');
                      addToast(`Filtered inventory by SHA-256: ${filterTerm.slice(0, 8)}...`, 'info');
                    }}
                  />
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-zinc-200 mb-6">File Extension Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={visibleExtensionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          onClick={(entry) => {
                            if (entry && entry.name) {
                              const newFilters = new Set(extensionFilters);
                              if (newFilters.has(entry.name)) {
                                newFilters.delete(entry.name);
                              } else {
                                newFilters.add(entry.name);
                              }
                              setExtensionFilters(newFilters);
                              addToast(`Toggled filter for ${entry.name}`, 'info');
                            }
                          }}
                          className="cursor-pointer"
                        >
                          {visibleExtensionData.map((entry, index) => {
                            const originalIndex = extensionData.findIndex(d => d.name === entry.name);
                            return <Cell key={`cell-${index}`} fill={COLORS[originalIndex % COLORS.length]} />;
                          })}
                        </Pie>
                                                <RechartsLegend 
                          layout="vertical" verticalAlign="middle" align="right"
                          payload={extensionData.map((entry, index) => ({
                            id: entry.name,
                            type: 'square',
                            value: entry.name,
                            color: hiddenExtensions.has(entry.name) ? '#52525b' : COLORS[index % COLORS.length]
                          }))}
                          onClick={(e: any) => {
                            if (!e || !e.value) return;
                            setHiddenExtensions((prev: Set<string>) => {
                              const newSet = new Set(prev);
                              if (newSet.has(e.value)) newSet.delete(e.value);
                              else newSet.add(e.value);
                              return newSet;
                            });
                          }}
                          wrapperStyle={{ cursor: 'pointer', fontSize: '12px', color: '#a1a1aa' }}
                        />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          itemStyle={{ color: '#e4e4e7' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-zinc-200 mb-6">File Size Histogram</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sizeHistogramData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          cursor={{ fill: '#27272a' }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-zinc-200 mb-6">Redundancy Overview</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={hashDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#f43f5e" />
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          itemStyle={{ color: '#e4e4e7' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-zinc-200 mb-6">Most Duplicated Content</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={duplicateFrequencyData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                        <XAxis type="number" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} width={80} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          cursor={{ fill: '#27272a' }}
                        />
                        <Bar dataKey="copies" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Treemap */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 lg:col-span-2">
                  <h3 className="text-sm font-medium text-zinc-200 mb-6">Directory Size Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap
                        data={treemapData}
                        dataKey="size"
                        aspectRatio={4 / 3}
                        stroke="#18181b"
                        fill="#6366f1"
                      >
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          itemStyle={{ color: '#e4e4e7' }}
                          formatter={(value: any, name: any, item: any) => [
                            formatBytes(Number(value) || 0),
                            item?.payload?.fileName || name
                          ]}
                        />
                      </Treemap>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Duplicates Resolution Section */}
            <div className={`${mobileTab === 'duplicates' ? 'block' : 'hidden'} ${(desktopModule === 'duplicates' || desktopModule === 'overview') ? 'lg:block' : 'lg:hidden'} space-y-6 mt-6`}>
              {/* Duplicates List */}
              {duplicates.length > 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Exact Duplicates Identified
                      <span className="ml-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {duplicates.length}
                      </span>
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowCleanupHistory(true)}
                        className="flex items-center gap-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <History className="w-3 h-3" />
                        Cleanup History
                      </button>
                      <button
                        onClick={() => {
                          setShowCleanupModal(true);
                          setCleanupStep(0);
                        }}
                        className="flex items-center gap-2 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Duplicate Cleanup
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setShowSmartKeep(!showSmartKeep)}
                          className="flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Smart Keep <ChevronDown className="w-3 h-3" />
                        </button>
                        {showSmartKeep && (
                          <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 py-2">
                            <div className="px-4 py-2 border-b border-zinc-800/50">
                              <p className="text-xs text-zinc-400">Select copies to KEEP. Others will be selected for removal.</p>
                            </div>
                            <button
                              onClick={() => handleSmartKeep('oldest')}
                              className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300"
                            >
                              Keep Oldest File
                            </button>
                            <button
                              onClick={() => handleSmartKeep('newest')}
                              className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300"
                            >
                              Keep Newest File
                            </button>
                            <div className="px-4 py-2 mt-1 border-t border-zinc-800/50">
                              <label className="text-xs text-zinc-500 block mb-1">Keep by keyword in name</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g. final"
                                  value={smartKeepKeyword}
                                  onChange={e => setSmartKeepKeyword(e.target.value)}
                                  className="flex-1 bg-zinc-950 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  onClick={() => handleSmartKeep('keyword')}
                                  disabled={!smartKeepKeyword.trim()}
                                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-2 py-1 rounded text-xs transition-colors"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mr-2">
                        <label className="text-xs text-zinc-400 cursor-pointer flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={hideMarkedForCleanup}
                            onChange={(e) => setHideMarkedForCleanup(e.target.checked)}
                            className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                          />
                          Hide selected
                        </label>
                      </div>
                      <div className="relative">
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          placeholder="Search pattern..." 
                          value={duplicateSearch}
                          onChange={e => setDuplicateSearch(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 w-48"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-zinc-800/50 max-h-[400px] overflow-y-auto">
                    {filteredDuplicates.map((group, idx) => (
                      <div key={group.sha256} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-2.5 py-1 rounded-md font-medium">
                              {group.count} copies
                            </span>
                            <span className="text-xs text-zinc-500 font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                              {group.sha256.substring(0, 12)}...
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-zinc-400 font-medium">
                              {formatBytes(group.size_bytes)} each
                            </span>
                            <button
                              onClick={() => {
                                // keep one file, delete others
                                const filesToDelete = group.paths.slice(1);
                                const cmd = `rm -rf ${filesToDelete.map(p => `"${p}"`).join(' ')}`;
                                navigator.clipboard.writeText(cmd);
                              }}
                              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-700 transition-colors flex items-center gap-1.5"
                              title="Copy rm -rf command for redundant copies (keeps the first file)"
                            >
                              <Copy className="w-3 h-3" /> Cmd
                            </button>
                          </div>
                        </div>
                        <ul className="space-y-2 bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                          {group.paths.map((path, pIdx) => (
                            <li key={pIdx} className="text-sm text-zinc-400 font-mono flex items-start gap-2 break-all">
                              <span className="text-zinc-600 select-none">↳</span> {path}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center flex flex-col items-center">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
                  <h3 className="text-zinc-200 font-medium text-lg">Clean Architecture</h3>
                  <p className="text-zinc-500 text-sm mt-1 max-w-sm">No exact duplicates were found in this directory. The structure is optimal.</p>
                </div>
              )}
            </div>

            {/* Full File Inventory Table & Tree Section */}
            <div className={`${mobileTab === 'files' ? 'block' : 'hidden'} ${(desktopModule === 'files' || desktopModule === 'overview') ? 'lg:block' : 'lg:hidden'} space-y-4 mt-6`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-indigo-400" />
                  File Explorer
                </h2>
                <div className="flex items-center gap-4 text-sm text-zinc-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={filterOnlyDuplicates}
                      onChange={e => setFilterOnlyDuplicates(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                    />
                    Only show duplicates
                  </label>
                </div>
              </div>

              {/* Mobile Segmented Switcher between Tree & Table */}
              <div className="lg:hidden flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-2">
                <button
                  onClick={() => setMobileShowTree(true)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 min-h-[44px] ${
                    mobileShowTree ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <FolderTree className="w-4 h-4" />
                  Directory Tree
                </button>
                <button
                  onClick={() => setMobileShowTree(false)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 min-h-[44px] ${
                    !mobileShowTree ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  File Table ({sortedInventory.length})
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 mt-4">
                {/* Tree Sidebar */}
                <div className={`${mobileShowTree ? 'block' : 'hidden'} lg:block lg:w-1/3 flex-shrink-0`}>
                  <DirectoryTree 
                    inventory={inventory} 
                    duplicateHashes={new Set(duplicates.map(d => d.sha256))} 
                    initialSearchTerm={treeSearchTerm}
                    selectedPath={selectedTreePath}
                    onSelectPath={(path) => {
                      // Filter the list by this path
                      setFileSearch(path);
                    }} 
                  />
                </div>

                {/* List View */}
                <div className={`${!mobileShowTree ? "flex" : "hidden"} lg:flex lg:w-2/3 flex-grow flex-col bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden`}>
                  <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-400" />
                        File Inventory ({sortedInventory.length})
                      </h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      <div className="flex flex-col gap-1 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                            id="searchInput"
                            type="text" 
                            placeholder="Fuzzy search files, paths, types..." 
                            value={fileSearchInput}
                            onChange={e => setFileSearchInput(e.target.value)}
                            className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg pl-9 pr-14 py-1.5 focus:outline-none focus:border-indigo-500 w-full"
                          />
                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {isSearchDebouncing && (
                              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" title="Applying 150ms debounce" />
                            )}
                            {fileSearchInput && (
                              <button 
                                onClick={() => handleSetSearch('')}
                                className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
                                title="Clear search"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {fileSearch.includes('/') && <Breadcrumbs path={fileSearch} onNavigate={handleSetSearch} />}
                      </div>

                      {/* Age Bracket Filter Menu */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            setShowAgeMenu(!showAgeMenu);
                            setShowCategoryMenu(false);
                            setShowExtMenu(false);
                            setShowMimeMenu(false);
                            setShowSortMenu(false);
                            setShowColumnMenu(false);
                          }}
                          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                            selectedAgeBracket 
                              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30 font-medium' 
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Age {selectedAgeBracket && `(1)`}</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {showAgeMenu && (
                          <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-30 py-1">
                            <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                              <span>Filter by Modification Age</span>
                              {selectedAgeBracket && (
                                <button
                                  onClick={() => setSelectedAgeBracket(null)}
                                  className="text-indigo-400 hover:text-indigo-300"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            {AGE_BRACKETS.map(bracket => (
                              <button
                                key={bracket.id}
                                onClick={() => {
                                  setSelectedAgeBracket(selectedAgeBracket === bracket.id ? null : bracket.id);
                                  setShowAgeMenu(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-2 hover:bg-zinc-800/70 text-left text-sm transition-colors ${
                                  selectedAgeBracket === bracket.id ? 'bg-indigo-500/10 text-indigo-200' : 'text-zinc-300'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: bracket.color }} />
                                  <span>{bracket.label}</span>
                                </div>
                                {selectedAgeBracket === bracket.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Category Filter Menu */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            setShowCategoryMenu(!showCategoryMenu);
                            setShowExtMenu(false);
                            setShowMimeMenu(false);
                            setShowSortMenu(false);
                            setShowColumnMenu(false);
                          }}
                          className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                            categoryFilters.size > 0 
                              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30' 
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          Category {categoryFilters.size > 0 && `(${categoryFilters.size})`} <ChevronDown className="w-3 h-3" />
                        </button>
                        {showCategoryMenu && (
                          <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 py-1 max-h-72 overflow-y-auto">
                            <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                              <span>Filter by Category</span>
                              {categoryFilters.size > 0 && (
                                <button
                                  onClick={() => setCategoryFilters(new Set())}
                                  className="text-indigo-400 hover:text-indigo-300"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            {allCategoryCounts.map(({ name, count }) => {
                              const style = CATEGORY_STYLES[name] || CATEGORY_STYLES['Other'];
                              return (
                                <label key={name} className="flex items-center justify-between px-4 py-2 hover:bg-zinc-800/70 cursor-pointer text-sm text-zinc-300">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={categoryFilters.has(name)}
                                      onChange={(e) => {
                                        const newCats = new Set(categoryFilters);
                                        if (e.target.checked) newCats.add(name);
                                        else newCats.delete(name);
                                        setCategoryFilters(newCats);
                                      }}
                                      className="mr-3 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: style.dotColor }} />
                                      <span>{name}</span>
                                    </span>
                                  </div>
                                  <span className="text-zinc-500 text-xs bg-zinc-950 px-1.5 py-0.5 rounded">{count}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => {
                            setShowExtMenu(!showExtMenu);
                            setShowCategoryMenu(false);
                            setShowMimeMenu(false);
                          }}
                          className="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors"
                        >
                          Extensions {extensionFilters.size > 0 && `(${extensionFilters.size})`} <ChevronDown className="w-3 h-3" />
                        </button>
                        {showExtMenu && (
                          <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 py-1 max-h-64 overflow-y-auto">
                            {allExtensionCounts.map(({ name, count }) => (
                              <label key={name} className="flex items-center justify-between px-4 py-2 hover:bg-zinc-800 cursor-pointer text-sm text-zinc-300">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={extensionFilters.has(name)}
                                    onChange={(e) => {
                                      const newExt = new Set(extensionFilters);
                                      if (e.target.checked) newExt.add(name);
                                      else newExt.delete(name);
                                      setExtensionFilters(newExt);
                                    }}
                                    className="mr-3 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <span className="truncate max-w-[100px]">{name}</span>
                                </div>
                                <span className="text-zinc-500 text-xs bg-zinc-950 px-1.5 py-0.5 rounded">{count}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => {
                            setShowMimeMenu(!showMimeMenu);
                            setShowCategoryMenu(false);
                            setShowExtMenu(false);
                          }}
                          className="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors"
                        >
                          Mime-Type {mimeTypeFilters.size > 0 && `(${mimeTypeFilters.size})`} <ChevronDown className="w-3 h-3" />
                        </button>
                        {showMimeMenu && (
                          <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 py-1 max-h-64 overflow-y-auto">
                            {allMimeTypeCounts.map(({ name, count }) => (
                              <label key={name} className="flex items-center justify-between px-4 py-2 hover:bg-zinc-800 cursor-pointer text-sm text-zinc-300">
                                <div className="flex items-center truncate mr-2">
                                  <input
                                    type="checkbox"
                                    checked={mimeTypeFilters.has(name)}
                                    onChange={(e) => {
                                      const newMime = new Set(mimeTypeFilters);
                                      if (e.target.checked) newMime.add(name);
                                      else newMime.delete(name);
                                      setMimeTypeFilters(newMime);
                                    }}
                                    className="mr-3 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer shrink-0"
                                  />
                                  <span className="truncate max-w-[130px]" title={name}>{name}</span>
                                </div>
                                <span className="text-zinc-500 text-xs bg-zinc-950 px-1.5 py-0.5 rounded shrink-0">{count}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 bg-zinc-950 p-1.5 px-3 rounded-lg border border-zinc-800 shrink-0">
                        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={highlightDuplicates}
                            onChange={e => setHighlightDuplicates(e.target.checked)}
                            className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                          />
                          Highlight Duplicates
                        </label>
                        <div className="w-px h-4 bg-zinc-800"></div>
                        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={codeFilesOnly}
                            onChange={e => setCodeFilesOnly(e.target.checked)}
                            className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                          />
                          Code Files Only
                        </label>
                      </div>

                      <div className="flex items-center gap-2 text-sm bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                        <input 
                          type="date" 
                          value={dateStart}
                          onChange={e => setDateStart(e.target.value)}
                          className="bg-transparent border-none text-zinc-300 focus:ring-0 text-sm px-2"
                        />
                        <span className="text-zinc-500">-</span>
                        <input 
                          type="date"
                          value={dateEnd}
                          onChange={e => setDateEnd(e.target.value)}
                          className="bg-transparent border-none text-zinc-300 focus:ring-0 text-sm px-2"
                        />
                      </div>
                      
                      {selectedPaths.size > 0 && (
                        <div className="flex gap-2">
                          {selectedPaths.size === 2 && (
                            <button
                              onClick={() => setShowFileComparisonModal(true)}
                              className="flex items-center gap-2 text-sm bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/20 transition-colors"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                              Compare Files
                            </button>
                          )}
                          <button
                            onClick={() => setShowBulkTagModal(true)}
                            className="flex items-center gap-2 text-sm bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors"
                          >
                            <Tag className="w-4 h-4" />
                            Bulk Tag ({selectedPaths.size})
                          </button>
                          <button
                            onClick={handleClearTags}
                            className="flex items-center gap-2 text-sm bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/20 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Clear Tags ({selectedPaths.size})
                          </button>
                          <button
                            onClick={() => setShowBulkRenameModal(true)}
                            className="flex items-center gap-2 text-sm bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg border border-sky-500/20 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Bulk Rename ({selectedPaths.size})
                          </button>
                          <button
                            onClick={() => {
                              const paths = Array.from(selectedPaths).join('\n');
                              navigator.clipboard.writeText(paths);
                              addToast(`Copied ${selectedPaths.size} paths to clipboard`, 'success');
                            }}
                            className="flex items-center gap-2 text-sm bg-zinc-700/50 text-zinc-300 hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-600/50 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Paths ({selectedPaths.size})
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 text-sm bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Bulk Delete ({selectedPaths.size})
                          </button>
                        </div>
                      )}
                      
                      <div className="relative">
                        <button
                          onClick={() => {
                            setShowSortMenu(!showSortMenu);
                            setShowColumnMenu(false);
                            setShowExtMenu(false);
                            setShowMimeMenu(false);
                            setShowCategoryMenu(false);
                          }}
                          className="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors"
                        >
                          Sort Presets <ChevronDown className="w-3 h-3" />
                        </button>
                        {showSortMenu && (
                          <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 py-1">
                            <button onClick={() => { setSortField('size_bytes'); setSortOrder('desc'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300">Largest Files</button>
                            <button onClick={() => { setSortField('size_bytes'); setSortOrder('asc'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300">Smallest Files</button>
                            <button onClick={() => { setSortField('modified_utc'); setSortOrder('desc'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300">Newest Files</button>
                            <button onClick={() => { setSortField('modified_utc'); setSortOrder('asc'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300">Oldest Files</button>
                            <button onClick={() => { setSortField('category'); setSortOrder('asc'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300">By Category</button>
                            <button onClick={() => { setSortField('sha256'); setSortOrder('asc'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300">By Hash</button>
                            <button onClick={() => { setSortField('size_bytes'); setSortOrder('asc'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300 border-t border-zinc-800 mt-1 pt-2">Empty Files First</button>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => {
                            setShowColumnMenu(!showColumnMenu);
                            setShowSortMenu(false);
                            setShowCategoryMenu(false);
                          }}
                          className="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors"
                        >
                          Columns <ChevronDown className="w-3 h-3" />
                        </button>
                        {showColumnMenu && (
                          <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-10 py-1">
                            {Object.entries(columns).map(([key, isVisible]) => (
                              <label key={key} className="flex items-center px-4 py-2 hover:bg-zinc-800 cursor-pointer text-sm text-zinc-300">
                                <input
                                  type="checkbox"
                                  checked={isVisible as boolean}
                                  onChange={() => setColumns((prev: any) => ({ ...prev, [key]: !prev[key as keyof typeof columns] }))}
                                  className="mr-3 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500"
                                />
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Active Filter Chips Bar */}
                  {(categoryFilters.size > 0 || selectedAgeBracket || selectedCollisionHash || fileSearch.trim() || dateStart || dateEnd) && (
                    <div className="px-6 py-2 bg-zinc-900/40 border-b border-zinc-800/80 flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-zinc-500 font-medium">Active Filters:</span>

                      {selectedCollisionHash && (
                        <span 
                          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-full font-medium border bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                        >
                          <Fingerprint className="w-3 h-3 text-indigo-400" />
                          SHA-256: {selectedCollisionHash.slice(0, 8)}...
                          <button
                            onClick={() => {
                              setSelectedCollisionHash(null);
                              if (fileSearch === selectedCollisionHash) {
                                handleSetSearch('');
                              }
                            }}
                            className="p-0.5 rounded-full hover:bg-zinc-800/60 transition-colors ml-0.5"
                            title="Remove hash filter"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {selectedAgeBracket && (() => {
                        const bracket = AGE_BRACKETS.find(b => b.id === selectedAgeBracket);
                        return (
                          <span 
                            className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-full font-medium border bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                          >
                            <Clock className="w-3 h-3 text-indigo-400" />
                            Age: {bracket?.label || selectedAgeBracket}
                            <button
                              onClick={() => setSelectedAgeBracket(null)}
                              className="p-0.5 rounded-full hover:bg-zinc-800/60 transition-colors ml-0.5"
                              title="Remove age filter"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })()}

                      {fileSearch.trim() && (
                        <span 
                          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-full font-medium border bg-zinc-800 text-zinc-300 border-zinc-700"
                        >
                          <Search className="w-3 h-3 text-zinc-400" />
                          Fuzzy: "{fileSearch.trim()}"
                          <button
                            onClick={() => handleSetSearch('')}
                            className="p-0.5 rounded-full hover:bg-zinc-700 transition-colors ml-0.5"
                            title="Clear search"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}

                      {Array.from(categoryFilters).map(cat => {
                        const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES['Other'];
                        return (
                          <span 
                            key={cat}
                            className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 rounded-full font-medium border ${style.badgeClass}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dotColor }} />
                            {cat}
                            <button
                              onClick={() => {
                                const newCats = new Set(categoryFilters);
                                newCats.delete(cat);
                                setCategoryFilters(newCats);
                              }}
                              className="p-0.5 rounded-full hover:bg-zinc-800/60 transition-colors ml-0.5"
                              title={`Remove ${cat} filter`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}

                      <button
                        onClick={() => {
                          setCategoryFilters(new Set());
                          setSelectedAgeBracket(null);
                          setSelectedCollisionHash(null);
                          handleSetSearch('');
                          setDateStart('');
                          setDateEnd('');
                        }}
                        className="text-zinc-400 hover:text-zinc-200 underline ml-2"
                      >
                        Reset all filters
                      </button>
                    </div>
                  )}
                  <div id="table-top" className="overflow-x-auto overflow-y-auto max-h-[600px] border-b border-zinc-800" ref={tableContainerRef}>
                    <table className="w-full text-left text-sm whitespace-nowrap relative">
                      <thead className="bg-zinc-950/80 text-zinc-400 uppercase tracking-wider text-xs border-b border-zinc-800 sticky top-0 z-40">
                        <tr>
                          <th className="px-4 py-3 w-[50px] min-w-[50px] max-w-[50px] sticky left-0 z-30 bg-zinc-950 shadow-[1px_0_0_#27272a]">
                            <input 
                              type="checkbox" 
                              checked={sortedInventory.length > 0 && selectedPaths.size >= sortedInventory.length}
                              onChange={handleSelectAll}
                              className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                            />
                          </th>
                          {columns.thumbnail && (
                            <th className="px-2 py-3 w-[60px] min-w-[60px] max-w-[60px] text-center sticky z-30 bg-zinc-950 shadow-[1px_0_0_#27272a]" style={{ left: 50 }}>
                              <span className="sr-only">Thumbnail</span>
                            </th>
                          )}
                          {columns.fileName && (
                            <th 
                              className="px-4 py-3 cursor-pointer hover:bg-zinc-900 transition-colors select-none group sticky z-30 bg-zinc-950 shadow-[1px_0_0_#27272a,5px_0_15px_-3px_rgba(0,0,0,0.5)]"
                              style={{ left: columns.thumbnail ? 110 : 50 }}
                              onClick={() => handleSort('file_name')}
                            >
                              <div className="flex items-center gap-1.5">
                                File Name {renderSortIcon('file_name')}
                              </div>
                            </th>
                          )}
                          {columns.category && (
                            <th 
                              className="px-6 py-3 cursor-pointer hover:bg-zinc-900 transition-colors select-none group"
                              onClick={() => handleSort('category')}
                            >
                              <div className="flex items-center gap-1.5">
                                Category {renderSortIcon('category')}
                              </div>
                            </th>
                          )}
                          {columns.size && (
                            <th 
                              className="px-6 py-3 cursor-pointer hover:bg-zinc-900 transition-colors select-none group"
                              onClick={() => handleSort('size_bytes')}
                            >
                              <div className="flex items-center gap-1.5">
                                Size {renderSortIcon('size_bytes')}
                              </div>
                            </th>
                          )}
                          {columns.modified && (
                            <th 
                              className="px-6 py-3 cursor-pointer hover:bg-zinc-900 transition-colors select-none group"
                              onClick={() => handleSort('modified_utc')}
                            >
                              <div className="flex items-center gap-1.5">
                                Modified Date {renderSortIcon('modified_utc')}
                              </div>
                            </th>
                          )}
                          {columns.type && (
                            <th className="px-6 py-3">Type</th>
                          )}
                          {columns.mimeType && (
                            <th className="px-6 py-3">MIME Type</th>
                          )}
                          {columns.sha256 && (
                            <th 
                              className="px-6 py-3 cursor-pointer hover:bg-zinc-900 transition-colors select-none group"
                              onClick={() => handleSort('sha256')}
                            >
                              <div className="flex items-center gap-1.5">
                                SHA-256 {renderSortIcon('sha256')}
                              </div>
                            </th>
                          )}
                          {columns.tags && (
                            <th className="px-6 py-3">Tags</th>
                          )}
                          <th className="px-6 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {virtualizer.getVirtualItems().length > 0 ? (
                          <>
                            {virtualizer.getVirtualItems()[0]?.start > 0 && (
                              <tr><td colSpan={11} style={{ height: `${virtualizer.getVirtualItems()[0].start}px` }} /></tr>
                            )}
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                              const file = sortedInventory[virtualRow.index];
                              if (!file) return null;
                              const isDuplicate = highlightDuplicates && duplicates.some(d => d.sha256 === file.sha256);
                              const isFocused = virtualRow.index === focusedRowIndex;

                              const firstVisibleIndex = virtualizer.getVirtualItems()[0]?.index ?? 0;
                              const staggerIndex = Math.max(0, virtualRow.index - firstVisibleIndex);
                              const isInitialStagger = !shouldReduceMotion && (Date.now() - tableAnimationTimeRef.current < 900);
                              const staggerDelay = isInitialStagger ? Math.min(staggerIndex, 14) * 0.035 : 0;

                              const stickyCellBg = isFocused
                                ? (isDuplicate ? 'bg-[#281622]' : 'bg-[#151a32]')
                                : (isDuplicate ? 'bg-[#1a0f14] group-hover:bg-[#2a141d]' : 'bg-zinc-950 group-hover:bg-zinc-900');

                              return (
                              <motion.tr 
                                key={`inv-row-${tableAnimationEpoch}-${file.sha256 || 'nohash'}-${file.relative_path}`} 
                                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                                animate={shouldReduceMotion ? undefined : { 
                                  opacity: 1, 
                                  y: 0,
                                  transitionEnd: { transform: 'none' }
                                }}
                                transition={shouldReduceMotion ? undefined : {
                                  duration: 0.26,
                                  delay: staggerDelay,
                                  ease: [0.16, 1, 0.3, 1]
                                }}
                                className={`group relative duration-300 transition-all ease-out cursor-pointer ${
                                  isFocused 
                                    ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-500/15 shadow-[0_0_24px_-4px_rgba(99,102,241,0.4)] z-20' 
                                    : isDuplicate 
                                      ? 'bg-rose-500/10 hover:bg-rose-500/20 hover:shadow-lg hover:z-10' 
                                      : 'hover:bg-zinc-800/30 hover:shadow-lg hover:z-10'
                                }`}
                                onClick={() => {
                                  setFocusedRowIndex(virtualRow.index);
                                  setSelectedFileDetails(file);
                                  setIsRenaming(false);
                                  setRenameInput(file.file_name);
                                  setNotesInput(file.notes || '');
                                  setCompareHash('');
                                }}
                                data-index={virtualRow.index}
                                ref={virtualizer.measureElement}
                              >
                                <td className={`px-4 py-3 w-[50px] min-w-[50px] max-w-[50px] sticky left-0 z-20 shadow-[1px_0_0_#27272a] duration-300 transition-colors ease-out relative ${stickyCellBg}`} onClick={e => e.stopPropagation()}>
                                  {/* Smooth animated focus accent indicator bar on left edge */}
                                  <div 
                                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-r bg-indigo-500 shadow-[0_0_12px_#6366f1] transition-all duration-300 ease-out z-30 ${
                                      isFocused ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'
                                    }`} 
                                  />
                                  <input 
                                    type="checkbox" 
                                    checked={selectedPaths.has(file.relative_path)}
                                    onChange={(e) => handleSelectRow(e, file.relative_path)}
                                    className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                                  />
                                </td>
                                {columns.thumbnail && (
                                  <td className={`px-2 py-3 w-[60px] min-w-[60px] max-w-[60px] sticky z-20 shadow-[1px_0_0_#27272a] duration-300 transition-colors ease-out ${stickyCellBg}`} style={{ left: 50 }}>
                                    <Thumbnail fileInfo={file} fileObjectsRef={fileObjectsRef} />
                                  </td>
                                )}
                                {columns.fileName && (
                                  <td className={`px-4 py-3 max-w-[200px] md:max-w-[400px] sticky z-20 shadow-[1px_0_0_#27272a,5px_0_15px_-3px_rgba(0,0,0,0.5)] duration-300 transition-colors ease-out ${stickyCellBg}`} style={{ left: columns.thumbnail ? 110 : 50 }}>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 truncate" title={file.relative_path}>
                                        <span className="truncate">
                                          <HighlightText 
                                            text={file.relative_path} 
                                            query={fileSearch} 
                                            indices={(file as any)._matchPathIndices} 
                                          />
                                        </span>
                                        {(file as any)._fuzzyScore && fileSearch.trim() && (file as any)._fuzzyScore < 0.95 && (
                                          <span 
                                            className="shrink-0 text-[10px] px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono"
                                            title={`Fuzzy Match Score: ${Math.round((file as any)._fuzzyScore * 100)}%`}
                                          >
                                            ~{Math.round((file as any)._fuzzyScore * 100)}%
                                          </span>
                                        )}
                                        {file.error && (
                                          <span 
                                            className="shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 cursor-help"
                                            title={`Hash Error: ${file.error}`}
                                          >
                                            <AlertTriangle className="w-3 h-3 shrink-0" />
                                            <span>Hash Error</span>
                                          </span>
                                        )}
                                        {file.sha256 && duplicateCountsMap.has(file.sha256) && (
                                          <span className="shrink-0 bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px] font-medium" title={`${duplicateCountsMap.get(file.sha256)} total copies`}>
                                            {duplicateCountsMap.get(file.sha256)} copies
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={(e) => handleCopyPath(e, file.relative_path)}
                                          className="text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 p-1 rounded transition-colors"
                                          title="Copy Relative Path"
                                        >
                                          {copiedPath === file.relative_path ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                          ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const firstSelectedPath = selectedPaths.size === 1 ? Array.from(selectedPaths)[0] : null;
                                            const selectedFileForCompare = firstSelectedPath && inventory ? inventory.find(f => f.relative_path === firstSelectedPath) : null;
                                            const hashToPopulate = selectedFileForCompare ? selectedFileForCompare.sha256 : file.sha256;
                                            
                                            setSelectedFileDetails(file);
                                            setCompareHash(hashToPopulate || '');
                                            setIsRenaming(false);
                                          }}
                                          className="text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 p-1 rounded transition-colors"
                                          title="Compare Hash"
                                        >
                                          <Search className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                )}
                                {columns.category && (
                                  <td className="px-6 py-3">
                                    {(() => {
                                      const cat = file.category || getFileCategory(file.file_name, file.extension, file.mime_type);
                                      const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES['Other'];
                                      return (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newFilters = new Set(categoryFilters);
                                            if (newFilters.has(cat)) {
                                              newFilters.delete(cat);
                                            } else {
                                              newFilters.add(cat);
                                            }
                                            setCategoryFilters(newFilters);
                                            addToast(`Filtered by ${cat}`, 'info');
                                          }}
                                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all hover:scale-105 cursor-pointer ${style.badgeClass}`}
                                          title={`Click to filter by ${cat}`}
                                        >
                                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: style.dotColor }} />
                                          {cat}
                                        </button>
                                      );
                                    })()}
                                  </td>
                                )}
                                {columns.size && (
                                  <td className="px-6 py-3 text-zinc-400">
                                    {formatBytes(file.size_bytes)}
                                  </td>
                                )}
                                {columns.modified && (
                                  <td className="px-6 py-3 text-zinc-400">
                                    {new Date(file.modified_utc).toLocaleDateString()} {new Date(file.modified_utc).toLocaleTimeString()}
                                  </td>
                                )}
                                {columns.type && (
                                  <td className="px-6 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${
                                      (function() {
                                        const ext = file.extension?.toLowerCase() || '';
                                        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
                                        if (ext === '.json') return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
                                        if (ext === '.md') return 'text-sky-400 bg-sky-400/10 border-sky-400/20';
                                        if (['.css', '.scss'].includes(ext)) return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
                                        if (['.png', '.jpg', '.svg'].includes(ext)) return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
                                        return 'text-zinc-400 bg-zinc-800 border-zinc-700';
                                      })()
                                    }`}>
                                      {file.extension || 'none'}
                                    </span>
                                  </td>
                                )}
                                {columns.mimeType && (
                                  <td className="px-6 py-3 text-zinc-400 truncate max-w-[150px]" title={file.mime_type}>
                                    {file.mime_type || 'Unknown'}
                                  </td>
                                )}
                                {columns.sha256 && (
                                  <td className="px-6 py-3 text-zinc-400 truncate max-w-[150px] font-mono text-xs" title={file.error ? `Error: ${file.error}` : file.sha256 || ''}>
                                    {file.error ? (
                                      <span className="text-amber-400 flex items-center gap-1 cursor-help" title={`Hash Error: ${file.error}`}>
                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                        <span>Failed</span>
                                      </span>
                                    ) : (
                                      file.sha256 || 'N/A'
                                    )}
                                  </td>
                                )}
                                {columns.tags && (
                                  <td className="px-6 py-3 text-zinc-400">
                                    <div className="flex gap-1 flex-wrap">
                                      {(file.tags || []).map(tag => (
                                        <span key={tag} className="text-[10px] uppercase tracking-wider font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                )}
                                <td className="px-6 py-3 relative text-right">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setActiveRowMenu(activeRowMenu === file.relative_path ? null : file.relative_path); }}
                                    className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                                  >
                                    <span className="sr-only">Open actions</span>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                  </button>
                                  {activeRowMenu === file.relative_path && (
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden text-left" onClick={e => e.stopPropagation()}>
                                      <button 
                                        className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                                        onClick={() => {
                                          setSelectedFileDetails(file);
                                          setIsRenaming(true);
                                          setRenameInput(file.file_name);
                                          setActiveRowMenu(null);
                                        }}
                                      >Rename</button>
                                      <button 
                                        className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                                        onClick={() => {
                                          setSelectedFileDetails(file);
                                          setActiveRowMenu(null);
                                        }}
                                      >Tag</button>
                                      <button 
                                        className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-zinc-800 transition-colors"
                                        onClick={() => {
                                          setConfirmAction({
                                            title: 'Delete File',
                                            message: `Are you sure you want to delete "${file.file_name}"?`,
                                            onConfirm: () => {
                                              const newInv = inventory.filter(f => f.relative_path !== file.relative_path);
                                              setInventory(newInv);
                                              addToast(`Deleted ${file.file_name}`, 'success');
                                              setConfirmAction(null);
                                            }
                                          });
                                          setActiveRowMenu(null);
                                        }}
                                      >Delete</button>
                                    </div>
                                  )}
                                </td>
                              </motion.tr>
                              );
                            })}
                            {virtualizer.getVirtualItems().length > 0 && (
                              <tr>
                                <td colSpan={11} style={{ height: `${virtualizer.getTotalSize() - virtualizer.getVirtualItems()[virtualizer.getVirtualItems().length - 1].end}px` }} />
                              </tr>
                            )}
                          </>
                        ) : (
                          <motion.tr
                            initial={shouldReduceMotion ? false : { opacity: 0 }}
                            animate={shouldReduceMotion ? undefined : { opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td colSpan={11} className="px-6 py-12 text-center text-zinc-500 text-sm">
                              No files match your search criteria.
                            </td>
                          </motion.tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
                    <span>
                      {sortedInventory.length > 0 ? (
                        <>
                          Showing <span className="text-zinc-200 font-medium">{sortedInventory.length}</span> files
                        </>
                      ) : (
                        '0 files'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
            {/* Mobile Tools Action Grid (Visible when mobileTab === 'tools' on small screens) */}
            {mobileTab === 'tools' && (
              <div className="lg:hidden block space-y-4 animate-in fade-in duration-200">
                <div className="border-b border-zinc-800 pb-2">
                  <h3 className="text-sm font-semibold text-zinc-100">Workspace Utility Matrix</h3>
                  <p className="text-xs text-zinc-500">Fast access to reports, validation, exports, and governance.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowExportOptionsModal(true)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left min-h-[44px] active:scale-[0.99] transition-all"
                  >
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">Advanced Export</div>
                      <div className="text-xs text-zinc-500">Capture visual dashboard as PNG</div>
                    </div>
                  </button>

                  <button
                    onClick={downloadHashesTXT}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left min-h-[44px] active:scale-[0.99] transition-all"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">Hashes (TXT)</div>
                      <div className="text-xs text-zinc-500">Export filtered SHA-256 list</div>
                    </div>
                  </button>

                  <button
                    onClick={copyAsMarkdownTable}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left min-h-[44px] active:scale-[0.99] transition-all"
                  >
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                      <Table className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">Copy as Markdown Table</div>
                      <div className="text-xs text-zinc-500">Formatted Markdown of filtered files</div>
                    </div>
                  </button>

                  <button
                    onClick={() => downloadCSV('filtered')}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left min-h-[44px] active:scale-[0.99] transition-all"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">Inventory CSV</div>
                      <div className="text-xs text-zinc-500">Detailed spreadsheet export</div>
                    </div>
                  </button>

                  <button
                    onClick={downloadJSON}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left min-h-[44px] active:scale-[0.99] transition-all"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">Duplicates JSON</div>
                      <div className="text-xs text-zinc-500">Structured duplicate clusters</div>
                    </div>
                  </button>

                  <button
                    onClick={exportPDF}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left min-h-[44px] active:scale-[0.99] transition-all"
                  >
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">PDF Report</div>
                      <div className="text-xs text-zinc-500">Comprehensive printable summary</div>
                    </div>
                  </button>

                  <button
                    onClick={handleBatchValidate}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left min-h-[44px] active:scale-[0.99] transition-all"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">Validate Hashes</div>
                      <div className="text-xs text-zinc-500">Re-verify cryptographic integrity</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowCompareModal(true)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left min-h-[44px] active:scale-[0.99] transition-all"
                  >
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                      <GitCompare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">Compare Workspaces</div>
                      <div className="text-xs text-zinc-500">Differential snapshot comparison</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowGovernanceModal(true)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-left min-h-[44px] active:scale-[0.99] transition-all"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-emerald-300">Audit Sign-off</div>
                      <div className="text-xs text-emerald-400/70">Verify UI redesign requirements</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left min-h-[44px] active:scale-[0.99] transition-all"
                  >
                    <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 shrink-0">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">Settings</div>
                      <div className="text-xs text-zinc-500">Workspace & scanning configuration</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 text-left min-h-[44px] active:scale-[0.99] transition-all"
                  >
                    <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-rose-300">Reset Workspace</div>
                      <div className="text-xs text-rose-400/70">Clear loaded inventory</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
            </section>
          )}
        </main>

        {/* Right Inspector & Action Panel (Desktop XL+) */}
        <InspectorPanel
          isOpen={isInspectorOpen}
          onToggle={() => setIsInspectorOpen(prev => !prev)}
          selectedFile={selectedFileDetails}
          onCloseSelectedFile={() => setSelectedFileDetails(null)}
          onCopyHash={(hash) => {
            navigator.clipboard.writeText(hash);
            addToast('Copied SHA-256 hash to clipboard', 'success');
          }}
          onAdvancedExport={() => setShowExportOptionsModal(true)}
          onDownloadHashes={downloadHashesTXT}
          onDownloadCSV={() => downloadCSV('filtered')}
          onCopyMarkdownTable={copyAsMarkdownTable}
          onDownloadJSON={downloadJSON}
          onDownloadPDF={exportPDF}
          onDownloadSummary={downloadSummary}
          onAiOrganize={handleAiOrganize}
          isAiLoading={isAiLoading}
          aiSuggestion={aiSuggestion}
          cleanupHistory={cleanupHistory}
          totalFiles={inventory ? inventory.length : 0}
          totalSize={totalSize}
          duplicateCount={duplicates.length}
          onOpenGovernance={() => setShowGovernanceModal(true)}
        />
      </div>

      {/* Persistent Mobile Bottom Navigation Dock */}
      <MobileBottomDock
        activeTab={mobileTab}
        onSelectTab={(tab) => {
          setMobileTab(tab);
        }}
        duplicateCount={duplicates.length}
        totalFiles={inventory ? inventory.length : 0}
        onOpenFolder={() => fileInputRef.current?.click()}
      />

      {/* Quick Start Guide Modal */}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl p-6">
            <h3 className="text-lg font-medium text-zinc-100 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Reset Workspace
            </h3>
            <p className="text-zinc-400 text-sm mb-6">
              Are you sure you want to reset the workspace? All loaded inventory data and analysis will be cleared. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRefresh}
                className="px-4 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-sm"
              >
                Reset Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreferences && <PreferencesModal onClose={() => setShowPreferences(false)} />}

      {showQuickStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950/50">
              <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" />
                Quick Start Guide: Operations Manual & Optimization Blueprint
              </h3>
              <button onClick={() => setShowQuickStart(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-400">
              <div className="space-y-2">
                <h4 className="text-base font-medium text-zinc-100">Core Philosophy & Key Pillars</h4>
                <p>The application provides a privacy-first, client-side environment for auditing, de-duplicating, and restructuring local file systems.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-zinc-300">Functional Domain Organization:</strong> Group files by logical domain (e.g., frontend, backend, docs) rather than strictly by technical file extension to maximize modularity and discoverability in large workspaces.</li>
                  <li><strong className="text-zinc-300">Cryptographic Duplicate Resolution:</strong> Client-side SHA-256 hash generation detects exact binary matches across folders, freeing storage and streamlining backup procedures.</li>
                  <li><strong className="text-zinc-300">AI-Powered Restructuring:</strong> Automated AI analysis recommends standardized folder structures based on file metadata and project conventions.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-base font-medium text-zinc-100 mb-3">Workflow Execution Summary</h4>
                <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/50">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-950">
                      <tr>
                        <th className="p-3 border-b border-zinc-800 font-medium text-zinc-300 w-16">Step</th>
                        <th className="p-3 border-b border-zinc-800 font-medium text-zinc-300">Phase</th>
                        <th className="p-3 border-b border-zinc-800 font-medium text-zinc-300">Action & Strategy</th>
                        <th className="p-3 border-b border-zinc-800 font-medium text-zinc-300">Operational Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      <tr>
                        <td className="p-3 font-mono text-xs">01</td>
                        <td className="p-3 font-medium text-zinc-300">Scan Directory</td>
                        <td className="p-3">Target directories with &lt;= 10,000 files per session. Exclude heavy dependency folders like node_modules.</td>
                        <td className="p-3">Preserves browser responsiveness and prevents memory heap bottlenecks.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs">02</td>
                        <td className="p-3 font-medium text-zinc-300">Resolve Duplicates</td>
                        <td className="p-3">Open the Duplicates tab to review automatically grouped SHA-256 binary matches. Bulk delete or move to trash.</td>
                        <td className="p-3">Reclaims redundant disk space and streamlines backup archives.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs">03</td>
                        <td className="p-3 font-medium text-zinc-300">Tag & Categorize</td>
                        <td className="p-3">Select inventory rows via checkboxes and apply custom metadata via Bulk Tag.</td>
                        <td className="p-3">Enables dynamic filtering and script-based routing without altering physical file paths.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-xs">04</td>
                        <td className="p-3 font-medium text-zinc-300">AI Restructure & Export</td>
                        <td className="p-3">Run AI Organize for structured folder recommendations. Export visual stats charts, file lists, and duplicate manifests.</td>
                        <td className="p-3">Delivers clean directory maps and comprehensive reports for workspace stakeholders.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-base font-medium text-zinc-100 border-b border-zinc-800 pb-2">Detailed Operational Steps</h4>
                
                <div>
                  <h5 className="font-medium text-zinc-200 mb-1">1. Optimal Performance & Directory Inspection</h5>
                  <p>To maintain smooth browser performance and responsive real-time auditing, keep single inspection batches capped at 10,000 files. Because file reading and cryptographic SHA-256 digest calculations execute entirely within the local browser environment, avoiding oversized dependency directories ensures fluid scrolling and zero browser tab crashes.</p>
                </div>
                
                <div>
                  <h5 className="font-medium text-zinc-200 mb-1">2. Duplicate Audit & Cleanup Strategy</h5>
                  <p className="mb-1">The system computes an explicit SHA-256 digest for each file upon intake:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-zinc-300">Exact Binary Matching:</strong> Identifies duplicate groups across disparate subfolders.</li>
                    <li><strong className="text-zinc-300">Actionable Cleanup:</strong> Review matching groups in the Duplicates tab and utilize automated cleanup options to bulk delete or shift redundant entries into a dedicated trash location.</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-zinc-200 mb-1">3. Metadata Tagging & Inventory Control</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-zinc-300">Bulk Tagging:</strong> Select multiple entries from the main inventory table to assign custom tags (e.g., audit-pending, v1-release, archive-candidate).</li>
                    <li><strong className="text-zinc-300">Path Preservation:</strong> Metadata tags are recorded in the session workspace state, allowing flexible filtering without modifying underlying file paths.</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-zinc-200 mb-1">4. Visual Analytics & Report Export</h5>
                  <p className="mb-1">Generate actionable artifacts directly from the dashboard:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-zinc-300">Storage & Extension Charts:</strong> Export file size distribution histograms and extension breakdowns.</li>
                    <li><strong className="text-zinc-300">Manifest Exports:</strong> Download JSON or CSV inventories and dedicated duplicate manifests for external audit records.</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end">
              <button
                onClick={() => setShowQuickStart(false)}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950/50">
              <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                Bulk Rename Files
              </h3>
              <button onClick={() => setShowBulkRenameModal(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                {(['prefix', 'suffix', 'replace'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setBulkRenameMode(mode)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${bulkRenameMode === mode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              {bulkRenameMode === 'prefix' && (
                <input 
                  type="text" 
                  placeholder="Enter prefix..."
                  value={bulkRenamePrefix}
                  onChange={e => setBulkRenamePrefix(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              )}
              {bulkRenameMode === 'suffix' && (
                <input 
                  type="text" 
                  placeholder="Enter suffix..."
                  value={bulkRenameSuffix}
                  onChange={e => setBulkRenameSuffix(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              )}
              {bulkRenameMode === 'replace' && (
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="Find..."
                    value={bulkRenameFind}
                    onChange={e => setBulkRenameFind(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <input 
                    type="text" 
                    placeholder="Replace with..."
                    value={bulkRenameReplace}
                    onChange={e => setBulkRenameReplace(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-2">
              <button 
                onClick={() => setShowBulkRenameModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkRename}
                disabled={
                  (bulkRenameMode === 'prefix' && !bulkRenamePrefix) || 
                  (bulkRenameMode === 'suffix' && !bulkRenameSuffix) ||
                  (bulkRenameMode === 'replace' && !bulkRenameFind)
                }
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Rename {selectedPaths.size} Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Tag Modal */}
      {showBulkTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950/50">
              <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" />
                Bulk Tag Files
              </h3>
              <button onClick={() => setShowBulkTagModal(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-zinc-400 mb-4">
                Assign tags to <strong className="text-zinc-200">{selectedPaths.size}</strong> selected files. Separate multiple tags with commas.
              </p>
              <input 
                type="text" 
                placeholder="e.g. review, obsolete, v2"
                value={bulkTagInput}
                onChange={e => setBulkTagInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 mb-2"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBulkTag();
                  }
                }}
              />
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3">
              <button
                onClick={() => setShowBulkTagModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkTag}
                disabled={!bulkTagInput.trim()}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg transition-colors"
              >
                Apply Tags
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* Smart Duplicate Cleanup Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full shadow-2xl flex flex-col h-[85vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-950/50">
              <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-amber-400" />
                Duplicate Cleanup Protocol
              </h2>
              <button onClick={() => setShowCleanupModal(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors active:scale-95">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex">
              {/* Sidebar Settings */}
              <div className="w-64 border-r border-zinc-800 bg-zinc-950/30 p-6 flex flex-col gap-6">
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-3 uppercase tracking-wider">De-duplication Rule</h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="keepRule" value="oldest" checked={cleanupAction === 'keep_oldest'} onChange={() => setCleanupAction('keep_oldest' as any)} className="text-indigo-500 focus:ring-indigo-500 bg-zinc-900 border-zinc-700" />
                      <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">Keep Oldest Version</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="keepRule" value="newest" checked={cleanupAction === 'keep_newest'} onChange={() => setCleanupAction('keep_newest' as any)} className="text-indigo-500 focus:ring-indigo-500 bg-zinc-900 border-zinc-700" />
                      <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">Keep Newest Version</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="keepRule" value="shortest_path" checked={cleanupAction === 'keep_shortest_path'} onChange={() => setCleanupAction('keep_shortest_path' as any)} className="text-indigo-500 focus:ring-indigo-500 bg-zinc-900 border-zinc-700" />
                      <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">Keep Shortest Path</span>
                    </label>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-3 uppercase tracking-wider">Resolution Action</h3>
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="resAction" value="delete" checked={cleanupStep === 1} onChange={() => setCleanupStep(1)} className="text-indigo-500 focus:ring-indigo-500 bg-zinc-900 border-zinc-700" />
                      <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">Delete Permanently</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="radio" name="resAction" value="trash" checked={cleanupStep === 0} onChange={() => setCleanupStep(0)} className="text-indigo-500 focus:ring-indigo-500 bg-zinc-900 border-zinc-700" />
                      <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors">Move to Trash</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Main Preview */}
              <div className="flex-1 p-6 overflow-y-auto bg-zinc-900/20">
                <div className="mb-4 text-sm text-zinc-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span>
                      Found <strong>{duplicates.length}</strong> duplicate groups
                      {hashFilter && <span> (<strong>{duplicates.filter(g => g.sha256.toLowerCase().includes(hashFilter.toLowerCase())).length}</strong> matching filter)</span>}.
                    </span>
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-xs shrink-0">Simulated Preview</span>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter by Hash..."
                      value={hashFilter}
                      onChange={(e) => setHashFilter(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 w-full md:w-64"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  {duplicates.filter(group => group.sha256.toLowerCase().includes(hashFilter.toLowerCase())).map(group => {
                    const filesInGroup = inventory?.filter(f => group.paths.includes(f.relative_path)) || [];
                    
                    // Determine which file to keep based on the rule
                    let fileToKeep = filesInGroup[0];
                    if (cleanupAction === 'keep_oldest' as any) {
                      fileToKeep = [...filesInGroup].sort((a, b) => new Date(a.modified_utc).getTime() - new Date(b.modified_utc).getTime())[0];
                    } else if (cleanupAction === 'keep_newest' as any) {
                      fileToKeep = [...filesInGroup].sort((a, b) => new Date(b.modified_utc).getTime() - new Date(a.modified_utc).getTime())[0];
                    } else if (cleanupAction === 'keep_shortest_path' as any) {
                      fileToKeep = [...filesInGroup].sort((a, b) => a.relative_path.length - b.relative_path.length)[0];
                    }

                    return (
                      <div key={group.sha256} className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-zinc-800/50">
                          <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded">{group.sha256.substring(0, 16)}</span>
                          <span className="text-xs text-zinc-400">{formatBytes(group.size_bytes)}</span>
                        </div>
                        <ul className="space-y-2">
                          {filesInGroup.map(file => {
                            const isKeeping = file.relative_path === fileToKeep?.relative_path;
                            return (
                              <li key={file.relative_path} className={`text-sm flex items-center gap-3 p-2 rounded ${isKeeping ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/5 border border-rose-500/10 opacity-70'}`}>
                                {isKeeping ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />}
                                <div className="flex-1 min-w-0">
                                  <div className={`truncate ${isKeeping ? 'text-emerald-400' : 'text-zinc-400 line-through'}`} title={file.relative_path}>{file.relative_path}</div>
                                  <div className="text-xs text-zinc-500 flex gap-4 mt-0.5">
                                    <span>{new Date(file.modified_utc).toLocaleString()}</span>
                                  </div>
                                </div>
                                {isKeeping && <span className="text-xs text-emerald-500 font-medium px-2 py-1 bg-emerald-500/10 rounded">PRESERVE</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3">
              <button
                onClick={() => {
                  const filteredDuplicates = duplicates.filter(group => group.sha256.toLowerCase().includes(hashFilter.toLowerCase()));
                  const hashes = filteredDuplicates.map(g => g.sha256).join('\n');
                  navigator.clipboard.writeText(hashes);
                  addToast(`Copied ${filteredDuplicates.length} hashes to clipboard`, 'success');
                }}
                className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 rounded-lg transition-all active:scale-95 mr-auto flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy All Hashes
              </button>
              <button
                onClick={() => setShowCleanupModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmAction({
                    title: 'Execute Deduplication',
                    message: 'Are you sure you want to execute this deduplication plan? The redundant files will be removed from the inventory.',
                    confirmText: 'Execute',
                    onConfirm: () => {
                      // Execute deduplication
                      let filesToDelete = new Set<string>();
                      
                      duplicates.forEach(group => {
                        const filesInGroup = inventory?.filter(f => group.paths.includes(f.relative_path)) || [];
                        
                        let fileToKeep = filesInGroup[0];
                      if (cleanupAction === 'keep_oldest' as any) {
                        fileToKeep = [...filesInGroup].sort((a, b) => new Date(a.modified_utc).getTime() - new Date(b.modified_utc).getTime())[0];
                      } else if (cleanupAction === 'keep_newest' as any) {
                        fileToKeep = [...filesInGroup].sort((a, b) => new Date(b.modified_utc).getTime() - new Date(a.modified_utc).getTime())[0];
                      } else if (cleanupAction === 'keep_shortest_path' as any) {
                        fileToKeep = [...filesInGroup].sort((a, b) => a.relative_path.length - b.relative_path.length)[0];
                      }
                      
                      filesInGroup.forEach(f => {
                        if (f.relative_path !== fileToKeep?.relative_path) {
                          filesToDelete.add(f.relative_path);
                        }
                      });
                    });
                    
                    if (inventory) {
                      setInventory(inventory.filter(f => !filesToDelete.has(f.relative_path)));
                      setDuplicates([]); 
                    }
                    setShowCleanupModal(false);
                    setConfirmAction(null);
                    addToast(`Removed ${filesToDelete.size} redundant files`, 'success');
                  }
                });
              }}
              disabled={duplicates.length === 0}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg transition-all active:scale-95 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Execute De-duplication
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cleanup History Modal */}
      {showCleanupHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950/50">
              <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                Cleanup History
              </h3>
              <button onClick={() => setShowCleanupHistory(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {cleanupHistory.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No cleanup history available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cleanupHistory.map(entry => (
                    <div key={entry.id} className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded ${entry.action === 'trash' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            {entry.action === 'trash' ? 'Moved to Trash' : 'Deleted'}
                          </span>
                          <span className="text-xs text-zinc-500">{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-zinc-300">
                          Processed <strong className="text-zinc-200">{entry.count}</strong> files, freeing up <strong className="text-emerald-400">{formatBytes(entry.size)}</strong>.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Workspace Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950/50">
              <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-sky-400" />
                Workspace Compare
              </h3>
              <button onClick={() => setShowCompareModal(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {!compareInventory ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Folder className="w-8 h-8 text-sky-400" />
                  </div>
                  <h2 className="text-xl font-medium text-zinc-100 mb-2">Compare Another Workspace</h2>
                  <p className="text-zinc-400 mb-8 max-w-md mx-auto text-sm">
                    Select a second directory to compare against the current workspace. We will analyze file counts, sizes, and identify overlapping duplicates.
                  </p>
                  <label className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer cursor-pointer shadow-sm">
                    <FolderOpen className="w-5 h-5" />
                    Select Directory to Compare
                    <input
                      type="file"
                      // @ts-ignore
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          processCompareFiles(files);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {compareProcessing && (
                    <div className="mt-8 animate-in fade-in max-w-sm mx-auto">
                      <div className="flex items-center justify-between text-sm mb-2 text-zinc-400">
                        <span>Analyzing {compareProgress.total} files...</span>
                        <span>{Math.round((compareProgress.current / Math.max(1, compareProgress.total)) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-sky-500 transition-all duration-300"
                          style={{ width: `${(compareProgress.current / Math.max(1, compareProgress.total)) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-950/50 border border-zinc-800/50 p-6 rounded-xl">
                      <h4 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-400" /> Current Workspace
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500">Total Files:</span>
                          <span className="text-zinc-200 font-medium">{inventory?.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500">Total Size:</span>
                          <span className="text-zinc-200 font-medium">{formatBytes(totalSize)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-zinc-950/50 border border-zinc-800/50 p-6 rounded-xl">
                      <h4 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                        <Database className="w-4 h-4 text-sky-400" /> Comparison Workspace
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500">Total Files:</span>
                          <span className="text-zinc-200 font-medium">{compareInventory.length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-zinc-500">Total Size:</span>
                          <span className="text-zinc-200 font-medium">
                            {formatBytes(compareInventory.reduce((acc, f) => acc + f.size_bytes, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-950/50 border border-zinc-800/50 p-6 rounded-xl">
                    <h4 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> Overlap Analysis
                    </h4>
                    {(() => {
                      const currentHashes = new Set(inventory?.map(f => f.sha256).filter(Boolean));
                      const compareHashes = new Set(compareInventory.map(f => f.sha256).filter(Boolean));
                      
                      let overlapCount = 0;
                      let overlapSize = 0;
                      
                      compareInventory.forEach(f => {
                        if (f.sha256 && currentHashes.has(f.sha256)) {
                          overlapCount++;
                          overlapSize += f.size_bytes;
                        }
                      });

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <div>
                              <span className="block text-sm font-medium text-zinc-200">Files Present in Both Workspaces</span>
                              <span className="block text-xs text-zinc-500 mt-1">Based on exact SHA-256 content match</span>
                            </div>
                            <div className="text-right">
                              <span className="block text-xl font-light text-amber-400">{overlapCount} files</span>
                              <span className="block text-sm text-zinc-500">{formatBytes(overlapSize)} overlap</span>
                            </div>
                          </div>
                          
                          {overlapCount > 0 && (
                            <div className="text-sm text-zinc-400 bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                              <AlertTriangle className="w-4 h-4 text-amber-400 inline mr-2" />
                              This comparison workspace contains <strong className="text-zinc-200">{overlapCount}</strong> files that already exist in your current workspace. You may want to investigate these duplicates before merging or copying files.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
            {compareInventory && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3">
                <button
                  onClick={() => setCompareInventory(null)}
                  className="px-4 py-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
                >
                  Clear Comparison
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Details Modal */}
      {selectedFileDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-zinc-950/50">
              <h3 className="font-medium text-zinc-200">File Details</h3>
              <button onClick={() => setSelectedFileDetails(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <span className="block text-zinc-500 mb-1 text-xs uppercase tracking-wider">File Name</span>
                {isRenaming ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={renameInput}
                      onChange={e => setRenameInput(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <button
                      onClick={handleRenameConfirm}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsRenaming(false)}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group">
                    <div className="text-zinc-200 break-all">{selectedFileDetails.file_name}</div>
                    <button
                      onClick={() => {
                        setIsRenaming(true);
                        setRenameInput(selectedFileDetails.file_name);
                      }}
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-zinc-800"
                      title="Rename File"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <span className="block text-zinc-500 mb-1 text-xs uppercase tracking-wider">Relative Path</span>
                <div className="flex items-center gap-2">
                  <div className="text-zinc-300 break-all font-mono text-xs bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 flex-1">
                    {selectedFileDetails.relative_path}
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(selectedFileDetails.relative_path)}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors text-zinc-300 shadow-sm"
                    title="Copy Path"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <span className="block text-zinc-500 mb-1 text-xs uppercase tracking-wider">SHA-256 Hash</span>
                <div className="flex items-center gap-2">
                  <div className="text-zinc-300 break-all font-mono text-xs bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 flex-1">
                    {selectedFileDetails.sha256 || 'N/A'}
                  </div>
                  {selectedFileDetails.sha256 && (
                    <button 
                      onClick={() => navigator.clipboard.writeText(selectedFileDetails.sha256)}
                      className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors text-zinc-300 shadow-sm"
                      title="Copy Hash"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <span className="block text-zinc-500 mb-1 text-xs uppercase tracking-wider">Compare Hash</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    placeholder="Paste another SHA-256 hash here to compare..."
                    value={compareHash}
                    onChange={e => setCompareHash(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  {compareHash && (
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center justify-center ${
                      compareHash.trim().toLowerCase() === selectedFileDetails.sha256?.toLowerCase()
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {compareHash.trim().toLowerCase() === selectedFileDetails.sha256?.toLowerCase() ? 'Match' : 'Mismatch'}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <span className="block text-zinc-500 mb-1 text-xs uppercase tracking-wider">Tags</span>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {(selectedFileDetails.tags || []).map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="text-indigo-400/60 hover:text-indigo-400 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add a tag and press Enter..."
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="block text-zinc-500 text-xs uppercase tracking-wider">Notes (Auto-saves on blur)</span>
                  {selectedFileDetails.notes !== notesInput.trim() && (
                    <button onClick={() => { handleSaveNotes(notesInput); addToast('Notes saved', 'success'); }} className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors font-medium">Save Now</button>
                  )}
                </div>
                <textarea
                  placeholder="Add ephemeral notes..."
                  value={notesInput}
                  onChange={e => setNotesInput(e.target.value)}
                  onBlur={() => {
                    if (selectedFileDetails.notes !== notesInput.trim()) {
                      handleSaveNotes(notesInput);
                      addToast('Notes autosaved', 'success');
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 min-h-[60px] resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                  <span className="block text-zinc-500 mb-1 text-xs uppercase tracking-wider">Size</span>
                  <div className="text-zinc-200">{formatBytes(selectedFileDetails.size_bytes)}</div>
                </div>
                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                  <span className="block text-zinc-500 mb-1 text-xs uppercase tracking-wider">Extension</span>
                  <div className="text-zinc-200">{selectedFileDetails.extension || 'None'}</div>
                </div>
                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                  <span className="block text-zinc-500 mb-1 text-xs uppercase tracking-wider">MIME Type</span>
                  <div className="text-zinc-200 truncate" title={selectedFileDetails.mime_type}>{selectedFileDetails.mime_type || 'Unknown'}</div>
                </div>
                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                  <span className="block text-zinc-500 mb-1 text-xs uppercase tracking-wider">Modified (UTC)</span>
                  <div className="text-zinc-200">{new Date(selectedFileDetails.modified_utc).toLocaleString()}</div>
                </div>
              </div>

              {fileObjectsRef.current.has(selectedFileDetails.relative_path) && (
                <FilePreview 
                  file={fileObjectsRef.current.get(selectedFileDetails.relative_path)} 
                  extension={selectedFileDetails.extension || ''} 
                />
              )}
            </div>
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-2">
              <button
                onClick={() => {
                  const folderPath = selectedFileDetails.relative_path.split('/').slice(0, -1).join('/');
                  setTreeSearchTerm(folderPath);
                  setSelectedTreePath(folderPath);
                  setViewMode('tree');
                  setSelectedFileDetails(null);
                }}
                className="flex items-center gap-2 text-sm bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-4 py-2 rounded-lg border border-indigo-500/30 transition-colors"
              >
                <Folder className="w-4 h-4 text-indigo-400" />
                Open Folder
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
              <h3 className="font-medium text-zinc-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                Configuration Export
              </h3>
              <button onClick={() => setShowConfigModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Save Workspace Configuration</h4>
                <p className="text-xs text-zinc-500 mb-4">Export your current workspace settings, column preferences, tags, and notes to a JSON file.</p>
                <button
                  onClick={saveWorkspaceConfig}
                  className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>

              <div className="pt-6 border-t border-zinc-800">
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Load Workspace Configuration</h4>
                <p className="text-xs text-zinc-500 mb-4">Import a previously saved workspace configuration JSON file to restore your settings, tags, and notes.</p>
                <input 
                  type="file" 
                  accept=".json" 
                  ref={configInputRef} 
                  className="hidden" 
                  onChange={handleLoadWorkspaceConfig} 
                />
                <button
                  onClick={() => configInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-lg border border-zinc-700 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  Load Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportOptionsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900 flex justify-between items-center">
              <h3 className="font-medium text-zinc-100 flex items-center gap-2">
                <Download className="w-4 h-4 text-indigo-400" />
                Advanced Export Options
              </h3>
              <button onClick={() => setShowExportOptionsModal(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Include Sections</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={exportIncludeStats}
                      onChange={(e) => setExportIncludeStats(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900" 
                    />
                    Include Statistics Cards
                  </label>
                  <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={exportIncludeCharts}
                      onChange={(e) => setExportIncludeCharts(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900" 
                    />
                    Include Charts
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Export Quality</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExportScale(1)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${exportScale === 1 ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-300'}`}
                  >
                    Standard (1x)
                  </button>
                  <button
                    onClick={() => setExportScale(2)}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${exportScale === 2 ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-300'}`}
                  >
                    High-Res (2x)
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <button
                  onClick={handleAdvancedExport}
                  disabled={!exportIncludeStats && !exportIncludeCharts}
                  className="w-full flex items-center justify-center gap-2 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export Dashboard
                </button>
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs uppercase tracking-wider">Other Exports</span>
                  <div className="flex-grow border-t border-zinc-800"></div>
                </div>

                <button
                  onClick={downloadHashesTXT}
                  className="w-full flex items-center justify-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-lg transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  Download Filtered Hashes (TXT)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFileComparisonModal && inventory && (
        <FileComparisonModal
          files={inventory.filter(f => selectedPaths.has(f.relative_path))}
          fileObjects={fileObjectsRef.current}
          onClose={() => setShowFileComparisonModal(false)}
        />
      )}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText={confirmAction.confirmText}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Automated Ignore Pattern Suggestions Modal */}
      {showIgnoreModal && preScanResult && (
        <IgnorePatternModal
          isOpen={showIgnoreModal}
          preScanResult={preScanResult}
          initialConfig={ignoreConfig}
          onConfirm={(selectedPatterns, rememberChoice) => {
            const rawCandidates = pendingFilesRef.current;
            if (!rawCandidates) {
              setShowIgnoreModal(false);
              return;
            }

            const candidateList: File[] = Array.from(rawCandidates as any);
            const filteredFiles: File[] = [];
            let excludedCount = 0;

            for (const file of candidateList) {
              const path = file.webkitRelativePath || file.name;
              let shouldIgnore = false;
              for (const pat of selectedPatterns) {
                if (matchesPathPattern(path, pat)) {
                  shouldIgnore = true;
                  break;
                }
              }

              if (shouldIgnore) {
                excludedCount++;
              } else {
                filteredFiles.push(file);
              }
            }

            setShowIgnoreModal(false);
            if (rememberChoice) {
              const updatedConfig = {
                ...ignoreConfig,
                rememberChoice: true,
                enabledPatterns: Array.from(new Set([...ignoreConfig.enabledPatterns, ...selectedPatterns])),
              };
              setIgnoreConfig(updatedConfig);
              saveStoredIgnoreConfig(updatedConfig);
            }

            if (excludedCount > 0) {
              addToast(`Excluded ${excludedCount.toLocaleString()} files matching ignore rules. Indexing ${filteredFiles.length.toLocaleString()} files.`, 'info');
            }

            processFiles(filteredFiles);
          }}
          onSkip={() => {
            setShowIgnoreModal(false);
            if (pendingFilesRef.current) {
              processFiles(pendingFilesRef.current);
            }
          }}
          onCancel={() => {
            setShowIgnoreModal(false);
            pendingFilesRef.current = null;
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {showShortcutsModal && <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commandPaletteItems}
      />
      <GovernanceAuditModal
        isOpen={showGovernanceModal}
        onClose={() => setShowGovernanceModal(false)}
      />
    </div>
  );
}

