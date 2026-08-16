const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `<div className="flex-1 relative">`,
  `<div className="flex-1 min-w-[140px] relative">`
);

content = content.replace(
  `onClick={() => setShowCompareModal(true)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"`,
  `onClick={() => setShowCompareModal(true)}
                  className="flex-1 min-w-[140px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"`
);

content = content.replace(
  `onClick={handleBatchValidate}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"`,
  `onClick={handleBatchValidate}
                  className="flex-1 min-w-[140px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"`
);

// Reset button
content = content.replace(
  `className="flex-none bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"`,
  `className="flex-none bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm"`
);

// Also add a global click outside handler or just let the Export menu toggle on click normally.
// The user has to click again to close it, which is standard enough for a toggle without a ref.

fs.writeFileSync('src/App.tsx', content);
