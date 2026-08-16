const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `  const [sortField, setSortField] = useState<SortField>('size_bytes');`,
  `  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('size_bytes');`
);

content = content.replace(
  `                          {columns.tags && (
                            <th className="px-6 py-3">Tags</th>
                          )}
                        </tr>`,
  `                          {columns.tags && (
                            <th className="px-6 py-3">Tags</th>
                          )}
                          <th className="px-6 py-3 w-10"></th>
                        </tr>`
);

content = content.replace(
  `                                    </div>
                                  </td>
                                )}
                              </tr>`,
  `                                    </div>
                                  </td>
                                )}
                                <td className="px-6 py-3 relative text-right">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setActiveRowMenu(activeRowMenu === file.relative_path ? null : file.relative_path); }}
                                    className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                                  >
                                    <span className="sr-only">Open actions</span>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                  </button>
                                  {activeRowMenu === file.relative_path && (
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden text-left" onClick={e => e.stopPropagation()}>
                                      <button 
                                        className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                                        onClick={() => {
                                          setSelectedFileDetails(file);
                                          setIsRenaming(true);
                                          setRenameInput(file.file_name);
                                          setActiveRowMenu(null);
                                        }}
                                      >Rename</button>
                                      <button 
                                        className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                                        onClick={() => {
                                          setSelectedFileDetails(file);
                                          setActiveRowMenu(null);
                                        }}
                                      >Tag</button>
                                      <button 
                                        className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-zinc-800 transition-colors"
                                        onClick={() => {
                                          if (window.confirm('Are you sure you want to delete this file?')) {
                                            const newInv = inventory.filter(f => f.relative_path !== file.relative_path);
                                            setInventory(newInv);
                                          }
                                          setActiveRowMenu(null);
                                        }}
                                      >Delete</button>
                                    </div>
                                  )}
                                </td>
                              </tr>`
);

fs.writeFileSync('src/App.tsx', content);
