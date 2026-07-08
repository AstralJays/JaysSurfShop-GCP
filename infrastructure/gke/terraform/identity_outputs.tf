output "workshop_runtime_service_account" {
  value = google_service_account.app.email
}

output "workshop_prod_service_account" {
  value = google_service_account.prod.email
}

output "workshop_dev_service_account" {
  value = google_service_account.dev.email
}

output "workshop_leaked_key_gcs_path" {
  value = "gs://${module.workshop.board_images_bucket}/ci-artifacts/leaked-dev-sa.json"
}
