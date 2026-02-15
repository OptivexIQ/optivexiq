"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type {
  SettingsFieldKeyType,
  SettingsItem,
} from "@/features/settings/types/accountPrivacy.types";

type SettingsItemProps = {
  item: SettingsItem;
  onSave: (
    key: SettingsFieldKeyType,
    value: string | number | boolean,
  ) => Promise<string | null> | string | null;
  saving: boolean;
};

export function SettingsItem({ item, onSave, saving }: SettingsItemProps) {
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(item.rawValue);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setDraftValue(item.rawValue);
  }, [item.rawValue]);

  useEffect(() => {
    if (open) {
      setLocalError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    setLocalError(null);
    const errorMessage = await onSave(item.key, draftValue);
    if (!errorMessage) {
      setOpen(false);
      return;
    }
    setLocalError(errorMessage);
  };

  return (
    <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {item.label}
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {item.value}
          </p>
          {item.helper ? (
            <p className="mt-2 text-xs text-muted-foreground">{item.helper}</p>
          ) : null}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit {item.label}</DialogTitle>
              <DialogDescription>
                {item.description ?? "Update this setting and save."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              {item.type === "boolean" ? (
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    {item.helper ? (
                      <p className="text-xs text-muted-foreground">
                        {item.helper}
                      </p>
                    ) : null}
                  </div>
                  <Switch
                    checked={Boolean(draftValue)}
                    onCheckedChange={(value) => setDraftValue(value)}
                  />
                </div>
              ) : (
                <Input
                  type={item.type}
                  placeholder={item.placeholder}
                  value={
                    typeof draftValue === "string"
                      ? draftValue
                      : String(draftValue)
                  }
                  onChange={(event) => {
                    const value =
                      item.type === "number"
                        ? Number(event.target.value)
                        : event.target.value;
                    setDraftValue(value);
                  }}
                />
              )}
              {localError ? (
                <p className="text-xs text-destructive">{localError}</p>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
