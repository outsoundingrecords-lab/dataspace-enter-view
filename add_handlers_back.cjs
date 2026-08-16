const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const handlers = `
  const handleClearTags = () => {
    if (!inventory || selectedPaths.size === 0) return;
    const updatedInventory = inventory.map(file => {
      if (selectedPaths.has(file.relative_path)) {
        return { ...file, tags: [] };
      }
      return file;
    });
    setInventory(updatedInventory);
  };

  const handleBulkRename = () => {
    if (!inventory || selectedPaths.size === 0) return;
    const updatedInventory = inventory.map(file => {
      if (selectedPaths.has(file.relative_path)) {
        let newName = file.file_name;
        if (bulkRenameMode === 'prefix' && bulkRenamePrefix) {
          newName = bulkRenamePrefix + newName;
        } else if (bulkRenameMode === 'suffix' && bulkRenameSuffix) {
          const lastDotIdx = newName.lastIndexOf('.');
          if (lastDotIdx !== -1) {
            newName = newName.slice(0, lastDotIdx) + bulkRenameSuffix + newName.slice(lastDotIdx);
          } else {
            newName = newName + bulkRenameSuffix;
          }
        } else if (bulkRenameMode === 'replace' && bulkRenameFind) {
          newName = newName.split(bulkRenameFind).join(bulkRenameReplace);
        }
        
        const pathParts = file.relative_path.split('/');
        pathParts[pathParts.length - 1] = newName;
        const newRelativePath = pathParts.join('/');

        return {
          ...file,
          file_name: newName,
          relative_path: newRelativePath
        };
      }
      return file;
    });
    setInventory(updatedInventory);
    setShowBulkRenameModal(false);
    setSelectedPaths(new Set());
  };
`;

content = content.replace(
  `  const handleBulkTag = () => {`,
  handlers + `\n  const handleBulkTag = () => {`
);

fs.writeFileSync('src/App.tsx', content);
