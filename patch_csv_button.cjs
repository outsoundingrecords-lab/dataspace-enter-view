const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `                  <div className="absolute top-full left-0 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all z-20">
                    <button onClick={() => downloadCSV('all')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                      Export Entire Inventory (CSV)
                    </button>
                    <button onClick={() => downloadCSV('filtered')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                      Export Filtered View (CSV)
                    </button>`,
  `                  <div className="absolute top-full left-0 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all z-20">
                    <button onClick={() => downloadCSV('filtered')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                      Download inventory.csv
                    </button>`
);
fs.writeFileSync('src/App.tsx', content);
