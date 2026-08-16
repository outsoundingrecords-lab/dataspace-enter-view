const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  const handleRefresh = () => {
    setInventory(null);`,
  `  const handleRefresh = () => {
    if (!window.confirm("Are you sure you want to reset the workspace? All loaded data will be cleared.")) return;
    setInventory(null);`
);

fs.writeFileSync('src/App.tsx', content);
