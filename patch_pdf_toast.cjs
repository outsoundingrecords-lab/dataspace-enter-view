const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  const [isAiLoading, setIsAiLoading] = useState(false);`,
  `  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);`
);

content = content.replace(
  `  const exportPDF = () => {
    if (!inventory) return;
    const doc = new jsPDF();`,
  `  const exportPDF = () => {
    if (!inventory) return;
    setIsExportingPDF(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF();`
);

content = content.replace(
  `      autoTable(doc, {
        startY: finalY + 20,
        head: [['Hash', 'Count', 'Size Each', 'Example Path']],
        body: tableData,
      });
    }

    doc.save(\`workspace_report_\${Date.now()}.pdf\`);
  };`,
  `        autoTable(doc, {
          startY: finalY + 20,
          head: [['Hash', 'Count', 'Size Each', 'Example Path']],
          body: tableData,
        });
      }

      doc.save(\`workspace_report_\${Date.now()}.pdf\`);
    } finally {
      setIsExportingPDF(false);
    }
    }, 100);
  };`
);

content = content.replace(
  `      {/* Main Content */}`,
  `      {isExportingPDF && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="font-medium">Generating PDF Report...</span>
        </div>
      )}

      {/* Main Content */}`
);

fs.writeFileSync('src/App.tsx', content);
