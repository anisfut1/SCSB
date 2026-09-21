import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { DASHBOARD_PLACEHOLDER_CARDS } from "@/config/site";

export default async function ClubDashboardPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href={`/c/${clubSlug}/matchs`}>
          <Card title="Matchs" description="Calendrier, résultats et composition, synchronisés automatiquement." />
        </Link>
        {DASHBOARD_PLACEHOLDER_CARDS.map((card) => (
          <Card key={card.title} title={card.title} description={card.description} />
        ))}
      </div>
    </div>
  );
}
