export interface InventoryRow {
  relative_path: string;
  file_name: string;
  extension: string;
  size_bytes: number;
  modified_utc: string;
  mime_type: string;
  sha256: string;
  error?: string;
  tags?: string[];
  notes?: string;
  permissions?: string;
}

export interface DuplicateGroup {
  sha256: string;
  size_bytes: number;
  count: number;
  paths: string[];
}
