output "project_id" {
  value = var.project_id
}

output "region" {
  value = var.region
}

output "application_url" {
  value = google_cloud_run_v2_service.frontend.uri
}

output "order_webhook_url" {
  value = module.workshop.order_webhook_url
}

output "order_checkout_url" {
  value = module.workshop.order_checkout_url
}

output "artifact_registry_host" {
  value = module.workshop.artifact_registry_host
}

output "artifact_registry_urls" {
  value = module.workshop.artifact_registry_urls
}

output "backend_urls" {
  value = {
    chat-rag        = google_cloud_run_v2_service.backends["chat-rag"].uri
    board-generator = google_cloud_run_v2_service.backends["board-generator"].uri
  }
}

output "github_actions_deploy_service_account" {
  value = module.workshop.github_actions_deploy_service_account
}

output "github_actions_scan_service_account" {
  value = module.workshop.github_actions_scan_service_account
}

output "github_workload_identity_provider" {
  value = module.workshop.github_workload_identity_provider
}

output "demo_exfiltration_url" {
  value = module.workshop.demo_public_blob_url
}
