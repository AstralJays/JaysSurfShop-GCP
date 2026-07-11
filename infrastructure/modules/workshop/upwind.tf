locals {
  upwind_enabled = var.upwind_client_id != ""
}

resource "google_secret_manager_secret" "upwind_client_id" {
  count = local.upwind_enabled ? 1 : 0

  project   = var.project_id
  secret_id = "${local.name_prefix}-upwind-client-id"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret" "upwind_client_secret" {
  count = local.upwind_enabled ? 1 : 0

  project   = var.project_id
  secret_id = "${local.name_prefix}-upwind-client-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "upwind_client_id" {
  count = local.upwind_enabled ? 1 : 0

  secret      = google_secret_manager_secret.upwind_client_id[0].id
  secret_data = var.upwind_client_id
}

resource "google_secret_manager_secret_version" "upwind_client_secret" {
  count = local.upwind_enabled ? 1 : 0

  secret      = google_secret_manager_secret.upwind_client_secret[0].id
  secret_data = var.upwind_client_secret
}

resource "google_secret_manager_secret_iam_member" "order_webhook_upwind_client_id" {
  count = local.upwind_enabled ? 1 : 0

  project   = var.project_id
  secret_id = google_secret_manager_secret.upwind_client_id[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.order_webhook.email}"
}

resource "google_secret_manager_secret_iam_member" "order_webhook_upwind_client_secret" {
  count = local.upwind_enabled ? 1 : 0

  project   = var.project_id
  secret_id = google_secret_manager_secret.upwind_client_secret[0].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.order_webhook.email}"
}
