#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/../cloud-run/terraform"

cd "$TERRAFORM_DIR"

if [ ! -f terraform.tfvars ]; then
  echo "ERROR: Create terraform.tfvars from terraform.tfvars.example"
  exit 1
fi

terraform init
terraform plan -out=tfplan
terraform apply tfplan

echo ""
echo "==> Cloud Run deployment complete!"
terraform output application_url
terraform output order_webhook_url
