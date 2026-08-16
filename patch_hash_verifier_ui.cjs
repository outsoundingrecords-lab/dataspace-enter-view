const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `                  <button
                    onClick={() => document.getElementById('compare-upload')?.click()}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <GitMerge className="w-4 h-4 text-emerald-400" />
                    Compare Folder
                  </button>`,
  `                  <button
                    onClick={() => setShowHashVerifier(true)}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    Hash Verifier
                  </button>
                  <button
                    onClick={() => document.getElementById('compare-upload')?.click()}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <GitMerge className="w-4 h-4 text-emerald-400" />
                    Compare Folder
                  </button>`
);

content = content.replace(
  `      {/* Full Compare View */}`,
  `      {showHashVerifier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full shadow-2xl flex flex-col h-[80vh]">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-950/50">
              <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-indigo-400" />
                Dedicated Hash Verifier
              </h2>
              <button onClick={() => setShowHashVerifier(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto flex gap-6">
              {[1, 2].map(num => {
                const fileData = num === 1 ? verifierFile1 : verifierFile2;
                const setFileData = num === 1 ? setVerifierFile1 : setVerifierFile2;
                return (
                  <div key={num} className="flex-1 flex flex-col border border-zinc-800 rounded-xl bg-zinc-950/50 relative overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                      <h3 className="font-medium text-zinc-300">File {num}</h3>
                      {fileData && (
                        <button onClick={() => setFileData(null)} className="text-xs text-rose-400 hover:text-rose-300">Clear</button>
                      )}
                    </div>
                    {!fileData ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const f = e.target.files[0];
                              const hash = await computeHash(f);
                              setFileData({ name: f.name, size: f.size, type: f.type, hash, file: f });
                            }
                          }}
                        />
                        <Upload className="w-12 h-12 text-zinc-700 mb-4" />
                        <p className="text-zinc-400 font-medium mb-1">Drag and drop file here</p>
                        <p className="text-zinc-600 text-sm">or click to browse</p>
                      </div>
                    ) : (
                      <div className="flex-1 p-6 flex flex-col gap-4">
                        <div>
                          <span className="block text-zinc-500 mb-1 text-xs uppercase tracking-wider">File Name</span>
                          <div className="text-zinc-200 break-all bg-zinc-900 p-3 rounded-lg border border-zinc-800">{fileData.name}</div>
                        </div>
                        <div>
                          <span className="block text-zinc-500 mb-1 text-xs uppercase tracking-wider">SHA-256 Hash</span>
                          <div className="text-indigo-300 font-mono text-sm break-all bg-zinc-900 p-3 rounded-lg border border-indigo-500/30">
                            {fileData.hash}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="block text-zinc-500 mb-1 text-xs uppercase tracking-wider">Size</span>
                            <div className="text-zinc-300 text-sm">{formatBytes(fileData.size)}</div>
                          </div>
                          <div>
                            <span className="block text-zinc-500 mb-1 text-xs uppercase tracking-wider">Type</span>
                            <div className="text-zinc-300 text-sm truncate" title={fileData.type || 'unknown'}>{fileData.type || 'unknown'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {verifierFile1 && verifierFile2 && (
              <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-center">
                {verifierFile1.hash === verifierFile2.hash ? (
                  <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-xl font-medium text-lg">
                    <CheckCircle2 className="w-6 h-6" /> EXACT MATCH
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-6 py-3 rounded-xl font-medium text-lg">
                    <XCircle className="w-6 h-6" /> HASH MISMATCH
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Compare View */}`
);

fs.writeFileSync('src/App.tsx', content);
