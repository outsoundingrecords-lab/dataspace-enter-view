const fs = require('fs');
let content = fs.readFileSync('src/components/DirectoryTree.tsx', 'utf8');

content = content.replace(
`  const [isOpen, setIsOpen] = useState(level < 1);
  const isFolder = node.type === "folder";

  useEffect(() => {
    if (searchTerm) setIsOpen(true);
  }, [searchTerm]);

  const isSelected = selectedPath === node.path;`,
`  const [isOpen, setIsOpen] = useState(level < 1);
  const isFolder = node.type === "folder";
  const itemRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm) setIsOpen(true);
  }, [searchTerm]);

  const isSelected = selectedPath === node.path;

  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isSelected]);`
);

content = content.replace(
`      <div
        className={\`flex items-center gap-2 py-1 px-2 hover:bg-zinc-800/50 rounded-md cursor-pointer group text-sm \${isSelected ? "bg-indigo-500/20 text-indigo-300" : ""}\`}
        style={{ paddingLeft: \`\${level * 20}px\` }}
        onClick={(e) => {
          // If they click the chevron, toggle. If they click the text, select.
          // Let's just do both.
          setIsOpen(!isOpen);
          if (onSelect) onSelect(node.path);
        }}
      >`,
`      <div
        ref={itemRef}
        className={\`flex items-center gap-2 py-1 px-2 hover:bg-zinc-800/50 rounded-md cursor-pointer group text-sm \${isSelected ? "bg-indigo-500/20 text-indigo-300" : ""}\`}
        style={{ paddingLeft: \`\${level * 20}px\` }}
        onClick={(e) => {
          setIsOpen(!isOpen);
          if (onSelect) onSelect(node.path);
        }}
      >`
);

fs.writeFileSync('src/components/DirectoryTree.tsx', content);
