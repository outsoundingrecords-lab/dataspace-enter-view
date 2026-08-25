import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { InventoryRow } from '../types';

interface DependencyMapProps {
  inventory: InventoryRow[];
  fileObjects: Map<string, File>;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
}

export function DependencyMap({ inventory, fileObjects }: DependencyMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { nodes, links } = useMemo(() => {
    const codeFiles = inventory.filter(f => 
      ['.js', '.jsx', '.ts', '.tsx'].includes(f.extension || '')
    );

    const nodesMap = new Map<string, Node>();
    const linksArray: Link[] = [];

    // Helper to get relative path resolution (simplistic)
    const resolveImport = (currentPath: string, importPath: string) => {
      if (!importPath.startsWith('.')) return null; // Ignore node_modules
      
      const currentParts = currentPath.split('/');
      currentParts.pop(); // remove filename
      
      const importParts = importPath.split('/');
      
      for (const part of importParts) {
        if (part === '.') continue;
        if (part === '..') {
          currentParts.pop();
        } else {
          currentParts.push(part);
        }
      }
      
      const resolved = currentParts.join('/');
      // Try to find matching file in inventory
      for (const ext of ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx']) {
        if (inventory.some(f => f.relative_path === resolved + ext || f.relative_path === resolved)) {
          return inventory.find(f => f.relative_path === resolved + ext || f.relative_path === resolved)?.relative_path;
        }
      }
      return null;
    };

    // First pass: create nodes
    codeFiles.forEach(f => {
      nodesMap.set(f.relative_path, {
        id: f.relative_path,
        group: f.relative_path.includes('components') ? 2 : 1
      });
    });

    // Second pass: extract imports from file content (sync via regex for simplicity)
    // Note: Since we are in useMemo, reading File objects synchronously isn't natively supported.
    // However, since we can't await inside useMemo easily, we will build a basic link structure 
    // for demonstration or use a simpler structure. To truly read files, we'd need an async effect.
    return { nodes: Array.from(nodesMap.values()), links: linksArray };
  }, [inventory]);

  // Async graph building
  const [graphData, setGraphData] = React.useState<{nodes: Node[], links: Link[]}>({ nodes: [], links: [] });
  
  useEffect(() => {
    let isMounted = true;
    
    const buildGraph = async () => {
      const codeFiles = inventory.filter(f => 
        ['.js', '.jsx', '.ts', '.tsx'].includes(f.extension || '')
      );

      const nodesMap = new Map<string, Node>();
      const linksArray: Link[] = [];
      
      codeFiles.forEach(f => {
        nodesMap.set(f.relative_path, {
          id: f.relative_path,
          group: f.relative_path.includes('components') ? 2 : 1
        });
      });

      const resolveImport = (currentPath: string, importPath: string) => {
        if (!importPath.startsWith('.')) return null; 
        const currentParts = currentPath.split('/');
        currentParts.pop(); 
        const importParts = importPath.split('/');
        for (const part of importParts) {
          if (part === '.') continue;
          if (part === '..') {
            currentParts.pop();
          } else {
            currentParts.push(part);
          }
        }
        let resolved = currentParts.join('/');
        
        // Strip extension from resolved for matching
        resolved = resolved.replace(/\.(tsx|ts|jsx|js)$/, '');
        
        const possibleMatches = [
          resolved + '.ts', resolved + '.tsx', resolved + '.js', resolved + '.jsx',
          resolved + '/index.ts', resolved + '/index.tsx', resolved + '/index.js', resolved + '/index.jsx'
        ];
        
        for (const extPath of possibleMatches) {
          if (nodesMap.has(extPath)) {
            return extPath;
          }
        }
        return null;
      };

      for (const file of codeFiles) {
        const fileObj = fileObjects.get(file.relative_path);
        if (!fileObj) continue;
        
        try {
          const text = await fileObj.text();
          // Match standard imports
          const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
          let match;
          while ((match = importRegex.exec(text)) !== null) {
            const importPath = match[1];
            const targetPath = resolveImport(file.relative_path, importPath);
            if (targetPath) {
              linksArray.push({
                source: file.relative_path,
                target: targetPath
              });
            }
          }
        } catch (err) {
          console.warn('Failed to read file for deps', file.relative_path);
        }
      }

      if (isMounted) {
        setGraphData({ nodes: Array.from(nodesMap.values()), links: linksArray });
      }
    };

    buildGraph();
    return () => { isMounted = false; };
  }, [inventory, fileObjects]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || graphData.nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    svg.attr("viewBox", [0, 0, width, height]);

    // Force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(30));

    // Links
    const link = svg.append("g")
      .attr("stroke", "#3f3f46")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke-width", 1.5);

    // Nodes
    const node = svg.append("g")
      .attr("stroke", "#27272a")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(graphData.nodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", (d: any) => d.group === 2 ? "#818cf8" : "#f472b6")
      .call(drag(simulation) as any);

    node.append("title")
      .text((d: any) => d.id);

    // Labels
    const labels = svg.append("g")
      .selectAll("text")
      .data(graphData.nodes)
      .join("text")
      .attr("dx", 12)
      .attr("dy", ".35em")
      .attr("fill", "#a1a1aa")
      .attr("font-size", "10px")
      .text((d: any) => d.id.split('/').pop());

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
        
      labels
        .attr("x", (d: any) => d.x)
        .attr("y", (d: any) => d.y);
    });

    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
    
    return () => {
      simulation.stop();
    };
  }, [graphData]);

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-zinc-950/50 border border-zinc-800 rounded-xl mt-4">
        <span className="text-zinc-500 text-sm animate-pulse">Analyzing dependencies...</span>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-hidden mt-4" ref={containerRef}>
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
          Dependency Map
        </h3>
        <div className="flex gap-4 text-xs text-zinc-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-indigo-400 inline-block"></span> Components</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-pink-400 inline-block"></span> Other Code</span>
        </div>
      </div>
      <div className="w-full overflow-hidden bg-zinc-950" style={{ height: '600px' }}>
        <svg ref={svgRef} className="w-full h-full cursor-move" />
      </div>
    </div>
  );
}
