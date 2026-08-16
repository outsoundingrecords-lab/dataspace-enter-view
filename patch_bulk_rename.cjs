const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState('');`,
  `  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState('');

  const [showBulkRenameModal, setShowBulkRenameModal] = useState(false);
  const [bulkRenameMode, setBulkRenameMode] = useState<'prefix' | 'suffix' | 'replace'>('prefix');
  const [bulkRenamePrefix, setBulkRenamePrefix] = useState('');
  const [bulkRenameSuffix, setBulkRenameSuffix] = useState('');
  const [bulkRenameFind, setBulkRenameFind] = useState('');
  const [bulkRenameReplace, setBulkRenameReplace] = useState('');`
);

content = content.replace(
  `  const handleBulkTag = () => {
    if (!inventory || !bulkTagInput.trim() || selectedPaths.size === 0) return;
    
    const tag = bulkTagInput.trim();
    const updatedInventory = inventory.map(file => {
      if (selectedPaths.has(file.relative_path)) {
        return {
          ...file,
          tags: Array.from(new Set([...(file.tags || []), tag]))
        };
      }
      return file;
    });
    
    setInventory(updatedInventory);
    setBulkTagInput('');
    setShowBulkTagModal(false);
  };`,
  `  const handleBulkTag = () => {
    if (!inventory || !bulkTagInput.trim() || selectedPaths.size === 0) return;
    
    const tag = bulkTagInput.trim();
    const updatedInventory = inventory.map(file => {
      if (selectedPaths.has(file.relative_path)) {
        return {
          ...file,
          tags: Array.from(new Set([...(file.tags || []), tag]))
        };
      }
      return file;
    });
    
    setInventory(updatedInventory);
    setBulkTagInput('');
    setShowBulkTagModal(false);
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

        return {
          ...file,
          file_name: newName,
          relative_path: newRelativePath
        };
      }
      return file;
    });
    setInventory(updatedInventory);
    setShowBulkRenameModal(false);
    setSelectedPaths(new Set());
  };`
);

content = content.replace(
  `                          <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 text-sm bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Bulk Delete ({selectedPaths.size})
                          </button>`,
  `                          <button
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
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 text-sm bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Bulk Delete ({selectedPaths.size})
                          </button>`
);

content = content.replace(
  `import { Upload, X, File as FileIcon, Search, Tag, Settings, Trash2, CheckSquare, Plus, ChevronDown, ListFilter, AlertTriangle, ChevronRight, Copy, ArrowUpDown, ArrowUp, ArrowDown, Folder, Image, FileText, FileCode2, Package, RefreshCw, Info, Download, Maximize2, GitMerge, FileCheck, CheckCircle2, History, XCircle, Database, LayoutGrid, Wand2, BarChart2 } from 'lucide-react';`,
  `import { Upload, X, File as FileIcon, Search, Tag, Settings, Trash2, CheckSquare, Plus, ChevronDown, ListFilter, AlertTriangle, ChevronRight, Copy, ArrowUpDown, ArrowUp, ArrowDown, Folder, Image, FileText, FileCode2, Package, RefreshCw, Info, Download, Maximize2, GitMerge, FileCheck, CheckCircle2, History, XCircle, Database, LayoutGrid, Wand2, BarChart2, Edit2 } from 'lucide-react';`
);

fs.writeFileSync('src/App.tsx', content);
