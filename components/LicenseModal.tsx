"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyLicense } from "@/lib/license/gumroad";

interface LicenseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (key: string) => void;
}

export function LicenseModal({ isOpen, onOpenChange, onSuccess }: LicenseModalProps) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await verifyLicense(key);
      if (result.success) {
        // We will handle the tauri store update in the parent component or here.
        // For simplicity, let's just call onSuccess with the key.
        onSuccess(key);
      } else {
        setError(result.message || "Invalid license key.");
      }
    } catch (err: any) {
      setError("An error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Activate Pro</DialogTitle>
          <DialogDescription>
            Enter your Gumroad license key to unlock Pro features.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input 
            placeholder="XXXX-XXXX-XXXX-XXXX" 
            value={key} 
            onChange={(e) => setKey(e.target.value)} 
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleActivate} disabled={loading || !key}>
            {loading ? "Activating..." : "Activate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
