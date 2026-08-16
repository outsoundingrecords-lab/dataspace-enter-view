const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `            </div>
          </div>
        </div>
      )}`,
  `            </div>
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
                    className={\`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors \${bulkRenameMode === mode ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}\`}
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
      )}`
);

fs.writeFileSync('src/App.tsx', content);
