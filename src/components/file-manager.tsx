"use client";

import { useState, useEffect, useCallback } from "react";
import { FileTable } from "@/components/file-table";
import { FileToolbar } from "@/components/file-toolbar";
import { RenameDialog } from "@/components/rename-dialog";
import { UploadDialog } from "@/components/upload-dialog";
import { Toaster, toast } from "sonner";

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

export type SortField = "key" | "size" | "lastModified";
export type SortDirection = "asc" | "desc";

export default function FileManager() {
  const [buckets, setBuckets] = useState<R2Bucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState("");
  const [loadingBuckets, setLoadingBuckets] = useState(true);
  const [files, setFiles] = useState<R2File[]>([]);
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
      setSelectedKeys(new Set());
      fetchFiles(selectedBucket, prefix);
    }
  }, [selectedBucket, prefix, fetchFiles]);

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

  const filteredFiles = sortedFiles.filter((f) =>
    f.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            R2 File Manager
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your Cloudflare R2 bucket files
          </p>
        </div>

        <FileToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCount={selectedKeys.size}
          onBulkDelete={handleBulkDelete}
          onUpload={() => setShowUpload(true)}
          deleting={deleting}
          prefix={prefix}
          onPrefixChange={setPrefix}
          buckets={buckets}
          selectedBucket={selectedBucket}
          onBucketChange={setSelectedBucket}
          loadingBuckets={loadingBuckets}
        />

        <FileTable
          files={filteredFiles}
          loading={loading}
          selectedKeys={selectedKeys}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onSelectAll={handleSelectAll}
          onSelectFile={handleSelectFile}
          onRename={(file) => setRenameFile(file)}
          onDelete={handleDelete}
          hasMore={!!nextToken}
          onLoadMore={handleLoadMore}
          bucket={selectedBucket}
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
