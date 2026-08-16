const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /  const exportPDF = \(\) => \{[\s\S]*?doc\.save\('workspace-report\.pdf'\);\n  \};/;
const newFunc = `  const exportPDF = () => {
    if (!inventory) return;
    setIsExportingPDF(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('Workspace Analysis Report', 14, 22);
        
        doc.setFontSize(12);
        doc.text(\`Total Files: \${inventory.length}\`, 14, 32);
        doc.text(\`Total Size: \${formatBytes(totalSize)}\`, 14, 40);
        doc.text(\`Duplicate Groups: \${duplicates.length}\`, 14, 48);
        doc.text(\`Wasted Space: \${formatBytes(duplicateSize)}\`, 14, 56);

        const largestFiles = [...inventory].sort((a, b) => b.size_bytes - a.size_bytes).slice(0, 20);
        
        doc.text('Top 20 Largest Files:', 14, 70);
        const largestFilesData = largestFiles.map(file => [
          file.file_name,
          file.extension || 'none',
          formatBytes(file.size_bytes),
          file.relative_path
        ]);
        
        autoTable(doc, {
          startY: 75,
          head: [['File Name', 'Extension', 'Size', 'Path']],
          body: largestFilesData,
        });
        
        if (duplicates.length > 0) {
          const finalY = (doc).lastAutoTable?.finalY || 120;
          doc.text('Top Duplicates:', 14, finalY + 14);
          const tableData = duplicates.slice(0, 20).map(group => [
            group.sha256.substring(0, 12) + '...',
            group.count.toString(),
            formatBytes(group.size_bytes),
            group.paths[0]
          ]);
          
          autoTable(doc, {
            startY: finalY + 20,
            head: [['Hash', 'Count', 'Size Each', 'Example Path']],
            body: tableData,
          });
        }

        doc.save(\`workspace-report-\${Date.now()}.pdf\`);
      } catch (err) {
        console.error('Error generating PDF:', err);
      } finally {
        setIsExportingPDF(false);
      }
    }, 100);
  };`;

content = content.replace(regex, newFunc);
fs.writeFileSync('src/App.tsx', content);
