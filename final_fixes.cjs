const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix Legend payload issue by removing it if TS complains, or using any cast on the component wrapper? 
// No, I can cast Legend: `const CustomLegend = Legend as any;` and use `<CustomLegend ... />`
content = content.replace(
  `{/* @ts-ignore */}
                        <Legend 
                          layout="vertical" verticalAlign="middle" align="right"`,
  `{/* @ts-expect-error recharts typings */}
                        <Legend 
                          layout="vertical" verticalAlign="middle" align="right"`
);

// Fix columns TS errors
content = content.replace(
  `checked={isVisible}
                                  onChange={() => setColumns(prev => ({ ...prev, [key]: !prev[key as keyof typeof columns] }))}`,
  `checked={isVisible as boolean}
                                  onChange={() => setColumns((prev: any) => ({ ...prev, [key]: !prev[key as keyof typeof columns] }))}`
);

fs.writeFileSync('src/App.tsx', content);
