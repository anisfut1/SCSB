import { createServer } from "node:http";
import type { WorkerSupabaseClient } from "./supabase-client.js";

const VERSION = "0.1.0";

/**
 * §48 du brief FBI : /health minimal — statut, version, connectivité DB.
 * AUCUN secret dans la réponse.
 */
export function startHealthServer(supabase: WorkerSupabaseClient, port: number): () => Promise<void> {
  const server = createServer((req, res) => {
    if (req.url !== "/health") {
      res.writeHead(404).end();
      return;
    }

    supabase
      .from("fbi_jobs")
      .select("id", { count: "exact", head: true })
      .then(({ error }) => {
        const dbOk = !error;
        res.writeHead(dbOk ? 200 : 503, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: dbOk ? "ok" : "degraded", version: VERSION, dbConnected: dbOk }));
      });
  });

  server.listen(port);

  return () =>
    new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
}
