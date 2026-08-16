const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
`                  <div className="overflow-x-auto overflow-y-auto max-h-[600px] border-b border-zinc-800" ref={tableContainerRef}>`,
`                  <div id="table-top" className="overflow-x-auto overflow-y-auto max-h-[600px] border-b border-zinc-800" ref={tableContainerRef}>`
);

fs.writeFileSync('src/App.tsx', content);
