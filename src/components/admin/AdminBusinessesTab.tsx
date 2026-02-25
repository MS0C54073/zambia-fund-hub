import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Trash2, FileText, ExternalLink } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Business = Tables<"businesses">;

interface Props {
  businesses: Business[];
  onRefresh: () => void;
}

export default function AdminBusinessesTab({ businesses, onRefresh }: Props) {
  const { toast } = useToast();

  const approveBusiness = async (id: string) => {
    await supabase.from("businesses").update({ is_approved: true, is_verified: true }).eq("id", id);
    toast({ title: "Business approved" });
    onRefresh();
  };

  const rejectBusiness = async (id: string) => {
    await supabase.from("businesses").update({ is_approved: false }).eq("id", id);
    toast({ title: "Business rejected" });
    onRefresh();
  };

  const deleteBusiness = async (id: string) => {
    if (!confirm("Delete this business permanently?")) return;
    await supabase.from("businesses").delete().eq("id", id);
    toast({ title: "Business deleted" });
    onRefresh();
  };

  const viewDocument = async (path: string) => {
    const { data } = await supabase.storage.from("business-documents").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast({ title: "Could not load document", variant: "destructive" });
  };

  return (
    <div className="space-y-3">
      {businesses.map((biz) => (
        <div key={biz.id} className="bg-card rounded-xl border border-border/50 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-display font-semibold text-foreground">{biz.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {biz.industry} • {biz.province} • Reg: {biz.registration_number || "N/A"}
              </p>
              {biz.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{biz.description}</p>
              )}
              {biz.pitch_deck_url && (
                <button
                  onClick={() => viewDocument(biz.pitch_deck_url!)}
                  className="mt-2 text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  <FileText size={12} /> View Pitch Deck <ExternalLink size={10} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              {biz.is_approved ? (
                <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle size={14} /> Approved</span>
              ) : (
                <>
                  <Button size="sm" variant="outline" className="text-green-400 border-green-400/30 hover:bg-green-400/10" onClick={() => approveBusiness(biz.id)}>
                    <CheckCircle size={14} className="mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => rejectBusiness(biz.id)}>
                    <XCircle size={14} className="mr-1" /> Reject
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteBusiness(biz.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </div>
      ))}
      {businesses.length === 0 && <p className="text-muted-foreground text-center py-8">No businesses registered yet.</p>}
    </div>
  );
}
