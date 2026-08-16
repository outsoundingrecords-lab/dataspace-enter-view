const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `{/* @ts-expect-error recharts typings */}
                        <Legend `,
  `                        {/* @ts-expect-error recharts typings */}
                        <Legend `
);

// Actually, I'll just remove the @ts-expect-error and cast Legend
content = content.replace(
  `  BarChart, Bar, XAxis, YAxis, CartesianGrid, Treemap
} from 'recharts';`,
  `  BarChart, Bar, XAxis, YAxis, CartesianGrid, Treemap
} from 'recharts';
const RechartsLegend: any = Legend;`
);

content = content.replace(
  `{/* @ts-expect-error recharts typings */}
                        <Legend `,
  `<RechartsLegend `
);

content = content.replace(
  `wrapperStyle={{ cursor: 'pointer', fontSize: '12px', color: '#a1a1aa' }}
                        />`,
  `wrapperStyle={{ cursor: 'pointer', fontSize: '12px', color: '#a1a1aa' }}
                        />`
).replace(/<\/Legend>/g, '</RechartsLegend>');

fs.writeFileSync('src/App.tsx', content);
