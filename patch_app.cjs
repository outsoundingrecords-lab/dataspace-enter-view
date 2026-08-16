const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
`  const [highlightDuplicates, setHighlightDuplicates] = useState(false);
  const [treeSearchTerm, setTreeSearchTerm] = useState('');`,
`  const [highlightDuplicates, setHighlightDuplicates] = useState(false);
  const [treeSearchTerm, setTreeSearchTerm] = useState('');
  const [selectedTreePath, setSelectedTreePath] = useState('');`
);

content = content.replace(
`                  <DirectoryTree 
                    inventory={inventory} 
                    initialSearchTerm={treeSearchTerm}`,
`                  <DirectoryTree 
                    inventory={inventory} 
                    initialSearchTerm={treeSearchTerm}
                    selectedPath={selectedTreePath}`
);

content = content.replace(
`              <button
                onClick={() => {
                  const folderPath = selectedFileDetails.relative_path.split('/').slice(0, -1).join('/');
                  setTreeSearchTerm(folderPath);
                  setViewMode('tree');
                  setSelectedFileDetails(null);
                }}
                className="flex items-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg border border-zinc-700 transition-colors"
              >
                <Folder className="w-4 h-4 text-indigo-400" />
                View in Tree
              </button>`,
`              <button
                onClick={() => {
                  const folderPath = selectedFileDetails.relative_path.split('/').slice(0, -1).join('/');
                  setTreeSearchTerm(folderPath);
                  setSelectedTreePath(folderPath);
                  setViewMode('tree');
                  setSelectedFileDetails(null);
                }}
                className="flex items-center gap-2 text-sm bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-4 py-2 rounded-lg border border-indigo-500/30 transition-colors"
              >
                <Folder className="w-4 h-4 text-indigo-400" />
                Open Folder
              </button>`
);

fs.writeFileSync('src/App.tsx', content);
