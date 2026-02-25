import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Trash2, FileText, ExternalLink } from "lucide-react";

interface CampaignRow {
  id: string;
  business_id: string;
  business_name?: string;
  funding_type: string;
  goal_amount: number;
  raised_amount: number;
  status: string;
  proposal_problem?: string | null;
  proposal_solution?: string | null;
  proposal_doc_url?: string | null;
  created_at: string;
}

interface Props {
  campaigns: CampaignRow[];
  onRefresh: () => void;
}

export default function AdminCampaignsTab({ campaigns, onRefresh }: Props) {
  const { toast } = useToast();

  const approveCampaign = async (id: string) => {
    await supabase.from("campaigns").update({ status: "active", start_date: new Date().toISOString() }).eq("id", id);
    toast({ title: "Campaign approved and now active" });
    onRefresh();
  };

  const rejectCampaign = async (id: string) => {
    await supabase.from("campaigns").update({ status: "rejected" }).eq("id", id);
    toast({ title: "Campaign rejected" });
    onRefresh();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Delete this campaign permanently?")) return;
    await supabase.from("campaigns").delete().eq("id", id);
    toast({ title: "Campaign deleted" });
    onRefresh();
  };

  const viewProposalDoc = async (path: string) => {
    const { data } = await supabase.storage.from("business-documents").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    else toast({ title: "Could not load document", variant: "destructive" });
  };

  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-400",
    pending_review: "bg-yellow-500/10 text-yellow-400",
    draft: "bg-muted text-muted-foreground",
    rejected: "bg-destructive/10 text-destructive",
    funded: "bg-primary/10 text-primary",
    closed: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-3">
      {campaigns.map((camp) => {
        const progress = camp.goal_amount > 0 ? Math.round((camp.raised_amount / camp.goal_amount) * 100) : 0;
        return (
          <div key={camp.id} className="bg-card rounded-xl border border-border/50 p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground">{camp.business_name || "Unknown Business"}</h3>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                  {camp.funding_type.replace("_", " ")} • K{Number(camp.goal_amount).toLocaleString()} goal
                </p>
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden max-w-xs">
                  <div className="h-full bg-gradient-gold rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  K{Number(camp.raised_amount).toLocaleString()} raised ({progress}%)
                </p>
                {camp.proposal_problem && (
                  <p className="text-xs text-muted-foreground mt-2"><strong>Problem:</strong> {camp.proposal_problem}</p>
                )}
                {camp.proposal_doc_url && (
                  <button onClick={() => viewProposalDoc(camp.proposal_doc_url!)} className="mt-2 text-xs text-primary flex items-center gap-1 hover:underline">
                    <FileText size={12} /> View Proposal <ExternalLink size={10} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[camp.status] || ""}`}>
                  {camp.status.replace("_", " ")}
                </span>
                {camp.status === "pending_review" && (
                  <>
                    <Button size="sm" variant="outline" className="text-green-400 border-green-400/30 hover:bg-green-400/10" onClick={() => approveCampaign(camp.id)}>
                      <CheckCircle size={14} className="mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => rejectCampaign(camp.id)}>
                      <XCircle size={14} className="mr-1" /> Reject
                    </Button>
                  </>
                )}
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteCampaign(camp.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
      {campaigns.length === 0 && <p className="text-muted-foreground text-center py-8">No campaigns yet.</p>}
    </div>
  );
}
