const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The checkbox column
content = content.replace(
  `<th className="px-6 py-3 w-10">`,
  `<th className="px-4 py-3 w-[60px] min-w-[60px] max-w-[60px] sticky left-0 z-20 bg-zinc-950/90 backdrop-blur-sm border-r border-zinc-800">`
);

content = content.replace(
  `<td className="px-6 py-3 w-10" onClick={e => e.stopPropagation()}>`,
  `<td className="px-4 py-3 w-[60px] min-w-[60px] max-w-[60px] sticky left-0 z-10 bg-zinc-900 border-r border-zinc-800/50 group-hover:bg-zinc-800/80 transition-colors" onClick={e => e.stopPropagation()}>`
);

// We need to fix the background colors. The tr has a hover background. If we use sticky td, we must give it a background color so it overlays the non-sticky columns.
// In the tr: className={`animate-in fade-in duration-300 transition-colors cursor-pointer ${isDuplicate ? 'bg-rose-500/10 hover:bg-rose-500/20' : 'hover:bg-zinc-800/30'}`}
// It means the sticky td needs a background color that matches the row's normal and hover state. This can be complex if the row changes background.
