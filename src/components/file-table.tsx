"use client";

import { R2File, SortField, SortDirection } from "@/components/file-manager";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Download,
  Link,
  File,
  FileImage,
  FileText,
  FileVideo,
  FileArchive,
  Folder,
  Loader2,
} from "lucide-react";

interface FileTableProps {
  files: R2File[];
  folders: string[];
  folderStats: Record<string, { totalSize: number; fileCount: number }>;
  loading: boolean;
  selectedKeys: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onSelectAll: (checked: boolean) => void;
  onSelectFile: (key: string, checked: boolean) => void;
  onRename: (file: R2File) => void;
  onDelete: (key: string) => void;
  onNavigate: (folderPrefix: string) => void;
  hasMore: boolean;
  onLoadMore: () => void;
  bucket: string;
  prefix: string;
  r2Endpoint: string;
  publicDomain: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileIcon(key: string) {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "ico", "bmp"].includes(ext))
    return <FileImage className="h-4 w-4 text-blue-500" />;
  if (["mp4", "webm", "avi", "mov", "mkv"].includes(ext))
    return <FileVideo className="h-4 w-4 text-purple-500" />;
  if (["txt", "md", "json", "csv", "xml", "html", "css", "js", "ts"].includes(ext))
    return <FileText className="h-4 w-4 text-green-500" />;
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext))
    return <FileArchive className="h-4 w-4 text-yellow-500" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function getExtBadge(key: string) {
  const ext = key.split(".").pop()?.toLowerCase();
  if (!ext || ext === key.toLowerCase()) return null;
  return (
    <Badge variant="secondary" className="ml-2 text-xs font-normal">
      {ext.toUpperCase()}
    </Badge>
  );
}

function SortIcon({
  field,
  sortField,
  sortDirection,
}: {
  field: SortField;
  sortField: SortField;
  sortDirection: SortDirection;
}) {
  if (field !== sortField)
    return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />;
  if (sortDirection === "asc") return <ArrowUp className="ml-1 h-3 w-3" />;
  return <ArrowDown className="ml-1 h-3 w-3" />;
}

function getFolderName(folderPrefix: string, currentPrefix: string): string {
  // Remove the current prefix to show relative name
  const relative = folderPrefix.replace(currentPrefix, "");
  // Remove trailing slash
  return relative.replace(/\/$/, "");
}

function getFileName(key: string, currentPrefix: string): string {
  return key.replace(currentPrefix, "");
}

export function FileTable({
  files,
  folders,
  folderStats,
  loading,
  selectedKeys,
  sortField,
  sortDirection,
  onSort,
  onSelectAll,
  onSelectFile,
  onRename,
  onDelete,
  onNavigate,
  hasMore,
  onLoadMore,
  bucket,
  prefix,
  r2Endpoint,
  publicDomain,
}: FileTableProps) {
  const getFileUrl = (key: string) => {
    if (publicDomain) {
      return `${publicDomain.replace(/\/$/, "")}/${key}`;
    }
    return `${r2Endpoint}/${bucket}/${key}`;
  };
  const allSelected =
    files.length > 0 && files.every((f) => selectedKeys.has(f.key));
  const someSelected = files.some((f) => selectedKeys.has(f.key));

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                indeterminate={!allSelected && someSelected}
                onCheckedChange={(checked) => onSelectAll(checked === true)}
              />
            </TableHead>
            <TableHead>
              <button
                className="flex items-center font-medium hover:text-foreground"
                onClick={() => onSort("key")}
              >
                Name
                <SortIcon
                  field="key"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </button>
            </TableHead>
            <TableHead className="w-32">
              <button
                className="flex items-center font-medium hover:text-foreground"
                onClick={() => onSort("size")}
              >
                Size
                <SortIcon
                  field="size"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </button>
            </TableHead>
            <TableHead className="w-48">
              <button
                className="flex items-center font-medium hover:text-foreground"
                onClick={() => onSort("lastModified")}
              >
                Modified
                <SortIcon
                  field="lastModified"
                  sortField={sortField}
                  sortDirection={sortDirection}
                />
              </button>
            </TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && files.length === 0 && folders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading files...
                </div>
              </TableCell>
            </TableRow>
          ) : files.length === 0 && folders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center">
                <div className="text-muted-foreground">
                  No files found. Upload one to get started.
                </div>
              </TableCell>
            </TableRow>
          ) : (
            <>
              {folders.map((folder) => {
                const stats = folderStats[folder];
                return (
                <TableRow
                  key={folder}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onNavigate(folder)}
                >
                  <TableCell>
                    <div className="w-4" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-yellow-500 fill-yellow-500/20" />
                      <span className="font-medium">
                        {getFolderName(folder, prefix)}
                      </span>
                      {stats && (
                        <Badge variant="outline" className="ml-1 text-xs font-normal text-muted-foreground">
                          {stats.fileCount} file{stats.fileCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {stats ? formatSize(stats.totalSize) : (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell />
                </TableRow>
                );
              })}
              {files.map((file) => (
              <TableRow
                key={file.key}
                className={
                  selectedKeys.has(file.key)
                    ? "bg-muted/50"
                    : undefined
                }
              >
                <TableCell>
                  <Checkbox
                    checked={selectedKeys.has(file.key)}
                    onCheckedChange={(checked) =>
                      onSelectFile(file.key, checked === true)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getFileIcon(file.key)}
                    <span className="truncate max-w-md" title={file.key}>
                      {getFileName(file.key, prefix)}
                    </span>
                    {getExtBadge(file.key)}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatSize(file.size)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(file.lastModified)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          const url = getFileUrl(file.key);
                          navigator.clipboard.writeText(url);
                          toast.success("Link copied to clipboard", { description: url });
                        }}
                      >
                        <Link className="mr-2 h-4 w-4" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(
                            `/api/files/download?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(file.key)}`,
                            "_blank"
                          )
                        }
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRename(file)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(file.key)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
            }
            </>
          )}
        </TableBody>
      </Table>

      {hasMore && (
        <div className="flex justify-center border-t p-4">
          <Button variant="outline" onClick={onLoadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}

      {files.length > 0 && (
        <div className="border-t px-4 py-3 text-sm text-muted-foreground">
          {selectedKeys.size > 0
            ? `${selectedKeys.size} of ${files.length} file(s) selected`
            : `${files.length} file(s)`}
        </div>
      )}
    </div>
  );
}
