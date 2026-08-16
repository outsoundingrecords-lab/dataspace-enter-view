const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `                  <DirectoryTree 
                    inventory={inventory} `,
  `                  <DirectoryTree 
                    inventory={inventory} 
                    duplicateHashes={new Set(duplicates.map(d => d.sha256))} `
);
fs.writeFileSync('src/App.tsx', content);
