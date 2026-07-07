resource "google_artifact_registry_repository" "main" {
  project       = var.project_id
  location      = var.region
  repository_id = local.compact_name
  format        = "DOCKER"
  description   = "Jay's Surf Shop workshop images"

  depends_on = [google_project_service.required]
}
