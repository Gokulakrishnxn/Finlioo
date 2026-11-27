// The address people use to reach Finlio. Hosted copies set APP_URL to their one public
// domain; locally the request's own origin is right.
export function publicOrigin(requestOrigin: string) {
  const configured = process.env.APP_URL?.trim();
  return configured ? new URL(configured).origin : requestOrigin;
}
