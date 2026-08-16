const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  const [sortField, setSortField] = useState<SortField>('size_bytes');`,
  `  const [filterOnlyDuplicates, setFilterOnlyDuplicates] = useState(false);
  const [sortField, setSortField] = useState<SortField>('size_bytes');`
);

content = content.replace(
  `    if (mimeTypeFilters.size > 0) {
      filtered = filtered.filter(f => mimeTypeFilters.has(f.mime_type || 'unknown/none'));
    }
    
    return filtered.sort((a, b) => {`,
  `    if (mimeTypeFilters.size > 0) {
      filtered = filtered.filter(f => mimeTypeFilters.has(f.mime_type || 'unknown/none'));
    }

    if (filterOnlyDuplicates) {
      const dupHashes = new Set(duplicates.map(d => d.sha256));
      filtered = filtered.filter(f => f.sha256 && dupHashes.has(f.sha256));
    }
    
    return filtered.sort((a, b) => {`
);

content = content.replace(
  `  }, [inventory, sortField, sortOrder, dateStart, dateEnd, fileSearch, extensionFilters, mimeTypeFilters]);`,
  `  }, [inventory, sortField, sortOrder, dateStart, dateEnd, fileSearch, extensionFilters, mimeTypeFilters, filterOnlyDuplicates, duplicates]);`
);

content = content.replace(
  `              {/* Full File Inventory Table */}
              <div className="flex items-center justify-between mt-12 mb-4">
                <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-indigo-400" />
                  File Explorer
                </h2>
              </div>`,
  `              {/* Full File Inventory Table */}
              <div className="flex flex-wrap items-center justify-between mt-12 mb-4 gap-4">
                <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-indigo-400" />
                  File Explorer
                </h2>
                <div className="flex items-center gap-4 text-sm text-zinc-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={filterOnlyDuplicates}
                      onChange={e => setFilterOnlyDuplicates(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                    />
                    Only show duplicates
                  </label>
                </div>
              </div>`
);

fs.writeFileSync('src/App.tsx', content);
