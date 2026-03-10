"use client";

import { R2Bucket } from "@/components/file-manager";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Trash2, Upload, ChevronRight, Home, ArrowLeft, Database } from "lucide-react";

interface FileToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  onBulkDelete: () => void;
  onUpload: () => void;
  deleting: boolean;
  prefix: string;
  onNavigate: (prefix: string) => void;
  onNavigateUp: () => void;
  buckets: R2Bucket[];
  selectedBucket: string;
  onBucketChange: (bucket: string) => void;
  loadingBuckets: boolean;
}

function Breadcrumb({ prefix, onNavigate }: { prefix: string; onNavigate: (prefix: string) => void }) {
  const parts = prefix ? prefix.replace(/\/$/, "").split("/") : [];

  return (
    <div className="flex items-center gap-1 text-sm flex-wrap">
      <button
        onClick={() => onNavigate("")}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Root</span>
      </button>
      {parts.map((part, i) => {
        const path = parts.slice(0, i + 1).join("/") + "/";
        const isLast = i === parts.length - 1;
        return (
          <div key={path} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            {isLast ? (
              <span className="rounded px-1.5 py-0.5 font-medium">{part}</span>
            ) : (
              <button
                onClick={() => onNavigate(path)}
                className="rounded px-1.5 py-0.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {part}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FileToolbar({
  searchQuery,
  onSearchChange,
  selectedCount,
  onBulkDelete,
  onUpload,
  deleting,
  prefix,
  onNavigate,
  onNavigateUp,
  buckets,
  selectedBucket,
  onBucketChange,
  loadingBuckets,
}: FileToolbarProps) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px]">
          <Select value={selectedBucket} onValueChange={(v) => { if (v) onBucketChange(v); }} disabled={loadingBuckets}>
            <SelectTrigger className="w-full gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder={loadingBuckets ? "Loading buckets..." : "Select bucket"} />
            </SelectTrigger>
            <SelectContent>
              {buckets.map((b) => (
                <SelectItem key={b.name} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={onUpload} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload
        </Button>

        {selectedCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger
              className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
              Delete {selectedCount} file{selectedCount > 1 ? "s" : ""}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete files?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {selectedCount} selected file
                  {selectedCount > 1 ? "s" : ""} from your R2 bucket. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onBulkDelete}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2">
        {prefix && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onNavigateUp}>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
        )}
        <Breadcrumb prefix={prefix} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
