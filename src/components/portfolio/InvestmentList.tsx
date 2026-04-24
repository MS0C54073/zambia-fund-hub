import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import InvestmentCard from "./InvestmentCard";
import type { InvestmentWithRelations } from "@/hooks/usePortfolio";

interface Props {
  all: InvestmentWithRelations[];
  active: InvestmentWithRelations[];
  completed: InvestmentWithRelations[];
}

function EmptyState() {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-12 text-center">
      <TrendingUp size={32} className="text-primary mx-auto mb-3" />
      <p className="text-muted-foreground mb-4">No investments in this category yet.</p>
      <Button variant="hero" asChild>
        <Link to="/browse">Browse Opportunities</Link>
      </Button>
    </div>
  );
}

function List({ items }: { items: InvestmentWithRelations[] }) {
  if (items.length === 0) return <EmptyState />;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((inv) => (
        <InvestmentCard key={inv.id} investment={inv} />
      ))}
    </div>
  );
}

export default function InvestmentList({ all, active, completed }: Props) {
  return (
    <Tabs defaultValue="all">
      <TabsList className="mb-4">
        <TabsTrigger value="all">All ({all.length})</TabsTrigger>
        <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
        <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <List items={all} />
      </TabsContent>
      <TabsContent value="active">
        <List items={active} />
      </TabsContent>
      <TabsContent value="completed">
        <List items={completed} />
      </TabsContent>
    </Tabs>
  );
}
