const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import html2canvas from 'html2canvas';",
  "import { toPng } from 'html-to-image';"
);

content = content.replace(
  "const canvas = await html2canvas(chartsContainer, { backgroundColor: '#09090b' });\n      const url = canvas.toDataURL('image/png');",
  "const url = await toPng(chartsContainer, { backgroundColor: '#09090b' });"
);

fs.writeFileSync('src/App.tsx', content);
