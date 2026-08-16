const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. lastAutoTable
content = content.replace(
  `const finalY = (doc).lastAutoTable?.finalY || 120;`,
  `const finalY = (doc as any).lastAutoTable?.finalY || 120;`
);

// 2. Legend import - let's ensure it's there
if (!content.includes('Legend,')) {
  content = content.replace(
    `PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,`,
    `PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,`
  );
}

// 3. Legend onClick
content = content.replace(
  `                          onClick={(e) => {
                            if (!e || !e.value) return;`,
  `                          onClick={(e: any) => {
                            if (!e || !e.value) return;`
);

// 4. prev implicitly any
content = content.replace(
  `                            setHiddenExtensions(prev => {`,
  `                            setHiddenExtensions((prev: Set<string>) => {`
);

// 5. SortField type
content = content.replace(
  `type SortField = 'file_name' | 'size_bytes' | 'modified_utc';`,
  `type SortField = 'file_name' | 'size_bytes' | 'modified_utc' | 'sha256';`
);

// 6. boolean type for color condition?
// value: entry.name,
// color: hiddenExtensions.has(entry.name) ? '#52525b' : COLORS[index % COLORS.length]
// the error was Type 'unknown' is not assignable to type 'boolean | undefined'
// This error might be related to "hiddenExtensions.has(entry.name) ? '#52525b' : COLORS[index % COLORS.length]"
// But let's check line 1918. We'll fix it if needed. Wait, the error is: Type 'unknown' is not assignable to type 'boolean | undefined'. It might be for the \`checked\` prop somewhere, or something else. I'll cast it to boolean.

fs.writeFileSync('src/App.tsx', content);
