const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  const sizeHistogramData = useMemo(() => {`,
  `  const hashUniquenessData = useMemo(() => {
    if (!inventory) return [];
    const counts = new Map<string, number>();
    inventory.forEach(f => {
      if (f.sha256) counts.set(f.sha256, (counts.get(f.sha256) || 0) + 1);
    });
    const frequencies = { '1': 0, '2': 0, '3': 0, '4': 0, '5+': 0 };
    counts.forEach(count => {
      if (count === 1) frequencies['1'] += count;
      else if (count === 2) frequencies['2'] += count;
      else if (count === 3) frequencies['3'] += count;
      else if (count === 4) frequencies['4'] += count;
      else frequencies['5+'] += count;
    });
    return [
      { name: '1 Copy (Unique)', value: frequencies['1'] },
      { name: '2 Copies', value: frequencies['2'] },
      { name: '3 Copies', value: frequencies['3'] },
      { name: '4 Copies', value: frequencies['4'] },
      { name: '5+ Copies', value: frequencies['5+'] }
    ].filter(d => d.value > 0);
  }, [inventory]);

  const sizeHistogramData = useMemo(() => {`
);

fs.writeFileSync('src/App.tsx', content);
