locals {
  name_prefix  = "${var.project_name}-${var.environment}"
  compact_name = replace(local.name_prefix, "-", "")

  common_labels = {
    project     = var.project_name
    environment = var.environment
    owner       = var.owner
    application = "cspm-demo"
    cost_center = var.cost_center
    managed_by  = "terraform"
    workshop    = "cloud-security-monitoring"
    cloud       = "gcp"
  }

  services = {
    frontend = {
      port  = 3000
      image = "frontend"
    }
    chat-rag = {
      port  = 8001
      image = "chat-rag"
    }
    board-generator = {
      port  = 8002
      image = "board-generator"
    }
  }

  artifact_registry_host = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.main.repository_id}"
}
