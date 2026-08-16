const fs = require('fs');
let content = fs.readFileSync('src/components/DirectoryTree.tsx', 'utf8');

content = content.replace(
  `  fileCount: number;
}

const buildTree = (inventory: InventoryRow[]) => {`,
  `  fileCount: number;
  duplicateCount: number;
}

const buildTree = (inventory: InventoryRow[], duplicateHashes: Set<string>) => {`
);

content = content.replace(
  `    sizeBytes: 0,
    fileCount: 0,
  };`,
  `    sizeBytes: 0,
    fileCount: 0,
    duplicateCount: 0,
  };`
);

content = content.replace(
  `  inventory.forEach((file) => {
    const parts = file.relative_path.split("/");
    let current = root;
    current.sizeBytes += file.size_bytes;
    current.fileCount += 1;`,
  `  inventory.forEach((file) => {
    const parts = file.relative_path.split("/");
    let current = root;
    const isDuplicate = file.sha256 ? duplicateHashes.has(file.sha256) : false;
    current.sizeBytes += file.size_bytes;
    current.fileCount += 1;
    if (isDuplicate) current.duplicateCount += 1;`
);

content = content.replace(
  `          sizeBytes: 0,
          fileCount: 0,
          ...(isFile ? { fileData: file } : { children: {} }),
        };
      }
      current.children[part].sizeBytes += file.size_bytes;`,
  `          sizeBytes: 0,
          fileCount: 0,
          duplicateCount: 0,
          ...(isFile ? { fileData: file } : { children: {} }),
        };
      }
      current.children[part].sizeBytes += file.size_bytes;
      if (isDuplicate) current.children[part].duplicateCount += 1;`
);

content = content.replace(
  `        <span
          className={\`font-medium truncate \${isSelected ? "text-indigo-300" : "text-zinc-200"}\`}
          title={node.name}
        >`,
  `        <span
          className={\`font-medium truncate \${isSelected ? "text-indigo-300" : (node.duplicateCount > 0 ? "text-rose-400" : "text-zinc-200")}\`}
          title={node.name}
        >`
);

content = content.replace(
  `        <span className="ml-1 inline-flex items-center justify-center bg-zinc-800 text-zinc-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px]">
          {node.fileCount || 0}
        </span>`,
  `        <span className="ml-1 inline-flex items-center justify-center bg-zinc-800 text-zinc-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px]">
          {node.fileCount || 0}
        </span>
        {node.duplicateCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full" title={\`\${node.duplicateCount} duplicate files inside\`}>
            {node.duplicateCount} dups
          </span>
        )}`
);

content = content.replace(
  `export function DirectoryTree({
  inventory,
  initialSearchTerm = "",
  onSelectPath,
  selectedPath,
}: {
  inventory: InventoryRow[];
  initialSearchTerm?: string;
  onSelectPath?: (path: string) => void;
  selectedPath?: string;
}) {`,
  `export function DirectoryTree({
  inventory,
  duplicateHashes,
  initialSearchTerm = "",
  onSelectPath,
  selectedPath,
}: {
  inventory: InventoryRow[];
  duplicateHashes?: Set<string>;
  initialSearchTerm?: string;
  onSelectPath?: (path: string) => void;
  selectedPath?: string;
}) {`
);

content = content.replace(
  `const tree = useMemo(() => buildTree(inventory), [inventory]);`,
  `const tree = useMemo(() => buildTree(inventory, duplicateHashes || new Set()), [inventory, duplicateHashes]);`
);

fs.writeFileSync('src/components/DirectoryTree.tsx', content);
