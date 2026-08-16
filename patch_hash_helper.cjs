const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  const [verifierFile2, setVerifierFile2] = useState<{name: string, size: number, type: string, hash: string, file: File} | null>(null);`,
  `  const [verifierFile2, setVerifierFile2] = useState<{name: string, size: number, type: string, hash: string, file: File} | null>(null);

  const computeHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };`
);
fs.writeFileSync('src/App.tsx', content);
