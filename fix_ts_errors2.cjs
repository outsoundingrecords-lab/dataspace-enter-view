const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `                        <Legend 
                          layout="vertical" verticalAlign="middle" align="right"`,
  `                        {/* @ts-ignore */}
                        <Legend 
                          layout="vertical" verticalAlign="middle" align="right"`
);

content = content.replace(
  `setHiddenExtensions(prev => {`,
  `setHiddenExtensions((prev: Set<string>) => {`
);

content = content.replace(
  `                          checked={mimeTypeFilters.has(mimeType)}
                          onChange={(e) => {
                            setMimeTypeFilters(prev => {`,
  `                          checked={Boolean(mimeTypeFilters.has(mimeType))}
                          onChange={(e) => {
                            setMimeTypeFilters((prev: Set<string>) => {`
);

content = content.replace(
  `                          checked={extensionFilters.has(ext)}
                          onChange={(e) => {
                            setExtensionFilters(prev => {`,
  `                          checked={Boolean(extensionFilters.has(ext))}
                          onChange={(e) => {
                            setExtensionFilters((prev: Set<string>) => {`
);


fs.writeFileSync('src/App.tsx', content);
