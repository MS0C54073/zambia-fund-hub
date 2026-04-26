import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import KycStatusBadge from "@/components/kyc/KycStatusBadge";
import { ExternalLink, ShieldCheck, ShieldX } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Submission = Tables<"kyc_submissions"> & {
  profile_name?: string | null;
  business_name?: string | null;
};

export default function AdminKycTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: kycs }, { data: profiles }, { data: businesses }] = await Promise.all([
      supabase.from("kyc_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("businesses").select("id, name"),
    ]);
    const pmap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name]));
    const bmap = new Map((businesses ?? []).map((b) => [b.id, b.name]));
    setItems(
      (kycs ?? []).map((k) => ({
        ...k,
        profile_name: pmap.get(k.user_id) ?? null,
        business_name: k.business_id ? bmap.get(k.business_id) ?? null : null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.status === filter)),
    [items, filter]
  );

  const review = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    const { error } = await supabase
      .from("kyc_submissions")
      .update({
        status,
        review_notes: notes[id] ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "approved" ? "KYC approved" : "KYC rejected" });
    fetchAll();
  };

  const openDoc = async (path: string | null) => {
    if (!path) return;
    const { data } = await supabase.storage.from("kyc-documents").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-lg font-display font-semibold text-foreground">KYC Submissions</h2>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          <TabsContent value={filter} />
        </Tabs>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl border border-border/50 p-12 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border/50 p-12 text-center text-sm text-muted-foreground">
          No {filter === "all" ? "" : filter} submissions.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((k) => (
            <div key={k.id} className="bg-card rounded-xl border border-border/50 p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {k.kind === "individual" ? k.full_name || k.profile_name || "Unnamed" : k.legal_name || k.business_name}
                    <span className="text-xs text-muted-foreground ml-2 capitalize">({k.kind})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(k.created_at).toLocaleDateString()} · by {k.profile_name ?? k.user_id.slice(0, 8)}
                  </p>
                </div>
                <KycStatusBadge status={k.status} />
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs mb-3">
                {k.kind === "individual" ? (
                  <>
                    <div><span className="text-muted-foreground">NRC:</span> <span className="text-foreground">{k.nrc_number}</span></div>
                    <div><span className="text-muted-foreground">DOB:</span> <span className="text-foreground">{k.date_of_birth}</span></div>
                    <Button size="sm" variant="outline" onClick={() => openDoc(k.nrc_doc_url)} disabled={!k.nrc_doc_url}>
                      <ExternalLink size={12} className="mr-1" /> View NRC
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openDoc(k.selfie_url)} disabled={!k.selfie_url}>
                      <ExternalLink size={12} className="mr-1" /> View Selfie
                    </Button>
                  </>
                ) : (
                  <>
                    <div><span className="text-muted-foreground">TPIN:</span> <span className="text-foreground">{k.tpin}</span></div>
                    <div><span className="text-muted-foreground">PACRA:</span> <span className="text-foreground">{k.pacra_number}</span></div>
                    <Button size="sm" variant="outline" onClick={() => openDoc(k.pacra_doc_url)} disabled={!k.pacra_doc_url}>
                      <ExternalLink size={12} className="mr-1" /> View Certificate
                    </Button>
                  </>
                )}
              </div>

              {k.status === "pending" && (
                <div className="space-y-2 pt-3 border-t border-border/30">
                  <Label className="text-xs text-muted-foreground">Review notes (shown to user on rejection)</Label>
                  <Input
                    value={notes[k.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [k.id]: e.target.value })}
                    placeholder="Optional reason / instructions"
                    className="bg-secondary border-border"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="hero" onClick={() => review(k.id, "approved")} disabled={busyId === k.id}>
                      <ShieldCheck size={14} className="mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => review(k.id, "rejected")} disabled={busyId === k.id}>
                      <ShieldX size={14} className="mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              )}

              {k.status !== "pending" && k.review_notes && (
                <p className="text-xs text-muted-foreground pt-3 border-t border-border/30">
                  Reviewer note: {k.review_notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
