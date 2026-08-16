const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// I will add a new modal component for Duplicate Cleanup.
const smartCleanupJSX = `
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
                <div className="mb-4 text-sm text-zinc-400 flex items-center justify-between">
                  <span>Found <strong>{duplicates.length}</strong> exact duplicate groups based on SHA-256 hash.</span>
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-xs">Simulated Preview</span>
                </div>
                <div className="space-y-4">
                  {duplicates.map(group => {
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
                              <li key={file.relative_path} className={\`text-sm flex items-center gap-3 p-2 rounded \${isKeeping ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/5 border border-rose-500/10 opacity-70'}\`}>
                                {isKeeping ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> : <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />}
                                <div className="flex-1 min-w-0">
                                  <div className={\`truncate \${isKeeping ? 'text-emerald-400' : 'text-zinc-400 line-through'}\`} title={file.relative_path}>{file.relative_path}</div>
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
                onClick={() => setShowCleanupModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to execute this deduplication plan? The redundant files will be removed from the inventory.')) {
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
                      // Re-compute duplicates will be handled implicitly by a useEffect on inventory change if it exists, or we force a clear:
                      setDuplicates([]); 
                    }
                    setShowCleanupModal(false);
                  }
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
      )}`;

// Wait, I need to remove the old Cleanup Assistant JSX block to avoid duplicates.
// The old block starts at `{/* Cleanup Assistant Modal */}` and ends right before `{/* Cleanup History Modal */}`.
// I will use regex or substring to replace it.

const startMarker = '{/* Cleanup Assistant Modal */}';
const endMarker = '{/* Cleanup History Modal */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + smartCleanupJSX + '\n      ' + content.slice(endIndex);
}

// I should also import ShieldAlert if it's not imported
if (!content.includes('ShieldAlert')) {
  content = content.replace(`AlertTriangle,`, `AlertTriangle, ShieldAlert,`);
}

fs.writeFileSync('src/App.tsx', content);
