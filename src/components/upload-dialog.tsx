"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, path: string) => void;
  currentPrefix: string;
}

export function UploadDialog({
  open,
  onClose,
  onUpload,
  currentPrefix,
}: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [path, setPath] = useState(currentPrefix);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync path with currentPrefix when dialog opens or prefix changes
  useEffect(() => {
    if (open) {
      setPath(currentPrefix);
    }
  }, [open, currentPrefix]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    await onUpload(file, path);
    setUploading(false);
    setFile(null);
    setPath("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setFile(null);
          setPath(currentPrefix);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Select a file and optional path prefix for uploading to your R2
            bucket.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="file"
              ref={inputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {file ? file.name : "Choose File"}
            </Button>
            {file && (
              <p className="mt-1 text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          <Input
            placeholder="Path prefix (optional, e.g., images/)"
            value={path}
            onChange={(e) => setPath(e.target.value)}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
