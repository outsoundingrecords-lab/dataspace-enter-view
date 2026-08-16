const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add state
content = content.replace(
  `  const [showQuickStart, setShowQuickStart] = useState(false);`,
  `  const [showQuickStart, setShowQuickStart] = useState(false);\n  const [showResetConfirm, setShowResetConfirm] = useState(false);`
);

// Update handleRefresh and add confirmRefresh
content = content.replace(
  `  const handleRefresh = () => {
    if (!window.confirm("Are you sure you want to reset the workspace? All loaded data will be cleared.")) return;
    setInventory(null);
    setDuplicates([]);
    fileObjectsRef.current.clear();
    setFileSearch('');
    setSelectedPaths(new Set());
    localStorage.removeItem('fileInventory');
    localStorage.removeItem('fileDuplicates');
  };`,
  `  const handleRefresh = () => {
    setShowResetConfirm(true);
  };

  const confirmRefresh = () => {
    setInventory(null);
    setDuplicates([]);
    fileObjectsRef.current.clear();
    setFileSearch('');
    setSelectedPaths(new Set());
    localStorage.removeItem('fileInventory');
    localStorage.removeItem('fileDuplicates');
    setShowResetConfirm(false);
  };`
);

// Add the modal JSX
const modalJSX = `
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
      )}`;

// Insert modalJSX right before {showQuickStart &&
content = content.replace(
  `      {showQuickStart && (`,
  modalJSX + `\n\n      {showQuickStart && (`
);

fs.writeFileSync('src/App.tsx', content);
