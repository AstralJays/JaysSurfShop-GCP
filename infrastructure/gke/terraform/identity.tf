# Workshop identity misconfigurations — realistic GCP attack paths for CNAPP demos.
# 1) Overprivileged runtime SA (metadata token theft) — gke.tf google_service_account.app
# 2) Compromised dev SA can impersonate production SA
# 3) Leaked dev SA key (committed to image + public GCS artifact)
# 4) Dev SA can actAs prod SA + create VMs (indirect privilege escalation)

locals {
  compact_name = replace(local.name_prefix, "-", "")
}

resource "google_service_account" "prod" {
  project      = var.project_id
  account_id   = "${local.compact_name}-prod"
  display_name = "${local.name_prefix} production data plane"
}

resource "google_service_account" "dev" {
  project      = var.project_id
  account_id   = "${local.compact_name}-dev"
  display_name = "${local.name_prefix} compromised developer / CI"
}

resource "google_project_iam_member" "prod_secret_admin" {
  project = var.project_id
  role    = "roles/secretmanager.admin"
  member  = "serviceAccount:${google_service_account.prod.email}"
}

resource "google_project_iam_member" "prod_storage_admin" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.prod.email}"
}

# Dev can impersonate production SA (roles/iam.serviceAccountTokenCreator)
resource "google_service_account_iam_member" "dev_token_creator_on_prod" {
  service_account_id = google_service_account.prod.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.dev.email}"
}

resource "google_service_account_iam_member" "dev_act_as_prod" {
  service_account_id = google_service_account.prod.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.dev.email}"
}

# Bonus: indirect escalation — create VM attached to prod SA
resource "google_project_iam_member" "dev_compute_admin" {
  project = var.project_id
  role    = "roles/compute.instanceAdmin.v1"
  member  = "serviceAccount:${google_service_account.dev.email}"
}

resource "google_service_account_key" "dev_leaked" {
  service_account_id = google_service_account.dev.name
}

# CSPM finding: long-lived key leaked to public artifact bucket
resource "google_storage_bucket_object" "leaked_dev_key" {
  name    = "ci-artifacts/leaked-dev-sa.json"
  bucket  = module.workshop.board_images_bucket
  content = base64decode(google_service_account_key.dev_leaked.private_key)

  depends_on = [module.workshop]
}
