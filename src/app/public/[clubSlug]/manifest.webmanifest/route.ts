import { isValidSlug } from "@/lib/public-session/policy";
import { buildManifest } from "@/lib/pwa/manifest";

/** Manifeste PWA propre au club : `start_url` = accueil du club, `scope` = son espace public. */
export async function GET(_request: Request, { params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  if (!isValidSlug(clubSlug)) return new Response("Not found", { status: 404 });
  return new Response(JSON.stringify(buildManifest(clubSlug)), {
    headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
