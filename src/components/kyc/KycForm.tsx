import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, ShieldCheck, AlertCircle } from "lucide-react";
import KycStatusBadge from "./KycStatusBadge";
import type { KycSubmission } from "@/hooks/useKyc";

interface Props {
  userId: string;
  existing: KycSubmission | null;
  onSaved: () => void;
}

// NRC format: 6 digits / 2 digits / 1 digit (e.g. 123456/78/1) — accept loose with dashes/spaces
const nrcSchema = z
  .string()
  .trim()
  .regex(/^\d{6}[/\-\s]?\d{2}[/\-\s]?\d$/, "Format: 123456/78/1");

const formSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(120),
  nrc_number: nrcSchema,
  date_of_birth: z.string().min(1, "Date of birth is required"),
});

const MAX_FILE = 5 * 1024 * 1024; // 5MB

export default function KycForm({ userId, existing, onSaved }: Props) {
  const { toast } = useToast();
  const [fullName, setFullName] = useState(existing?.full_name ?? "");
  const [nrc, setNrc] = useState(existing?.nrc_number ?? "");
  const [dob, setDob] = useState(existing?.date_of_birth ?? "");
  const [nrcFile, setNrcFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const status = existing?.status ?? "not_submitted";
  const isLocked = status === "pending" || status === "approved";

  const uploadFile = async (file: File, label: string): Promise<string | null> => {
    if (file.size > MAX_FILE) {
      toast({ title: `${label} too large`, description: "Max 5MB.", variant: "destructive" });
      return null;
    }
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}_${label}_${safe}`;
    const { error } = await supabase.storage.from("kyc-documents").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast({ title: `${label} upload failed`, description: error.message, variant: "destructive" });
      return null;
    }
    return path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const parsed = formSchema.safeParse({
      full_name: fullName,
      nrc_number: nrc,
      date_of_birth: dob,
    });
    if (!parsed.success) {
      toast({
        title: "Check your details",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    // Require docs on first submission
    if (!existing?.nrc_doc_url && !nrcFile) {
      toast({ title: "NRC document required", variant: "destructive" });
      return;
    }
    if (!existing?.selfie_url && !selfieFile) {
      toast({ title: "Selfie required", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    let nrcUrl = existing?.nrc_doc_url ?? null;
    let selfieUrl = existing?.selfie_url ?? null;

    if (nrcFile) {
      const p = await uploadFile(nrcFile, "nrc");
      if (!p) {
        setSubmitting(false);
        return;
      }
      nrcUrl = p;
    }
    if (selfieFile) {
      const p = await uploadFile(selfieFile, "selfie");
      if (!p) {
        setSubmitting(false);
        return;
      }
      selfieUrl = p;
    }

    const payload = {
      user_id: userId,
      kind: "individual" as const,
      status: "pending" as const,
      full_name: parsed.data.full_name,
      nrc_number: parsed.data.nrc_number,
      date_of_birth: parsed.data.date_of_birth,
      nrc_doc_url: nrcUrl,
      selfie_url: selfieUrl,
      review_notes: null,
    };

    const { error } = existing
      ? await supabase.from("kyc_submissions").update(payload).eq("id", existing.id)
      : await supabase.from("kyc_submissions").insert(payload);

    setSubmitting(false);

    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "KYC submitted",
      description: "Your details are under review. We'll notify you within 24 hours.",
    });
    setNrcFile(null);
    setSelfieFile(null);
    onSaved();
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-6 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Identity Verification (NRC)</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Required by Zambian SEC regulations before you can invest. Your data is encrypted and
              only visible to ZamFund compliance reviewers.
            </p>
          </div>
        </div>
        <KycStatusBadge status={status} size="md" />
      </div>

      {status === "rejected" && existing?.review_notes && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Submission rejected</p>
            <p className="text-xs mt-0.5">{existing.review_notes}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-foreground">Full Name (as on NRC)</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLocked}
              required
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-foreground">NRC Number</Label>
            <Input
              value={nrc}
              onChange={(e) => setNrc(e.target.value)}
              placeholder="123456/78/1"
              disabled={isLocked}
              required
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-foreground">Date of Birth</Label>
            <Input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              disabled={isLocked}
              required
              className="mt-1 bg-secondary border-border"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-foreground">NRC Photo / Scan</Label>
            <label className={`mt-1 flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-md text-sm text-muted-foreground ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-surface-hover"} transition-colors`}>
              <Upload size={16} />
              <span className="truncate">
                {nrcFile?.name ?? (existing?.nrc_doc_url ? "On file (replace)" : "Upload NRC")}
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                disabled={isLocked}
                className="hidden"
                onChange={(e) => setNrcFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          <div>
            <Label className="text-foreground">Selfie (liveness)</Label>
            <label className={`mt-1 flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-md text-sm text-muted-foreground ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-surface-hover"} transition-colors`}>
              <Upload size={16} />
              <span className="truncate">
                {selfieFile?.name ?? (existing?.selfie_url ? "On file (replace)" : "Upload selfie")}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="user"
                disabled={isLocked}
                className="hidden"
                onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        {!isLocked && (
          <Button type="submit" variant="hero" disabled={submitting}>
            {submitting ? "Submitting…" : existing ? "Re-submit for review" : "Submit for verification"}
          </Button>
        )}
        {status === "pending" && (
          <p className="text-xs text-muted-foreground">
            Submission locked while under review. You'll be notified once reviewed.
          </p>
        )}
        {status === "approved" && (
          <p className="text-xs text-green-400">
            ✓ Verified. You can invest in any active campaign.
          </p>
        )}
      </form>
    </div>
  );
}
