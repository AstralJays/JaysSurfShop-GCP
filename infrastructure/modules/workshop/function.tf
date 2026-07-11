locals {
  order_webhook_image = "${local.artifact_registry_host}/${local.name_prefix}/order-webhook:${var.order_webhook_image_tag}"
}

resource "google_service_account" "order_webhook" {
  project      = var.project_id
  account_id   = "${replace(local.name_prefix, "-", "")}-order-wh"
  display_name = "${local.name_prefix} order webhook"
}

resource "google_artifact_registry_repository_iam_member" "order_webhook_reader" {
  project    = var.project_id
  location   = var.region
  repository = google_artifact_registry_repository.main.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.order_webhook.email}"
}

# CSPM workshop finding: overprivileged function service account
resource "google_project_iam_member" "order_webhook_editor" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.order_webhook.email}"
}

# Cloud Run order-webhook — Upwind Tracer (serverless runtime only; not used on GKE app images).
# Requires Gen2 execution environment and tracer-enabled image from order-webhook/Dockerfile.
# Credentials are stored in Secret Manager (upwind.tf) — never hardcode client_secret in Terraform.
resource "google_cloud_run_v2_service" "order_webhook" {
  name     = "${local.name_prefix}-order-webhook"
  project  = var.project_id
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    execution_environment = "EXECUTION_ENVIRONMENT_GEN2"
    service_account       = google_service_account.order_webhook.email

    scaling {
      min_instance_count = 0
      max_instance_count = 3
    }

    containers {
      name  = "order-webhook"
      image = local.order_webhook_image

      ports {
        container_port = 8080
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      dynamic "env" {
        for_each = local.upwind_enabled ? [1] : []
        content {
          name  = "UPWIND_TRACER_EXTENDED_SYSCALLS"
          value = "true"
        }
      }

      dynamic "env" {
        for_each = local.upwind_enabled ? [1] : []
        content {
          name  = "UPWIND_TRACER_REPORT_TO_BACKEND"
          value = "true"
        }
      }

      dynamic "env" {
        for_each = local.upwind_enabled ? [1] : []
        content {
          name = "UPWIND_TRACER_AUTH_CLIENT_ID"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.upwind_client_id[0].secret_id
              version = "latest"
            }
          }
        }
      }

      dynamic "env" {
        for_each = local.upwind_enabled ? [1] : []
        content {
          name = "UPWIND_TRACER_AUTH_CLIENT_SECRET"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.upwind_client_secret[0].secret_id
              version = "latest"
            }
          }
        }
      }
    }
  }

  depends_on = [
    google_project_service.required,
    google_project_iam_member.order_webhook_editor,
    google_artifact_registry_repository_iam_member.order_webhook_reader,
    google_secret_manager_secret_version.upwind_client_id,
    google_secret_manager_secret_version.upwind_client_secret,
    google_secret_manager_secret_iam_member.order_webhook_upwind_client_id,
    google_secret_manager_secret_iam_member.order_webhook_upwind_client_secret,
  ]
}

# CSPM workshop finding: unauthenticated HTTP function
resource "google_cloud_run_v2_service_iam_member" "order_webhook_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.order_webhook.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
