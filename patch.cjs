const fs = require('fs');
let content = fs.readFileSync('src/components/DirectoryTree.tsx', 'utf8');

content = content.replace(`  inventory.forEach((file) => {
    const parts = file.relative_path.split("/");
    let current = root;
    current.sizeBytes += file.size_bytes;
    parts.forEach((part, index) => {
      if (!current.children) current.children = {};
      if (!current.children[part]) {
        const isFile = index === parts.length - 1;
        current.children[part] = {
          name: part,
          type: isFile ? "file" : "folder",
          path: parts.slice(0, index + 1).join("/"),
          sizeBytes: 0,
          ...(isFile ? { fileData: file } : { children: {} }),
        };
      }
      current.children[part].sizeBytes += file.size_bytes;
      current = current.children[part];
    });
  });`, `  inventory.forEach((file) => {
    const parts = file.relative_path.split("/");
    let current = root;
    current.sizeBytes += file.size_bytes;
    current.fileCount += 1;
    parts.forEach((part, index) => {
      if (!current.children) current.children = {};
      if (!current.children[part]) {
        const isFile = index === parts.length - 1;
        current.children[part] = {
          name: part,
          type: isFile ? "file" : "folder",
          path: parts.slice(0, index + 1).join("/"),
          sizeBytes: 0,
          fileCount: 0,
          ...(isFile ? { fileData: file } : { children: {} }),
        };
      }
      current.children[part].sizeBytes += file.size_bytes;
      if (index === parts.length - 1) {
        current.children[part].fileCount = 1;
      } else {
        current.children[part].fileCount += 1;
      }
      current = current.children[part];
    });
  });`);

fs.writeFileSync('src/components/DirectoryTree.tsx', content);
