output "name_prefix" {
  value = local.name_prefix
}

output "project_id" {
  value = var.project_id
}

output "region" {
  value = var.region
}

output "vpc_name" {
  value = google_compute_network.main.name
}

output "vpc_id" {
  value = google_compute_network.main.id
}

output "private_subnet_name" {
  value = google_compute_subnetwork.private.name
}

output "gke_subnet_name" {
  value = google_compute_subnetwork.gke.name
}

output "pods_range_name" {
  value = google_compute_subnetwork.gke.secondary_ip_range[0].range_name
}

output "services_range_name" {
  value = google_compute_subnetwork.gke.secondary_ip_range[1].range_name
}

output "artifact_registry_repository" {
  value = google_artifact_registry_repository.main.repository_id
}

output "artifact_registry_host" {
  value = local.artifact_registry_host
}

output "artifact_registry_urls" {
  value = {
    for name, svc in local.services :
    name => "${local.artifact_registry_host}/${local.name_prefix}/${svc.image}"
  }
}

output "openai_secret_id" {
  value = google_secret_manager_secret.openai_api_key.secret_id
}

output "openai_secret_version" {
  value = google_secret_manager_secret_version.openai_api_key.version
}

output "board_images_bucket" {
  value = google_storage_bucket.board_images.name
}

output "demo_public_blob_url" {
  value = "https://storage.googleapis.com/${google_storage_bucket.demo_public.name}/${google_storage_bucket_object.demo_customer_export.name}"
}

output "order_webhook_url" {
  value = google_cloudfunctions2_function.order_webhook.service_config[0].uri
}

output "order_checkout_url" {
  value = "${google_cloudfunctions2_function.order_webhook.service_config[0].uri}/checkout"
}

output "github_actions_deploy_service_account" {
  value = google_service_account.github_deploy.email
}

output "github_actions_scan_service_account" {
  value = google_service_account.github_scan.email
}

output "github_workload_identity_provider" {
  value = google_iam_workload_identity_pool_provider.github.name
}

output "order_webhook_service_account" {
  value = google_service_account.order_webhook.email
}
