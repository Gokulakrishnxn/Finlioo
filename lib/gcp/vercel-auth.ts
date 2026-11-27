import "server-only";
import { getVercelOidcToken } from "@vercel/oidc";
import { ExternalAccountClient } from "google-auth-library";

// Vercel gives each deployment a short-lived identity token. Google swaps it for access as one
// service account, and only for the Vercel project and environment allowed in IAM.
// Returns null when the settings are absent, as on a developer's own machine.
export function vercelAuthClient() {
  const {
    GCP_PROJECT_NUMBER: project,
    GCP_SERVICE_ACCOUNT_EMAIL: account,
    GCP_WORKLOAD_IDENTITY_POOL_ID: pool,
    GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID: provider,
  } = process.env;
  const set = [project, account, pool, provider].filter(Boolean).length;
  if (set === 0) return null;
  if (set < 4) throw new Error("Vercel to Google Cloud settings are incomplete (see docs/gcp-setup.md).");
  return ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${project}/locations/global/workloadIdentityPools/${pool}/providers/${provider}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${account}:generateAccessToken`,
    // Read per request: the token only exists while Vercel is handling one.
    subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
  });
}
