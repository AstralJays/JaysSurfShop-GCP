resource "google_secret_manager_secret" "openai_api_key" {
  project   = var.project_id
  secret_id = "${local.name_prefix}-openai-api-key"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required]
}

resource "google_secret_manager_secret_version" "openai_api_key" {
  secret      = google_secret_manager_secret.openai_api_key.id
  # Secret Manager rejects empty payloads; placeholder when running Vertex-only.
  secret_data = length(var.openai_api_key) > 0 ? var.openai_api_key : "not-configured"
}
