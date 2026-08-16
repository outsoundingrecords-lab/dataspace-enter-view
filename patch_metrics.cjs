const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The formatBytes should probably not be easily animatable without separating the value and suffix, but the user requested:
// "count-up animation for the metric cards (Total Files, Total Size)"
// We can use a custom formatter for Total Size.

content = content.replace(
  `<p className="text-2xl text-zinc-100 font-light">{inventory.length}</p>`,
  `<p className="text-2xl text-zinc-100 font-light"><CountUp end={inventory.length} /></p>`
);

content = content.replace(
  `<p className="text-2xl text-zinc-100 font-light">{formatBytes(totalSize)}</p>`,
  `<p className="text-2xl text-zinc-100 font-light"><CountUp end={totalSize} formatFn={formatBytes} /></p>`
);

content = content.replace(
  `<p className="text-2xl text-rose-400 font-light">{duplicates.length}</p>`,
  `<p className="text-2xl text-rose-400 font-light"><CountUp end={duplicates.length} /></p>`
);

content = content.replace(
  `<p className="text-2xl text-rose-400 font-light">{formatBytes(duplicateSize)}</p>`,
  `<p className="text-2xl text-rose-400 font-light"><CountUp end={duplicateSize} formatFn={formatBytes} /></p>`
);

// Add the new metric: Average Hash Calculation Time
const hashMetricCard = `
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <p className="text-sm text-zinc-500 mb-1 font-medium">Avg Hash Time</p>
                  <p className="text-2xl text-zinc-100 font-light">
                    {hashCalculationTimes.count > 0 
                      ? <CountUp end={Math.round(hashCalculationTimes.totalTime / hashCalculationTimes.count)} formatFn={(v) => v + ' ms'} /> 
                      : '0 ms'}
                  </p>
                </div>`;

content = content.replace(
  `                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <p className="text-sm text-zinc-500 mb-1 font-medium">Wasted Space</p>
                  <p className="text-2xl text-rose-400 font-light"><CountUp end={duplicateSize} formatFn={formatBytes} /></p>
                </div>`,
  `                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <p className="text-sm text-zinc-500 mb-1 font-medium">Wasted Space</p>
                  <p className="text-2xl text-rose-400 font-light"><CountUp end={duplicateSize} formatFn={formatBytes} /></p>
                </div>` + hashMetricCard
);

fs.writeFileSync('src/App.tsx', content);
