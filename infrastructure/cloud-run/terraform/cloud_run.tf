locals {
  name_prefix = module.workshop.name_prefix

  backend_services = {
    chat-rag = {
      port    = 8001
      image   = "chat-rag"
      command = ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
    }
    board-generator = {
      port    = 8002
      image   = "board-generator"
      command = ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
    }
  }

  backend_env = {
    chat-rag = [
      { name = "SERVICE_NAME", value = "chat-rag" },
      { name = "ENVIRONMENT", value = var.environment },
      { name = "GCP_REGION", value = var.region },
      { name = "DEPLOYMENT_ID", value = local.name_prefix },
      { name = "LOG_FORMAT", value = "json" },
      { name = "AI_MODEL_CHAT", value = "gpt-4o-mini" },
      { name = "AI_MODEL_EMBED", value = "text-embedding-3-small" },
    ]
    board-generator = [
      { name = "SERVICE_NAME", value = "board-generator" },
      { name = "ENVIRONMENT", value = var.environment },
      { name = "GCP_REGION", value = var.region },
      { name = "DEPLOYMENT_ID", value = local.name_prefix },
      { name = "LOG_FORMAT", value = "json" },
      { name = "GCS_BUCKET", value = module.workshop.board_images_bucket },
      { name = "AI_MODEL", value = "gpt-image-1" },
    ]
  }
}

resource "google_service_account" "apps" {
  project      = var.project_id
  account_id   = "${replace(local.name_prefix, "-", "")}-run"
  display_name = "${local.name_prefix} Cloud Run apps"
}

resource "google_project_iam_member" "apps_storage_admin" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.apps.email}"
}

# CSPM workshop finding: overprivileged Cloud Run service account
resource "google_project_iam_member" "apps_demo_editor" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.apps.email}"
}

resource "google_secret_manager_secret_iam_member" "apps_openai" {
  project   = var.project_id
  secret_id = module.workshop.openai_secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.apps.email}"
}

resource "google_cloud_run_v2_service" "backends" {
  for_each = local.backend_services

  name     = "${local.name_prefix}-${each.key}"
  project  = var.project_id
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.apps.email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      name    = each.key
      image   = "${module.workshop.artifact_registry_urls[each.key]}:${var.image_tag}"
      command = each.value.command

      ports {
        container_port = each.value.port
      }

      env {
        name = "OPENAI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = module.workshop.openai_secret_id
            version = "latest"
          }
        }
      }

      dynamic "env" {
        for_each = local.backend_env[each.key]
        content {
          name  = env.value.name
          value = env.value.value
        }
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
      }
    }
  }

  depends_on = [
    google_project_iam_member.apps_storage_admin,
    google_secret_manager_secret_iam_member.apps_openai,
  ]
}

resource "google_cloud_run_v2_service" "frontend" {
  name     = "${local.name_prefix}-frontend"
  project  = var.project_id
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.apps.email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      name    = "frontend"
      image   = "${module.workshop.artifact_registry_urls["frontend"]}:${var.image_tag}"
      command = ["node", "server.js"]

      ports {
        container_port = 3000
      }

      env {
        name = "OPENAI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = module.workshop.openai_secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "SERVICE_NAME"
        value = "frontend"
      }
      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }
      env {
        name  = "GCP_REGION"
        value = var.region
      }
      env {
        name  = "DEPLOYMENT_ID"
        value = local.name_prefix
      }
      env {
        name  = "LOG_FORMAT"
        value = "json"
      }
      env {
        name  = "CHAT_SERVICE_URL"
        value = google_cloud_run_v2_service.backends["chat-rag"].uri
      }
      env {
        name  = "BOARD_SERVICE_URL"
        value = google_cloud_run_v2_service.backends["board-generator"].uri
      }
      env {
        name  = "ORDER_WEBHOOK_URL"
        value = module.workshop.order_webhook_url
      }
      env {
        name  = "NEXT_PUBLIC_APP_ENV"
        value = var.environment
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
      }
    }
  }

  depends_on = [google_cloud_run_v2_service.backends]
}

resource "google_cloud_run_v2_service_iam_member" "public_backends" {
  for_each = local.backend_services

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.backends[each.key].name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "public_frontend" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
