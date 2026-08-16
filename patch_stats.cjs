const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
`  const duplicateSize = duplicates.reduce((acc, g) => acc + (g.size_bytes * (g.count - 1)), 0);`,
`  const duplicateSize = duplicates.reduce((acc, g) => acc + (g.size_bytes * (g.count - 1)), 0);

  const emptyFiles = useMemo(() => inventory ? inventory.filter(f => f.size_bytes === 0) : [], [inventory]);
  const foldersCount = useMemo(() => {
    if (!inventory) return 0;
    const folders = new Set();
    inventory.forEach(f => {
      let currentPath = '';
      const parts = f.relative_path.split('/');
      parts.pop(); // remove file name
      for (const part of parts) {
        currentPath = currentPath ? \`\${currentPath}/\${part}\` : part;
        folders.add(currentPath);
      }
    });
    return folders.size || 1; // avoid division by zero
  }, [inventory]);
  const averageFilesPerFolder = inventory ? (inventory.length / foldersCount).toFixed(1) : '0';`
);

fs.writeFileSync('src/App.tsx', content);
