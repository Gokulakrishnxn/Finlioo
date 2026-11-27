// The Firebase web app's settings. They identify the project and are safe to expose to browsers;
// access is controlled by the server. When they're absent, sign-in uses Google OAuth directly.
// Each name is written out in full so Next.js can inline it into the browser bundle.
export function firebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  return apiKey && authDomain && projectId && appId ? { apiKey, authDomain, projectId, appId } : null;
}
