locals {
  service_env = {
    frontend = [
      { name = "SERVICE_NAME", value = "frontend" },
      { name = "ENVIRONMENT", value = var.environment },
      { name = "GCP_REGION", value = var.region },
      { name = "GOOGLE_CLOUD_PROJECT", value = var.project_id },
      { name = "DEPLOYMENT_ID", value = local.name_prefix },
      { name = "LOG_FORMAT", value = "json" },
      { name = "CHAT_SERVICE_URL", value = local.internal_service_urls.chat-rag },
      { name = "BOARD_SERVICE_URL", value = local.internal_service_urls.board-generator },
      { name = "ORDER_WEBHOOK_URL", value = module.workshop.order_webhook_url },
      { name = "NEXT_PUBLIC_APP_ENV", value = var.environment },
    ]
    chat-rag = [
      { name = "SERVICE_NAME", value = "chat-rag" },
      { name = "ENVIRONMENT", value = var.environment },
      { name = "GCP_REGION", value = var.region },
      { name = "GOOGLE_CLOUD_PROJECT", value = var.project_id },
      { name = "DEPLOYMENT_ID", value = local.name_prefix },
      { name = "LOG_FORMAT", value = "json" },
      { name = "AI_MODEL_CHAT", value = "gpt-4o-mini" },
      { name = "AI_MODEL_EMBED", value = "text-embedding-3-small" },
      { name = "IMPERSONATION_TARGET_SA", value = google_service_account.prod.email },
      { name = "WORKSHOP_DEV_SERVICE_ACCOUNT", value = google_service_account.dev.email },
      { name = "LEAKED_DEV_KEY_PATH", value = "/var/run/demo/leaked-dev-sa.json" },
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

resource "kubernetes_namespace" "app" {
  metadata {
    name = local.namespace
    labels = {
      app = local.name_prefix
    }
  }

  depends_on = [google_container_node_pool.main]
}

resource "kubernetes_secret" "openai" {
  metadata {
    name      = "openai-api-key"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    OPENAI_API_KEY = var.openai_api_key
  }

  type = "Opaque"
}

resource "kubernetes_secret" "leaked_dev_key" {
  metadata {
    name      = "leaked-dev-sa-key"
    namespace = kubernetes_namespace.app.metadata[0].name
  }

  data = {
    "leaked-dev-sa.json" = base64decode(google_service_account_key.dev_leaked.private_key)
  }

  type = "Opaque"
}

resource "kubernetes_service_account" "app" {
  metadata {
    name      = "app"
    namespace = kubernetes_namespace.app.metadata[0].name
    annotations = {
      "iam.gke.io/gcp-service-account" = google_service_account.app.email
    }
  }
}

resource "kubernetes_deployment" "services" {
  for_each = local.services

  metadata {
    name      = each.key
    namespace = kubernetes_namespace.app.metadata[0].name
    labels = {
      app = each.key
    }
  }

  spec {
    replicas = var.desired_count

    selector {
      match_labels = {
        app = each.key
      }
    }

    template {
      metadata {
        labels = {
          app = each.key
        }
      }

      spec {
        service_account_name = kubernetes_service_account.app.metadata[0].name

        dynamic "volume" {
          for_each = each.key == "chat-rag" ? [1] : []
          content {
            name = "leaked-dev-key"
            secret {
              secret_name = kubernetes_secret.leaked_dev_key.metadata[0].name
            }
          }
        }

        container {
          name  = each.key
          image = "${module.workshop.artifact_registry_urls[each.key]}:${var.image_tag}"

          dynamic "port" {
            for_each = [each.value.port]
            content {
              container_port = port.value
              protocol       = "TCP"
            }
          }

          dynamic "env" {
            for_each = local.service_env[each.key]
            content {
              name  = env.value.name
              value = env.value.value
            }
          }

          env {
            name = "OPENAI_API_KEY"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.openai.metadata[0].name
                key  = "OPENAI_API_KEY"
              }
            }
          }

          dynamic "volume_mount" {
            for_each = each.key == "chat-rag" ? [1] : []
            content {
              name       = "leaked-dev-key"
              mount_path = "/var/run/demo"
              read_only  = true
            }
          }

          readiness_probe {
            http_get {
              path = each.key == "frontend" ? "/api/security/posture" : "/health"
              port = each.value.port
            }
            initial_delay_seconds = 30
            period_seconds        = 10
          }

          liveness_probe {
            http_get {
              path = each.key == "frontend" ? "/api/security/posture" : "/health"
              port = each.value.port
            }
            initial_delay_seconds = 60
            period_seconds        = 30
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "services" {
  for_each = local.services

  metadata {
    name      = each.key
    namespace = kubernetes_namespace.app.metadata[0].name
    labels = {
      app = each.key
    }
  }

  spec {
    type = each.value.public ? "LoadBalancer" : "ClusterIP"

    selector = {
      app = each.key
    }

    port {
      port        = each.value.public ? 80 : each.value.port
      target_port = each.value.port
      protocol    = "TCP"
    }
  }
}
