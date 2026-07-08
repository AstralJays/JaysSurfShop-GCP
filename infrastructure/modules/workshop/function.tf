resource "google_service_account" "order_webhook" {
  project      = var.project_id
  account_id   = "${replace(local.name_prefix, "-", "")}-order-wh"
  display_name = "${local.name_prefix} order webhook"
}

# CSPM workshop finding: overprivileged function service account
resource "google_project_iam_member" "order_webhook_editor" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.order_webhook.email}"
}

locals {
  order_webhook_image = "${local.artifact_registry_host}/${local.name_prefix}/order-webhook:${var.order_webhook_image_tag}"
  upwind_enabled      = var.upwind_client_id != ""
}

resource "google_cloud_run_v2_service" "order_webhook" {
  name     = "${local.name_prefix}-order-webhook"
  project  = var.project_id
  location = var.region

  template {
    execution_environment = "EXECUTION_ENVIRONMENT_GEN2"
    service_account       = google_service_account.order_webhook.email
    timeout               = "30s"

    scaling {
      max_instance_count = 3
    }

    containers {
      image = local.order_webhook_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          memory = "256Mi"
        }
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
          name  = "UPWIND_TRACER_AUTH_CLIENT_ID"
          value = var.upwind_client_id
        }
      }

      dynamic "env" {
        for_each = local.upwind_enabled ? [1] : []
        content {
          name  = "UPWIND_TRACER_AUTH_CLIENT_SECRET"
          value = var.upwind_client_secret
        }
      }
    }
  }

  ingress = "INGRESS_TRAFFIC_ALL"

  depends_on = [
    google_project_service.required,
    google_project_iam_member.order_webhook_editor,
  ]

  lifecycle {
    ignore_changes = [
      client,
      client_version,
    ]
  }
}

# CSPM workshop finding: unauthenticated HTTP webhook
resource "google_cloud_run_v2_service_iam_member" "order_webhook_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.order_webhook.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
