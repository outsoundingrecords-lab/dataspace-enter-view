const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `                    <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Exact Duplicates Identified
                    </h3>`,
  `                    <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Exact Duplicates Identified
                      <span className="ml-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {duplicates.length}
                      </span>
                    </h3>`
);
fs.writeFileSync('src/App.tsx', content);
