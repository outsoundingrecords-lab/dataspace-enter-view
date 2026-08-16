const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  `                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 lg:col-span-2">
                  <h3 className="text-sm font-medium text-zinc-200 mb-6">Storage by Directory</h3>`,
  `                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-zinc-200 mb-6">Hash Uniqueness Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hashUniquenessData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                          cursor={{ fill: '#27272a' }}
                        />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 lg:col-span-2">
                  <h3 className="text-sm font-medium text-zinc-200 mb-6">Storage by Directory</h3>`
);

fs.writeFileSync('src/App.tsx', content);
