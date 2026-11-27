#!/usr/bin/env bash
# Publishes a new Firebase Hosting release that sends every path to the finlio
# Cloud Run service. Run it after each `gcloud run deploy`: a new release clears
# Firebase's CDN cache, which otherwise keeps serving pages Next.js prerendered
# for the previous build (they are sent with a one-year s-maxage).
#
# Usage: scripts/release-hosting.sh [PROJECT_ID]
# Needs only gcloud, signed in with access to the project.
set -euo pipefail

PROJECT="${1:-$(gcloud config get-value project 2>/dev/null)}"
SERVICE="${FINLIO_SERVICE:-finlio}"
REGION="${FINLIO_REGION:-asia-south1}"
if [[ -z "${PROJECT}" ]]; then
  echo "No project. Pass one: scripts/release-hosting.sh PROJECT_ID" >&2
  exit 1
fi

TOKEN="$(gcloud auth print-access-token)"
API="https://firebasehosting.googleapis.com/v1beta1"
call() {
  curl -sS --fail-with-body -H "Authorization: Bearer ${TOKEN}" -H "x-goog-user-project: ${PROJECT}" \
    -H "Content-Type: application/json" "$@"
}

CONFIG="{\"config\":{\"rewrites\":[{\"glob\":\"**\",\"run\":{\"serviceId\":\"${SERVICE}\",\"region\":\"${REGION}\"}}]}}"
VERSION="$(call -X POST "${API}/sites/${PROJECT}/versions" -d "${CONFIG}" \
  | python3 -I -c 'import json,sys; print(json.load(sys.stdin)["name"])')"
call -X PATCH "${API}/${VERSION}?updateMask=status" -d '{"status":"FINALIZED"}' >/dev/null
call -X POST "${API}/sites/${PROJECT}/releases?versionName=${VERSION}" -d '{}' >/dev/null

echo "Released ${VERSION}: every path on ${PROJECT}'s Hosting site now goes to ${SERVICE} (${REGION}), cache cleared."
