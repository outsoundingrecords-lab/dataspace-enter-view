const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `                          {columns.sha256 && (
                            <th className="px-6 py-3">SHA-256</th>
                          )}`,
  `                          {columns.sha256 && (
                            <th 
                              className="px-6 py-3 cursor-pointer hover:bg-zinc-900 transition-colors select-none group"
                              onClick={() => handleSort('sha256')}
                            >
                              <div className="flex items-center gap-1.5">
                                SHA-256 {renderSortIcon('sha256')}
                              </div>
                            </th>
                          )}`
);
fs.writeFileSync('src/App.tsx', content);
