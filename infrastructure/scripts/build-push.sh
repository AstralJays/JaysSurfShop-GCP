#!/usr/bin/env bash
# Optional local build fallback. Production images are built by GitHub Actions
# (.github/workflows/build-push.yml) for GKE and Cloud Run.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/../cloud-run/terraform"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

IMAGE_TAG="${IMAGE_TAG:-latest}"
NAME_PREFIX="${NAME_PREFIX:-jays-surf-shop-demo}"

cd "$TERRAFORM_DIR"
REGISTRY_HOST="$(terraform output -raw artifact_registry_host)"
REGION="$(terraform output -raw region)"

declare -A CONTEXTS=(
  [frontend]="frontend"
  [chat-rag]="services/chat-rag"
  [board-generator]="services/board-generator"
  [order-webhook]="infrastructure/function/order-webhook"
)

gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

for service in frontend chat-rag board-generator order-webhook; do
  context="${CONTEXTS[$service]}"
  image="${REGISTRY_HOST}/${NAME_PREFIX}/${service}:${IMAGE_TAG}"
  echo "==> Building and pushing ${image}"
  docker build --platform linux/amd64 -t "$image" "${ROOT}/${context}"
  docker push "$image"
done

echo "Done."
