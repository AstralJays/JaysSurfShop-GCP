#!/usr/bin/env bash
# Deploy Artifact Registry + GitHub Workload Identity only (step 1)
set -euo pipefail

PLATFORM="${1:-cloud-run}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/../${PLATFORM}/terraform"

if [[ ! -d "$TERRAFORM_DIR" ]]; then
  echo "ERROR: Unknown platform '${PLATFORM}'. Use: gke or cloud-run"
  exit 1
fi

cd "$TERRAFORM_DIR"
terraform init

terraform apply -auto-approve \
  -target=module.workshop.google_project_service.required \
  -target=module.workshop.google_artifact_registry_repository.main \
  -target=module.workshop.google_iam_workload_identity_pool.github \
  -target=module.workshop.google_iam_workload_identity_pool_provider.github \
  -target=module.workshop.google_service_account.github_deploy \
  -target=module.workshop.google_service_account.github_scan \
  -target=module.workshop.google_service_account_iam_member.github_deploy_wif \
  -target=module.workshop.google_service_account_iam_member.github_scan_deploy_wif \
  -target=module.workshop.google_service_account_iam_member.github_scan_external_wif \
  -target=module.workshop.google_artifact_registry_repository_iam_member.github_deploy_writer \
  -target=module.workshop.google_artifact_registry_repository_iam_member.github_scan_reader

echo ""
echo "Add to GitHub secrets (JaysSurfShop-GCP):"
echo "  GCP_PROJECT_ID=$(terraform output -raw project_id)"
echo "  GCP_REGION=$(terraform output -raw region)"
echo "  GCP_WORKLOAD_IDENTITY_PROVIDER=$(terraform output -raw github_workload_identity_provider)"
echo "  GCP_DEPLOY_SERVICE_ACCOUNT=$(terraform output -raw github_actions_deploy_service_account)"
echo "  GCP_ARTIFACT_REGISTRY_HOST=$(terraform output -raw artifact_registry_host)"
echo ""
echo "For manual Upwind scan workflow:"
echo "  GCP_SCAN_SERVICE_ACCOUNT=$(terraform output -raw github_actions_scan_service_account)"
