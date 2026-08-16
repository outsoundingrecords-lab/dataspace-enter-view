const fs = require('fs');
let content = fs.readFileSync('src/components/DirectoryTree.tsx', 'utf8');

const startIdx = content.indexOf('const buildTree = (inventory: InventoryRow[]) => {');
const endIdx = content.indexOf('const formatBytes = (bytes: number) => {');

const newFunc = `const buildTree = (inventory: InventoryRow[]) => {
  const root: TreeNode = {
    name: "root",
    type: "folder",
    path: "",
    children: {},
    sizeBytes: 0,
    fileCount: 0,
  };

  inventory.forEach((file) => {
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
  });
  return root;
};

`;

content = content.substring(0, startIdx) + newFunc + content.substring(endIdx);
fs.writeFileSync('src/components/DirectoryTree.tsx', content);
