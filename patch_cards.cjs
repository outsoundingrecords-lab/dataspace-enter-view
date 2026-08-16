const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
`              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">`,
`              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">`
);

content = content.replace(
`                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <p className="text-sm text-zinc-500 mb-1 font-medium">Wasted Space</p>
                  <p className="text-2xl text-rose-400 font-light">{formatBytes(duplicateSize)}</p>
                </div>
              </div>`,
`                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <p className="text-sm text-zinc-500 mb-1 font-medium">Wasted Space</p>
                  <p className="text-2xl text-rose-400 font-light">{formatBytes(duplicateSize)}</p>
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
              </div>`
);

fs.writeFileSync('src/App.tsx', content);
