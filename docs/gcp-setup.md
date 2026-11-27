# Running Finlio: Vercel + Google Cloud

**Vercel** runs the app. **Google Cloud** holds accounts, sessions and encrypted data (Firestore) and handles
Google Sign-In. Gmail is used to sign in and to *send* account emails only; Finlio never reads a mailbox.

## Free-tier limits worth knowing
- Firestore: 1 GiB, 50k reads / 20k writes / 20k deletes per day. Works without a billing account.
- Vercel Hobby: free, for non-commercial use only. Use Pro for a commercial product.
- Gemini (AI Studio) free keys: rate-limited. `GEMINI_API_KEY_2` is used when key 1 hits quota.
- Without billing, the session TTL cleanup can't be enabled. Expired sessions are still rejected.

## 1. Project and Firestore
```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable firestore.googleapis.com gmail.googleapis.com iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com
gcloud firestore databases create --location=asia-south1   # Mumbai
# Delete expired sessions automatically (free):
gcloud firestore fields ttls update expiresAt --collection-group=sessions --enable-ttl
```
Lock the database down: leave Firestore security rules at the default **deny all**. Only the server reaches it.

## 2. Google sign-in (OAuth)
1. Console → APIs & Services → OAuth consent screen: External, add the scopes `openid`, `email`, `profile` only. Those are non-sensitive, so no Google verification review is needed.
2. Credentials → Create OAuth client ID → Web. Authorised redirect URIs:
   - `https://YOUR-DOMAIN/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (local)
3. Put the client id/secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## Firebase Auth
1. In the [Firebase console](https://console.firebase.google.com), add Firebase to the **existing** Google Cloud
   project (keep the Spark plan).
2. Authentication → Sign-in method → enable **Google**. Under Settings → Authorised domains add your live domain.
3. Register a web app and copy its settings into the four `NEXT_PUBLIC_FIREBASE_*` variables (locally and in
   Vercel), then rebuild.
4. Keep Firestore security rules at `allow read, write: if false;`. Only the server reads and writes.

The browser signs in with Firebase, the server checks the token (`lib/auth/firebase-token.ts`) and creates its
own session. Accounts are keyed by Google id, so existing data carries over.

## 3. Sending email (Gmail, send-only)
Pick the Gmail account Finlio mails from. In the OAuth web client, add the redirect URI
`http://localhost:8765/oauth2callback`, then run this once and approve "Send email on your behalf":
```bash
node --env-file=.env.local scripts/gmail-sender-token.mjs
```
It saves `GMAIL_SENDER_REFRESH_TOKEN` to `.env.local` and sends a test email to that account.
A welcome email goes out on each person's first sign-up (`lib/welcome-email.ts`). If sending isn't set up or
fails, sign-in still works. Gmail caps free accounts at about 500 recipients a day.
While the consent screen is in "Testing", refresh tokens expire after 7 days: publish the app to Production.

## 4. Gemini keys
Create two keys at https://aistudio.google.com/apikey (one per Google account) → `GEMINI_API_KEY`, `GEMINI_API_KEY_2`.

## 5. Let Vercel reach Firestore (no key file)
Replace `TEAM_SLUG` and `VERCEL_PROJECT` with the names in your Vercel URL.
```bash
PROJECT=YOUR_PROJECT_ID
NUMBER=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
gcloud iam service-accounts create finlio-vercel --project=$PROJECT
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:finlio-vercel@$PROJECT.iam.gserviceaccount.com" --role=roles/datastore.user
gcloud iam workload-identity-pools create vercel --location=global --project=$PROJECT
gcloud iam workload-identity-pools providers create-oidc vercel --location=global --project=$PROJECT \
  --workload-identity-pool=vercel --issuer-uri="https://oidc.vercel.com/TEAM_SLUG" \
  --allowed-audiences="https://vercel.com/TEAM_SLUG" --attribute-mapping="google.subject=assertion.sub"
# Production deployments of this one project only:
gcloud iam service-accounts add-iam-policy-binding finlio-vercel@$PROJECT.iam.gserviceaccount.com --project=$PROJECT \
  --role=roles/iam.workloadIdentityUser \
  --member="principal://iam.googleapis.com/projects/$NUMBER/locations/global/workloadIdentityPools/vercel/subject/owner:TEAM_SLUG:project:VERCEL_PROJECT:environment:production"
```
In Vercel, keep **Settings → Security → Secure backend access with OIDC** on the **Team** issuer.

## 6. Vercel environment variables (Production)
`APP_URL`, `GCP_PROJECT_ID`, `GCP_PROJECT_NUMBER`, `GCP_SERVICE_ACCOUNT_EMAIL`
(`finlio-vercel@PROJECT.iam.gserviceaccount.com`), `GCP_WORKLOAD_IDENTITY_POOL_ID=vercel`,
`GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID=vercel`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`,
`VAULT_MASTER_KEY`, `GMAIL_SENDER_REFRESH_TOKEN`, `MAIL_FROM`, `GEMINI_API_KEY`, `GEMINI_API_KEY_2`,
`UPSTOX_ANALYTICS_TOKEN`.

Use a new `AUTH_SECRET` for production (`openssl rand -base64 32`). `VAULT_MASTER_KEY` must be the same for
every copy that shares one database, or records saved by one can't be read by the other; to use a separate key
locally, use a separate Firestore database. Back it up: if it is lost, saved data can't be read. Preview deployments get no database access.

Add `https://YOUR-DOMAIN/api/auth/callback/google` to the OAuth client's redirect URIs, then deploy.
Functions run in Mumbai (`vercel.json`), next to the database.

## Local development
```bash
gcloud auth application-default login
cp .env.example .env.local   # fill in
pnpm dev
```
Without `AUTH_SECRET` and a GCP project set, a local copy stays open (no sign-in), as before.

## What lives where
| Data | Location |
|---|---|
| Account (email, name, picture) | Firestore `users/{googleId}` |
| Session ("cookies") | Firestore `sessions/{sha256(id)}`; the browser only holds a signed random id |
| Money data (encrypted) | Firestore `users/{id}/vault/*` |
