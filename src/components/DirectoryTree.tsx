import React, { useState, useMemo, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  File as FileIcon,
  Search,
} from "lucide-react";
import { InventoryRow } from "../types";

interface TreeNode {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: Record<string, TreeNode>;
  fileData?: InventoryRow;
  sizeBytes: number;
  fileCount: number;
  duplicateCount: number;
}

const buildTree = (inventory: InventoryRow[], duplicateHashes: Set<string>) => {
  const root: TreeNode = {
    name: "root",
    type: "folder",
    path: "",
    children: {},
    sizeBytes: 0,
    fileCount: 0,
    duplicateCount: 0,
  };

  inventory.forEach((file) => {
    const parts = file.relative_path.split("/");
    let current = root;
    const isDuplicate = file.sha256 ? duplicateHashes.has(file.sha256) : false;
    current.sizeBytes += file.size_bytes;
    current.fileCount += 1;
    if (isDuplicate) current.duplicateCount += 1;
    parts.forEach((part, index) => {
      if (!current.children) current.children = {};

      if (!current.children[part]) {
        const isFile = index === parts.length - 1;
        current.children[part] = {
          name: part,
          type: isFile ? "file" : "folder",
          path: parts.slice(0, index + 1).join("/"),
          sizeBytes: 0,
          fileCount: 0,
          duplicateCount: 0,
          ...(isFile ? { fileData: file } : { children: {} }),
        };
      }
      current.children[part].sizeBytes += file.size_bytes;
      if (isDuplicate) current.children[part].duplicateCount += 1;
      if (index === parts.length - 1) {
        current.children[part].fileCount = 1;
      } else {
        current.children[part].fileCount += 1;
      }
      current = current.children[part];
    });
  });
  return root;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const TreeItem: React.FC<{
  node: TreeNode;
  level?: number;
  searchTerm?: string;
  onSelect?: (path: string) => void;
  selectedPath?: string;
}> = ({ node, level = 0, searchTerm = "", onSelect, selectedPath }) => {
  const [isOpen, setIsOpen] = useState(level < 1);
  const isFolder = node.type === "folder";
  const itemRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm) setIsOpen(true);
  }, [searchTerm]);

  const isSelected = selectedPath === node.path;

  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isSelected]);

  if (!isFolder) {
    if (
      searchTerm &&
      !node.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return null;
    return (
      <div
        className="flex items-center gap-2 py-1 px-2 hover:bg-zinc-800/50 rounded-md group text-sm cursor-default"
        style={{ paddingLeft: `${level * 20 + 20}px` }}
      >
        <FileIcon className="w-4 h-4 text-zinc-500 flex-shrink-0" />
        <span className="text-zinc-300 truncate" title={node.name}>
          {node.name}
        </span>
        {node.fileData && (
          <span className="text-xs text-zinc-600 ml-auto flex-shrink-0 pl-2">
            {formatBytes(node.fileData.size_bytes)}
          </span>
        )}
      </div>
    );
  }

  const children = (Object.values(node.children || {}) as TreeNode[]).sort(
    (a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    },
  );

  const filterChildren = (nodes: TreeNode[]): TreeNode[] => {
    if (!searchTerm) return nodes;
    const lowerSearch = searchTerm.toLowerCase();

    return nodes.filter((n) => {
      if (n.name.toLowerCase().includes(lowerSearch)) return true;
      if (n.type === "folder" && n.children) {
        return filterChildren(Object.values(n.children)).length > 0;
      }
      return false;
    });
  };

  const visibleChildren = filterChildren(children);

  if (
    searchTerm &&
    visibleChildren.length === 0 &&
    !node.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) {
    return null;
  }

  return (
    <div>
      <div
        ref={itemRef}
        className={`flex items-center gap-2 py-1 px-2 hover:bg-zinc-800/50 rounded-md cursor-pointer group text-sm ${isSelected ? "bg-indigo-500/20 text-indigo-300" : ""}`}
        style={{ paddingLeft: `${level * 20}px` }}
        onClick={(e) => {
          setIsOpen(!isOpen);
          if (onSelect) onSelect(node.path);
        }}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 flex-shrink-0" />
        )}
        <Folder
          className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-indigo-400" : "text-indigo-500/70"}`}
        />
        <span
          className={`font-medium truncate ${isSelected ? "text-indigo-300" : (node.duplicateCount > 0 ? "text-rose-400" : "text-zinc-200")}`}
          title={node.name}
        >
          {node.name}
        </span>
        <span className="ml-1 inline-flex items-center justify-center bg-zinc-800 text-zinc-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px]">
          {node.fileCount || 0}
        </span>
        {node.duplicateCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full" title={`${node.duplicateCount} duplicate files inside`}>
            {node.duplicateCount} dups
          </span>
        )}
        <span className="text-xs text-zinc-600 ml-auto flex-shrink-0 pl-2">
          {formatBytes(node.sizeBytes)}
        </span>
      </div>

      {isOpen && (
        <div>
          {visibleChildren.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              level={level + 1}
              searchTerm={searchTerm}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function DirectoryTree({
  inventory,
  duplicateHashes,
  initialSearchTerm = "",
  onSelectPath,
  selectedPath,
}: {
  inventory: InventoryRow[];
  duplicateHashes?: Set<string>;
  initialSearchTerm?: string;
  onSelectPath?: (path: string) => void;
  selectedPath?: string;
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  const tree = useMemo(() => buildTree(inventory, duplicateHashes || new Set()), [inventory, duplicateHashes]);

  const children = Object.values(tree.children || {}) as TreeNode[];

  const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
    if (!searchTerm) return nodes;
    const lowerSearch = searchTerm.toLowerCase();

    return nodes.filter((n) => {
      if (n.name.toLowerCase().includes(lowerSearch)) return true;
      if (n.type === "folder" && n.children) {
        return filterChildrenRecursive(Object.values(n.children)).length > 0;
      }
      return false;
    });
  };

  const filterChildrenRecursive = (nodes: TreeNode[]): TreeNode[] => {
    if (!searchTerm) return nodes;
    const lowerSearch = searchTerm.toLowerCase();
    return nodes.filter((n) => {
      if (n.name.toLowerCase().includes(lowerSearch)) return true;
      if (n.type === "folder" && n.children) {
        return filterChildrenRecursive(Object.values(n.children)).length > 0;
      }
      return false;
    });
  };

  const visibleRootNodes = filterNodes(children);

  return (
    <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-hidden flex flex-col mt-4">
      <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
          <Folder className="w-4 h-4 text-indigo-400" />
          Directory Structure
        </h3>
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search folders and files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-indigo-500 w-64"
          />
        </div>
      </div>
      <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
        {visibleRootNodes.length > 0 ? (
          visibleRootNodes.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              searchTerm={searchTerm}
              onSelect={onSelectPath}
              selectedPath={selectedPath}
            />
          ))
        ) : (
          <div className="text-zinc-500 text-sm text-center py-8">
            No files or folders match your search.
          </div>
        )}
      </div>
    </div>
  );
}
