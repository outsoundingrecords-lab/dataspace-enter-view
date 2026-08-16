const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  const downloadJSON = () => {`,
  `  const downloadFilteredJSON = () => {
    if (!sortedInventory) return;
    const blob = new Blob([JSON.stringify(sortedInventory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`filtered_inventory_\${Date.now()}.json\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {`
);

content = content.replace(
  `                    <button onClick={downloadJSON} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                      Download duplicates.json
                    </button>`,
  `                    <button onClick={downloadJSON} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                      Download duplicates.json
                    </button>
                    <button onClick={downloadFilteredJSON} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
                      Export Filtered View (JSON)
                    </button>`
);

fs.writeFileSync('src/App.tsx', content);
