const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  BarChart, Bar, XAxis, YAxis, CartesianGrid, Treemap`,
  `  BarChart, Bar, XAxis, YAxis, CartesianGrid, Treemap, ScatterChart, Scatter, ZAxis`
);

// We need data for Scatter. Each point is a hash group.
// x: size_bytes (of one file)
// y: count (number of copies)
// name: hash or file name
content = content.replace(
  `  const visibleExtensionData = useMemo(() => extensionData.filter(d => !hiddenExtensions.has(d.name)), [extensionData, hiddenExtensions]);`,
  `  const visibleExtensionData = useMemo(() => extensionData.filter(d => !hiddenExtensions.has(d.name)), [extensionData, hiddenExtensions]);

  const scatterData = useMemo(() => {
    if (!inventory) return [];
    // We want all files grouped by hash
    const map = new Map<string, { size: number, count: number, name: string }>();
    inventory.forEach(f => {
      if (!f.sha256) return;
      if (!map.has(f.sha256)) {
        map.set(f.sha256, { size: f.size_bytes, count: 1, name: f.file_name });
      } else {
        map.get(f.sha256)!.count++;
      }
    });
    return Array.from(map.values()).map(d => ({
      x: d.size,
      y: d.count,
      name: d.name
    }));
  }, [inventory]);`
);

// Insert ScatterChart below the Histogram
// Find the closing div for the extension pie chart or duplicates histogram
const scatterChartJSX = `
              {/* Scatter Plot for Hash Distribution */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-400" />
                    Data Redundancy Map
                  </h3>
                  <p className="text-sm text-zinc-400">Distribution of unique vs highly duplicated files by size.</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis type="number" dataKey="x" name="File Size" stroke="#52525b" tickFormatter={formatBytes} />
                      <YAxis type="number" dataKey="y" name="Copies" stroke="#52525b" allowDecimals={false} />
                      <RechartsTooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '0.5rem', color: '#e4e4e7' }}
                        formatter={(value: number, name: string) => [name === 'File Size' ? formatBytes(value) : value, name]}
                      />
                      <Scatter name="Files" data={scatterData} fill="#818cf8" opacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>`;

content = content.replace(
  `              {/* Histogram of Duplicate Frequencies */}`,
  scatterChartJSX + `\n\n              {/* Histogram of Duplicate Frequencies */}`
);

fs.writeFileSync('src/App.tsx', content);
