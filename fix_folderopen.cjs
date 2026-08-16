const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `<FolderOpen,
  ShieldAlert className="w-5 h-5" />`,
  `<FolderOpen className="w-5 h-5" />`
);

fs.writeFileSync('src/App.tsx', content);
