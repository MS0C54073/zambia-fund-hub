import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Building2 } from "lucide-react";
import KycStatusBadge from "./KycStatusBadge";
import type { KycSubmission } from "@/hooks/useKyc";

interface Props {
  userId: string;
  businessId: string;
  businessName: string;
  existing: KycSubmission | null;
  onSaved: () => void;
}

const tpinSchema = z.string().trim().regex(/^\d{10}$/, "TPIN must be 10 digits");

const formSchema = z.object({
  legal_name: z.string().trim().min(2, "Legal name is required").max(160),
  tpin: tpinSchema,
  pacra_number: z.string().trim().min(3, "PACRA number is required").max(40),
});

const MAX_FILE = 10 * 1024 * 1024;

export default function BusinessKycForm({ userId, businessId, businessName, existing, onSaved }: Props) {
  const { toast } = useToast();
  const [legalName, setLegalName] = useState(existing?.legal_name ?? "");
  const [tpin, setTpin] = useState(existing?.tpin ?? "");
  const [pacra, setPacra] = useState(existing?.pacra_number ?? "");
  const [pacraFile, setPacraFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const status = existing?.status ?? "not_submitted";
  const isLocked = status === "pending" || status === "approved";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const parsed = formSchema.safeParse({ legal_name: legalName, tpin, pacra_number: pacra });
    if (!parsed.success) {
      toast({ title: "Check your details", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    if (!existing?.pacra_doc_url && !pacraFile) {
      toast({ title: "PACRA certificate required", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    let pacraUrl = existing?.pacra_doc_url ?? null;
    if (pacraFile) {
      if (pacraFile.size > MAX_FILE) {
        toast({ title: "File too large", description: "Max 10MB.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const safe = pacraFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/business_${businessId}_${Date.now()}_${safe}`;
      const { error } = await supabase.storage.from("kyc-documents").upload(path, pacraFile);
      if (error) {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      pacraUrl = path;
    }

    const payload = {
      user_id: userId,
      business_id: businessId,
      kind: "business" as const,
      status: "pending" as const,
      legal_name: parsed.data.legal_name,
      tpin: parsed.data.tpin,
      pacra_number: parsed.data.pacra_number,
      pacra_doc_url: pacraUrl,
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
    toast({ title: "Business KYC submitted", description: "Compliance review usually completes within 48h." });
    setPacraFile(null);
    onSaved();
  };

  return (
    <div className="bg-secondary/40 rounded-xl border border-border/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2">
          <Building2 size={18} className="text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">{businessName} — Business Verification</p>
            <p className="text-xs text-muted-foreground">PACRA certificate + ZRA TPIN</p>
          </div>
        </div>
        <KycStatusBadge status={status} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-foreground">Legal Name</Label>
            <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} disabled={isLocked} required className="mt-1 bg-background border-border" />
          </div>
          <div>
            <Label className="text-xs text-foreground">TPIN (10 digits)</Label>
            <Input value={tpin} onChange={(e) => setTpin(e.target.value)} disabled={isLocked} required maxLength={10} className="mt-1 bg-background border-border" />
          </div>
          <div>
            <Label className="text-xs text-foreground">PACRA Reg. No.</Label>
            <Input value={pacra} onChange={(e) => setPacra(e.target.value)} disabled={isLocked} required className="mt-1 bg-background border-border" />
          </div>
        </div>

        <div>
          <Label className="text-xs text-foreground">PACRA Certificate (PDF/image)</Label>
          <label className={`mt-1 flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md text-xs text-muted-foreground ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-surface-hover"} transition-colors`}>
            <Upload size={14} />
            <span className="truncate">
              {pacraFile?.name ?? (existing?.pacra_doc_url ? "On file (replace)" : "Upload certificate")}
            </span>
            <input type="file" accept="image/*,.pdf" disabled={isLocked} className="hidden" onChange={(e) => setPacraFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        {status === "rejected" && existing?.review_notes && (
          <p className="text-xs text-destructive">Rejected: {existing.review_notes}</p>
        )}

        {!isLocked && (
          <Button type="submit" size="sm" variant="hero" disabled={submitting}>
            {submitting ? "Submitting…" : existing ? "Re-submit" : "Submit for review"}
          </Button>
        )}
      </form>
    </div>
  );
}
