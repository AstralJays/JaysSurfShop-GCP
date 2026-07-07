resource "null_resource" "order_webhook_package" {
  triggers = {
    main  = filemd5("${path.module}/../../function/order-webhook/main.py")
    reqs  = filemd5("${path.module}/../../function/order-webhook/requirements.txt")
  }

  provisioner "local-exec" {
    command     = "chmod +x ${path.module}/../../function/order-webhook/build.sh && ${path.module}/../../function/order-webhook/build.sh"
    interpreter = ["bash", "-c"]
  }
}

data "archive_file" "order_webhook" {
  depends_on  = [null_resource.order_webhook_package]
  type        = "zip"
  source_dir  = "${path.module}/../../function/order-webhook/package"
  output_path = "${path.module}/../../function/order-webhook/build.zip"
}

resource "google_storage_bucket_object" "order_webhook_source" {
  depends_on = [null_resource.order_webhook_package]
  name       = "order-webhook-${data.archive_file.order_webhook.output_md5}.zip"
  bucket     = google_storage_bucket.function_source.name
  source     = data.archive_file.order_webhook.output_path
}

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

resource "google_cloudfunctions2_function" "order_webhook" {
  name        = "${local.name_prefix}-order-webhook"
  project     = var.project_id
  location    = var.region
  description = "Order checkout webhook (EICAR + PyYAML CVE demo)"

  build_config {
    runtime     = "python312"
    entry_point = "order_webhook"
    source {
      storage_source {
        bucket = google_storage_bucket.function_source.name
        object = google_storage_bucket_object.order_webhook_source.name
      }
    }
  }

  service_config {
    available_memory   = "256M"
    timeout_seconds    = 30
    max_instance_count = 3
    ingress_settings   = "ALLOW_ALL"
    service_account_email = google_service_account.order_webhook.email
    environment_variables = {
      ENVIRONMENT = var.environment
    }
  }

  depends_on = [
    google_project_service.required,
    google_project_iam_member.order_webhook_editor,
  ]
}

# CSPM workshop finding: unauthenticated HTTP function
resource "google_cloudfunctions2_function_iam_member" "order_webhook_public" {
  project        = var.project_id
  location       = var.region
  cloud_function = google_cloudfunctions2_function.order_webhook.name
  role           = "roles/cloudfunctions.invoker"
  member         = "allUsers"
}
