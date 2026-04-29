import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Upload, FileText, ExternalLink, Trash2, ShieldCheck, Clock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  business: Tables<"businesses">;
  onChange: () => void;
}

interface DocSlot {
  key: "registration_doc_url" | "pitch_deck_url";
  label: string;
  description: string;
  accept: string;
}

const SLOTS: DocSlot[] = [
  {
    key: "registration_doc_url",
    label: "NRC / Business Registration",
    description: "PACRA certificate, NRC, or other proof of business identity. Required for verification.",
    accept: ".pdf,.png,.jpg,.jpeg",
  },
  {
    key: "pitch_deck_url",
    label: "Pitch Deck",
    description: "Slide deck or summary document shown to potential investors.",
    accept: ".pdf,.ppt,.pptx",
  },
];

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export default function BusinessDocuments({ business, onChange }: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);

  const upload = async (slot: DocSlot, file: File) => {
    if (file.size > MAX_BYTES) {
      toast({ title: "File too large", description: "Max 10 MB.", variant: "destructive" });
      return;
    }
    setUploading(slot.key);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${business.owner_id}/${business.id}/${slot.key}_${Date.now()}_${safeName}`;

    const { error: upErr } = await supabase.storage
      .from("business-documents")
      .upload(path, file, { upsert: false });

    if (upErr) {
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      setUploading(null);
      return;
    }

    const { error: dbErr } = await supabase
      .from("businesses")
      .update({ [slot.key]: path })
      .eq("id", business.id);

    if (dbErr) {
      toast({ title: "Couldn't save", description: dbErr.message, variant: "destructive" });
    } else {
      toast({ title: `${slot.label} uploaded`, description: "Awaiting admin verification." });
      onChange();
    }
    setUploading(null);
  };

  const view = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("business-documents")
      .createSignedUrl(path, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    } else {
      // Record denial for the admin Error Logs panel
      logStorageDenial("business-documents", path, error?.message);
      toast({ title: "Could not open document", variant: "destructive" });
    }
  };

  const remove = async (slot: DocSlot, path: string) => {
    if (!confirm(`Remove ${slot.label}?`)) return;
    await supabase.storage.from("business-documents").remove([path]);
    await supabase.from("businesses").update({ [slot.key]: null }).eq("id", business.id);
    toast({ title: "Document removed" });
    onChange();
  };

  return (
    <div className="border-t border-border/30 mt-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">Verification Documents</span>
          {business.is_verified ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              <ShieldCheck size={10} /> Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">
              <Clock size={10} /> Pending verification
            </span>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {SLOTS.map((slot) => {
          const path = business[slot.key];
          const isBusy = uploading === slot.key;
          return (
            <div key={slot.key} className="bg-secondary rounded-lg p-3">
              <p className="text-xs font-medium text-foreground">{slot.label}</p>
              <p className="text-[11px] text-muted-foreground mb-2 leading-snug">{slot.description}</p>

              {path ? (
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => view(path)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
                  >
                    <FileText size={12} /> View document <ExternalLink size={10} />
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(slot, path)}
                    className="h-7 w-7 p-0 text-destructive shrink-0"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-md cursor-pointer hover:border-primary/40 transition-colors text-xs text-muted-foreground">
                  <Upload size={12} />
                  {isBusy ? "Uploading…" : "Upload file"}
                  <input
                    type="file"
                    accept={slot.accept}
                    className="hidden"
                    disabled={isBusy}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(slot, f);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
