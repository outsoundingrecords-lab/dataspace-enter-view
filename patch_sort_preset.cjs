const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `                            <button onClick={() => { setSortField('modified_utc'); setSortOrder('desc'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300">Newest Files</button>
                            <button onClick={() => { setSortField('modified_utc'); setSortOrder('asc'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300">Oldest Files</button>
                          </div>`,
  `                            <button onClick={() => { setSortField('modified_utc'); setSortOrder('desc'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300">Newest Files</button>
                            <button onClick={() => { setSortField('modified_utc'); setSortOrder('asc'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300">Oldest Files</button>
                            <button onClick={() => { setSortField('sha256'); setSortOrder('asc'); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-zinc-800 text-sm text-zinc-300">By Hash</button>
                          </div>`
);
fs.writeFileSync('src/App.tsx', content);
