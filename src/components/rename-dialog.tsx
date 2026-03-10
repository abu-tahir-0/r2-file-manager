"use client";

import { useState, useEffect } from "react";
import { R2File } from "@/components/file-manager";
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

interface RenameDialogProps {
  file: R2File | null;
  onClose: () => void;
  onRename: (oldKey: string, newKey: string) => void;
}

export function RenameDialog({ file, onClose, onRename }: RenameDialogProps) {
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    if (file) setNewName(file.key);
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !newName.trim() || newName === file.key) return;

    setRenaming(true);
    await onRename(file.key, newName.trim());
    setRenaming(false);
  };

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename File</DialogTitle>
          <DialogDescription>
            Enter a new name for the file. You can include path separators (/).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New file name..."
            className="mb-4"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={renaming || !newName.trim() || newName === file?.key}
            >
              {renaming ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
