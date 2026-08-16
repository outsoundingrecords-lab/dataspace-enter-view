const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Thead modifications
content = content.replace(
  `                          <th className="px-6 py-3 w-10">
                            <input 
                              type="checkbox"`,
  `                          <th className="px-4 py-3 w-[50px] min-w-[50px] max-w-[50px] sticky left-0 z-30 bg-zinc-950 shadow-[1px_0_0_#27272a]">
                            <input 
                              type="checkbox"`
);

content = content.replace(
  `                          {columns.thumbnail && (
                            <th className="px-6 py-3 w-14 text-center">
                              <span className="sr-only">Thumbnail</span>
                            </th>
                          )}`,
  `                          {columns.thumbnail && (
                            <th className="px-2 py-3 w-[60px] min-w-[60px] max-w-[60px] text-center sticky z-30 bg-zinc-950 shadow-[1px_0_0_#27272a]" style={{ left: 50 }}>
                              <span className="sr-only">Thumbnail</span>
                            </th>
                          )}`
);

content = content.replace(
  `                          {columns.fileName && (
                            <th 
                              className="px-6 py-3 cursor-pointer hover:bg-zinc-900 transition-colors select-none group"
                              onClick={() => handleSort('file_name')}
                            >`,
  `                          {columns.fileName && (
                            <th 
                              className="px-4 py-3 cursor-pointer hover:bg-zinc-900 transition-colors select-none group sticky z-30 bg-zinc-950 shadow-[1px_0_0_#27272a,5px_0_15px_-3px_rgba(0,0,0,0.5)]"
                              style={{ left: columns.thumbnail ? 110 : 50 }}
                              onClick={() => handleSort('file_name')}
                            >`
);

// Tbody TR modifications
content = content.replace(
  `                              <tr 
                                key={\`\${file.sha256}-\${file.relative_path}\`} 
                                className={\`animate-in fade-in duration-300 transition-colors cursor-pointer \${isDuplicate ? 'bg-rose-500/10 hover:bg-rose-500/20' : 'hover:bg-zinc-800/30'}\`}`,
  `                              <tr 
                                key={\`\${file.sha256}-\${file.relative_path}\`} 
                                className={\`group animate-in fade-in duration-300 transition-colors cursor-pointer \${isDuplicate ? 'bg-rose-500/10 hover:bg-rose-500/20' : 'hover:bg-zinc-800/30'}\`}`
);

// Tbody TD modifications
content = content.replace(
  `                                <td className="px-6 py-3 w-10" onClick={e => e.stopPropagation()}>`,
  `                                <td className={\`px-4 py-3 w-[50px] min-w-[50px] max-w-[50px] sticky left-0 z-20 shadow-[1px_0_0_#27272a] \${isDuplicate ? 'bg-[#1a0f14] group-hover:bg-[#2a141d]' : 'bg-zinc-950 group-hover:bg-zinc-900'}\`} onClick={e => e.stopPropagation()}>`
);

content = content.replace(
  `                                {columns.thumbnail && (
                                  <td className="px-6 py-3 w-14">
                                    <Thumbnail fileInfo={file} fileObjectsRef={fileObjectsRef} />
                                  </td>
                                )}`,
  `                                {columns.thumbnail && (
                                  <td className={\`px-2 py-3 w-[60px] min-w-[60px] max-w-[60px] sticky z-20 shadow-[1px_0_0_#27272a] \${isDuplicate ? 'bg-[#1a0f14] group-hover:bg-[#2a141d]' : 'bg-zinc-950 group-hover:bg-zinc-900'}\`} style={{ left: 50 }}>
                                    <Thumbnail fileInfo={file} fileObjectsRef={fileObjectsRef} />
                                  </td>
                                )}`
);

content = content.replace(
  `                                {columns.fileName && (
                                  <td className="px-6 py-3 max-w-[200px] md:max-w-[400px]">
                                    <div className="flex items-center justify-between gap-2">`,
  `                                {columns.fileName && (
                                  <td className={\`px-4 py-3 max-w-[200px] md:max-w-[400px] sticky z-20 shadow-[1px_0_0_#27272a,5px_0_15px_-3px_rgba(0,0,0,0.5)] \${isDuplicate ? 'bg-[#1a0f14] group-hover:bg-[#2a141d]' : 'bg-zinc-950 group-hover:bg-zinc-900'}\`} style={{ left: columns.thumbnail ? 110 : 50 }}>
                                    <div className="flex items-center justify-between gap-2">`
);

fs.writeFileSync('src/App.tsx', content);
