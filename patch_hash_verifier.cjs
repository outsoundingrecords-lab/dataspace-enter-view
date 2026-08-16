const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);`,
  `  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);
  const [showHashVerifier, setShowHashVerifier] = useState(false);
  const [verifierFile1, setVerifierFile1] = useState<{name: string, size: number, type: string, hash: string, file: File} | null>(null);
  const [verifierFile2, setVerifierFile2] = useState<{name: string, size: number, type: string, hash: string, file: File} | null>(null);`
);

content = content.replace(
  `  const computeSHA256 = async (file: File): Promise<string> => {`,
  `  const computeSHA256ForFile = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };
  const computeSHA256 = async (file: File): Promise<string> => {`
);

// wait, computeSHA256 already exists.
