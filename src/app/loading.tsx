import { PageSkeleton } from "@/components/ui/Skeleton";

/** Chargement hors espace club (sélection de club, connexion). */
export default function RootLoading() {
  return <PageSkeleton cards={2} />;
}
