import "server-only";
import { Firestore } from "@google-cloud/firestore";
import { vercelAuthClient } from "@/lib/gcp/vercel-auth";

// One client per server. On Vercel it signs in with Workload Identity Federation, so there is no
// service account key to store. Locally it uses `gcloud auth application-default login` or the
// Firestore emulator (FIRESTORE_EMULATOR_HOST).
let client: Firestore | null = null;

export function db() {
  if (!client) {
    const authClient = vercelAuthClient();
    client = new Firestore({
      projectId: process.env.GCP_PROJECT_ID || undefined,
      databaseId: process.env.FIRESTORE_DATABASE_ID || undefined,
      ignoreUndefinedProperties: true,
      ...(authClient ? { authClient } : {}),
    });
  }
  return client;
}

// True when the app has somewhere to keep accounts. A local copy with nothing set stays open.
export function gcpConfigured() {
  return Boolean(
    process.env.GCP_PROJECT_ID || process.env.FIRESTORE_EMULATOR_HOST || process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}
