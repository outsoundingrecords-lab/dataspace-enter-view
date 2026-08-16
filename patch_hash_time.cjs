const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Import CountUp
content = content.replace(
  `import { DirectoryTree } from './components/DirectoryTree';`,
  `import { DirectoryTree } from './components/DirectoryTree';\nimport { CountUp } from './components/CountUp';`
);

// Add hash time tracking state
content = content.replace(
  `  const [isExportingPDF, setIsExportingPDF] = useState(false);`,
  `  const [isExportingPDF, setIsExportingPDF] = useState(false);\n  const [hashCalculationTimes, setHashCalculationTimes] = useState<{count: number, totalTime: number}>({count: 0, totalTime: 0});`
);

// Update processFiles to track time
const oldProcessFilesHash = `      try {
        // Read file array buffer. May fail on extremely large files in browser.
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (err: any) {`;
const newProcessFilesHash = `      try {
        const buffer = await file.arrayBuffer();
        const t0 = performance.now();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const t1 = performance.now();
        setHashCalculationTimes(prev => ({ count: prev.count + 1, totalTime: prev.totalTime + (t1 - t0) }));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (err: any) {`;
content = content.replace(oldProcessFilesHash, newProcessFilesHash);

// Update computeHash (for single file hashing in the modal or wherever else)
const oldComputeHash = `    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);`;
const newComputeHash = `    const buffer = await file.arrayBuffer();
    const t0 = performance.now();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const t1 = performance.now();
    setHashCalculationTimes(prev => ({ count: prev.count + 1, totalTime: prev.totalTime + (t1 - t0) }));`;
content = content.replace(oldComputeHash, newComputeHash);

// Wait, I need to make sure I don't accidentally replace something weirdly. Let's write the patch script using specific line numbers or better regexes if it fails.
fs.writeFileSync('src/App.tsx', content);
