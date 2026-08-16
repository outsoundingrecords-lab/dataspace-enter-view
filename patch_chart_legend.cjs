const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  const [sortField, setSortField] = useState<SortField>('size_bytes');`,
  `  const [hiddenExtensions, setHiddenExtensions] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('size_bytes');`
);

content = content.replace(
  `import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Treemap
} from 'recharts';`,
  `import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Treemap
} from 'recharts';`
);

content = content.replace(
  `  const extensionData = useMemo(() => {
    if (!inventory) return [];
    const counts = new Map<string, number>();
    inventory.forEach(f => {
      const ext = f.extension || 'none';
      counts.set(ext, (counts.get(ext) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [inventory]);`,
  `  const extensionData = useMemo(() => {
    if (!inventory) return [];
    const counts = new Map<string, number>();
    inventory.forEach(f => {
      const ext = f.extension || 'none';
      counts.set(ext, (counts.get(ext) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [inventory]);

  const visibleExtensionData = useMemo(() => extensionData.filter(d => !hiddenExtensions.has(d.name)), [extensionData, hiddenExtensions]);`
);

content = content.replace(
  `                        <Pie
                          data={extensionData}`,
  `                        <Pie
                          data={visibleExtensionData}`
);

content = content.replace(
  `                          {extensionData.map((entry, index) => (
                            <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>`,
  `                          {visibleExtensionData.map((entry, index) => {
                            const originalIndex = extensionData.findIndex(d => d.name === entry.name);
                            return <Cell key={\`cell-\${index}\`} fill={COLORS[originalIndex % COLORS.length]} />;
                          })}
                        </Pie>
                        <Legend 
                          layout="vertical" verticalAlign="middle" align="right"
                          payload={extensionData.map((entry, index) => ({
                            id: entry.name,
                            type: 'square',
                            value: entry.name,
                            color: hiddenExtensions.has(entry.name) ? '#52525b' : COLORS[index % COLORS.length]
                          }))}
                          onClick={(e) => {
                            if (!e || !e.value) return;
                            setHiddenExtensions(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(e.value)) newSet.delete(e.value);
                              else newSet.add(e.value);
                              return newSet;
                            });
                          }}
                          wrapperStyle={{ cursor: 'pointer', fontSize: '12px', color: '#a1a1aa' }}
                        />`
);

fs.writeFileSync('src/App.tsx', content);
