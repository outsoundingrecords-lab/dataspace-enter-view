const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add showExportMenu state
content = content.replace(
  `  const [showSortMenu, setShowSortMenu] = useState(false);`,
  `  const [showSortMenu, setShowSortMenu] = useState(false);\n  const [showExportMenu, setShowExportMenu] = useState(false);`
);

// Replace hover logic with click logic
const oldExportJSX = `                <div className="flex-1 relative group">
                  <button
                    className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    Exports <ChevronDown className="w-3 h-3 text-zinc-500" />
                  </button>
                  <div className="absolute top-full left-0 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-all z-20">`;

const newExportJSX = `                <div className="flex-1 relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    Exports <ChevronDown className="w-3 h-3 text-zinc-500" />
                  </button>
                  {showExportMenu && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-30 animate-in fade-in zoom-in-95">`;

content = content.replace(oldExportJSX, newExportJSX);

// Add active:scale-95 to other main buttons
content = content.replace(
  `                  onClick={() => setShowCompareModal(true)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"`,
  `                  onClick={() => setShowCompareModal(true)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"`
);

content = content.replace(
  `                  onClick={handleBatchValidate}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"`,
  `                  onClick={handleBatchValidate}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"`
);

content = content.replace(
  `                  onClick={handleRefresh}
                  className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-colors shadow-sm"`,
  `                  onClick={handleRefresh}
                  className="p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-all active:scale-95 shadow-sm"`
);

// Don't forget to close the div for the export menu!
content = content.replace(
  `                    <button onClick={downloadSummary} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                      Download Summary (TXT)
                    </button>
                  </div>`,
  `                    <button onClick={downloadSummary} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                      Download Summary (TXT)
                    </button>
                  </div>
                  )}`
);

// For the button containers on mobile, we can use flex-wrap or grid
content = content.replace(
  `<div className="flex gap-4">
                <div className="flex-1 relative">`,
  `<div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[120px] relative">`
);

fs.writeFileSync('src/App.tsx', content);
