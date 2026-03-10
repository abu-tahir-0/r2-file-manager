"use client";

import { useState, useEffect, useCallback } from "react";
import { FileTable } from "@/components/file-table";
import { FileToolbar } from "@/components/file-toolbar";
import { RenameDialog } from "@/components/rename-dialog";
import { UploadDialog } from "@/components/upload-dialog";
import { Toaster, toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  HardDrive,
  Files,
  FolderOpen,
  BarChart3,
  Loader2,
} from "lucide-react";

export interface R2File {
  key: string;
  size: number;
  lastModified: string;
  etag?: string;
}

export interface R2Bucket {
  name: string;
  creationDate?: string;
}

export interface PrefixStats {
  prefix: string;
  totalSize: number;
  fileCount: number;
}

export type SortField = "key" | "size" | "lastModified";
export type SortDirection = "asc" | "desc";

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function FileManager() {
  const [buckets, setBuckets] = useState<R2Bucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState("");
  const [loadingBuckets, setLoadingBuckets] = useState(true);
  const [files, setFiles] = useState<R2File[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [folderStats, setFolderStats] = useState<Record<string, { totalSize: number; fileCount: number }>>({});
  const [bucketStats, setBucketStats] = useState<PrefixStats | null>(null);
  const [currentFolderStats, setCurrentFolderStats] = useState<PrefixStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("key");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [renameFile, setRenameFile] = useState<R2File | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [prefix, setPrefix] = useState("");
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [deleting, setDeleting] = useState(false);

  // Fetch buckets on mount
  useEffect(() => {
    async function fetchBuckets() {
      try {
        const res = await fetch("/api/buckets");
        if (!res.ok) throw new Error("Failed to fetch buckets");
        const data = await res.json();
        setBuckets(data.buckets);
        if (data.buckets.length > 0) {
          setSelectedBucket(data.buckets[0].name);
        }
      } catch {
        toast.error("Failed to load buckets");
      } finally {
        setLoadingBuckets(false);
      }
    }
    fetchBuckets();
  }, []);

  const fetchFiles = useCallback(async (bucket: string, prefixPath?: string, token?: string) => {
    if (!bucket) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("bucket", bucket);
      if (prefixPath) params.set("prefix", prefixPath);
      if (token) params.set("continuationToken", token);

      const res = await fetch(`/api/files?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch files");

      const data = await res.json();
      if (token) {
        setFiles((prev) => [...prev, ...data.files]);
      } else {
        setFiles(data.files);
      }
      setFolders(data.folders || []);
      setNextToken(data.nextToken);
    } catch {
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBucket) {
      setFiles([]);
      setFolders([]);
      setSelectedKeys(new Set());
      setFolderStats({});
      fetchFiles(selectedBucket, prefix);
    }
  }, [selectedBucket, prefix, fetchFiles]);

  // Fetch bucket-level stats for analytics (when at root or bucket changes)
  useEffect(() => {
    if (!selectedBucket) return;
    async function fetchBucketStats() {
      try {
        const params = new URLSearchParams({ bucket: selectedBucket });
        const res = await fetch(`/api/files/stats?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setBucketStats(data);
      } catch {
        // silently fail - analytics are non-critical
      }
    }
    fetchBucketStats();
  }, [selectedBucket]);

  // Fetch current folder stats when inside a folder
  useEffect(() => {
    if (!selectedBucket || !prefix) {
      setCurrentFolderStats(null);
      return;
    }
    async function fetchCurrentStats() {
      try {
        const params = new URLSearchParams({ bucket: selectedBucket, prefix });
        const res = await fetch(`/api/files/stats?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setCurrentFolderStats(data);
      } catch {
        // silently fail
      }
    }
    fetchCurrentStats();
  }, [selectedBucket, prefix]);

  // Fetch stats for visible folders
  useEffect(() => {
    if (!selectedBucket || folders.length === 0) return;
    async function fetchFolderStats() {
      try {
        const params = new URLSearchParams({
          bucket: selectedBucket,
          prefixes: folders.join(","),
        });
        const res = await fetch(`/api/files/stats?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        const statsMap: Record<string, { totalSize: number; fileCount: number }> = {};
        for (const s of data.stats) {
          statsMap[s.prefix] = { totalSize: s.totalSize, fileCount: s.fileCount };
        }
        setFolderStats(statsMap);
      } catch {
        // silently fail
      }
    }
    fetchFolderStats();
  }, [selectedBucket, folders]);

  const navigateToFolder = (folderPrefix: string) => {
    setSearchQuery("");
    setSelectedKeys(new Set());
    setPrefix(folderPrefix);
  };

  const navigateUp = () => {
    if (!prefix) return;
    // Remove trailing slash, then go up one level
    const trimmed = prefix.replace(/\/$/, "");
    const lastSlash = trimmed.lastIndexOf("/");
    setPrefix(lastSlash >= 0 ? trimmed.substring(0, lastSlash + 1) : "");
    setSearchQuery("");
    setSelectedKeys(new Set());
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedFiles = [...files].sort((a, b) => {
    const mul = sortDirection === "asc" ? 1 : -1;
    if (sortField === "key") return mul * a.key.localeCompare(b.key);
    if (sortField === "size") return mul * (a.size - b.size);
    if (sortField === "lastModified")
      return (
        mul *
        (new Date(a.lastModified).getTime() -
          new Date(b.lastModified).getTime())
      );
    return 0;
  });

  const filteredFiles = sortedFiles.filter((f) => {
    // Search against the relative file name (what the user sees), not the full key
    const relativeName = f.key.replace(prefix, "");
    return relativeName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedKeys(new Set(filteredFiles.map((f) => f.key)));
    } else {
      setSelectedKeys(new Set());
    }
  };

  const handleSelectFile = (key: string, checked: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const keys = Array.from(selectedKeys);
    if (keys.length === 0) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys, bucket: selectedBucket }),
      });
      if (!res.ok) throw new Error("Failed to delete");

      toast.success(`Deleted ${keys.length} file(s)`);
      setSelectedKeys(new Set());
      fetchFiles(selectedBucket, prefix);
    } catch {
      toast.error("Failed to delete files");
    } finally {
      setDeleting(false);
    }
  };

  const handleRename = async (oldKey: string, newKey: string) => {
    try {
      const res = await fetch("/api/files/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldKey, newKey, bucket: selectedBucket }),
      });
      if (!res.ok) throw new Error("Failed to rename");

      toast.success("File renamed successfully");
      setRenameFile(null);
      fetchFiles(selectedBucket, prefix);
    } catch {
      toast.error("Failed to rename file");
    }
  };

  const handleUpload = async (file: File, path: string) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", selectedBucket);
      if (path) formData.append("path", path);

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload");

      toast.success("File uploaded successfully");
      setShowUpload(false);
      fetchFiles(selectedBucket, prefix);
    } catch {
      toast.error("Failed to upload file");
    }
  };

  const handleDelete = async (key: string) => {
    try {
      const res = await fetch("/api/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: [key], bucket: selectedBucket }),
      });
      if (!res.ok) throw new Error("Failed to delete");

      toast.success("File deleted");
      fetchFiles(selectedBucket, prefix);
    } catch {
      toast.error("Failed to delete file");
    }
  };

  const handleLoadMore = () => {
    if (nextToken) fetchFiles(selectedBucket, prefix, nextToken);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              R2 File Manager
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage your Cloudflare R2 bucket files
            </p>
          </div>
          <ThemeToggle />
        </div>

        <FileToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCount={selectedKeys.size}
          onBulkDelete={handleBulkDelete}
          onUpload={() => setShowUpload(true)}
          deleting={deleting}
          prefix={prefix}
          onNavigate={navigateToFolder}
          onNavigateUp={navigateUp}
          buckets={buckets}
          selectedBucket={selectedBucket}
          onBucketChange={setSelectedBucket}
          loadingBuckets={loadingBuckets}
        />

        {/* Analytics cards at root */}
        {!prefix && bucketStats && (
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-blue-500/10 p-2">
                  <HardDrive className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Size</p>
                  <p className="text-xl font-semibold">{formatSize(bucketStats.totalSize)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-green-500/10 p-2">
                  <Files className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Files</p>
                  <p className="text-xl font-semibold">{bucketStats.fileCount.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-yellow-500/10 p-2">
                  <FolderOpen className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Folders</p>
                  <p className="text-xl font-semibold">{folders.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-purple-500/10 p-2">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg File Size</p>
                  <p className="text-xl font-semibold">
                    {bucketStats.fileCount > 0
                      ? formatSize(Math.round(bucketStats.totalSize / bucketStats.fileCount))
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current folder info bar */}
        {prefix && currentFolderStats && (
          <div className="mb-4 flex items-center gap-6 rounded-lg border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">
                {prefix.replace(/\/$/, "").split("/").pop()}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <HardDrive className="h-3.5 w-3.5" />
              <span>{formatSize(currentFolderStats.totalSize)}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Files className="h-3.5 w-3.5" />
              <span>{currentFolderStats.fileCount} file{currentFolderStats.fileCount !== 1 ? "s" : ""}</span>
            </div>
            {folders.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <FolderOpen className="h-3.5 w-3.5" />
                <span>{folders.length} subfolder{folders.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        )}

        {/* Loading stats indicator at root */}
        {!prefix && !bucketStats && selectedBucket && (
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-muted p-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                    <p className="text-xl font-semibold">—</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <FileTable
          files={filteredFiles}
          folders={folders}
          folderStats={folderStats}
          loading={loading}
          selectedKeys={selectedKeys}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onSelectAll={handleSelectAll}
          onSelectFile={handleSelectFile}
          onRename={(file) => setRenameFile(file)}
          onDelete={handleDelete}
          onNavigate={navigateToFolder}
          hasMore={!!nextToken}
          onLoadMore={handleLoadMore}
          bucket={selectedBucket}
          prefix={prefix}
        />

        <RenameDialog
          file={renameFile}
          onClose={() => setRenameFile(null)}
          onRename={handleRename}
        />

        <UploadDialog
          open={showUpload}
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
          currentPrefix={prefix}
        />
      </div>
    </div>
  );
}
