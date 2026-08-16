const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `                          <span className="text-sm text-zinc-400 font-medium">
                            {formatBytes(group.size_bytes)} each
                          </span>`,
  `                          <div className="flex items-center gap-3">
                            <span className="text-sm text-zinc-400 font-medium">
                              {formatBytes(group.size_bytes)} each
                            </span>
                            <button
                              onClick={() => {
                                // keep one file, delete others
                                const filesToDelete = group.paths.slice(1);
                                const cmd = \`rm -rf \${filesToDelete.map(p => \`"\${p}"\`).join(' ')}\`;
                                navigator.clipboard.writeText(cmd);
                              }}
                              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-700 transition-colors flex items-center gap-1.5"
                              title="Copy rm -rf command for redundant copies (keeps the first file)"
                            >
                              <Copy className="w-3 h-3" /> Cmd
                            </button>
                          </div>`
);
fs.writeFileSync('src/App.tsx', content);
