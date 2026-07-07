resource "random_string" "suffix" {
  length  = 4
  special = false
  upper   = false
}

resource "google_storage_bucket" "board_images" {
  name                        = "${replace(local.name_prefix, "-", "")}-boards-${random_string.suffix.result}"
  project                     = var.project_id
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true
}

resource "google_storage_bucket" "demo_public" {
  name                        = "${replace(local.name_prefix, "-", "")}-public-${random_string.suffix.result}"
  project                     = var.project_id
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true
}

# CSPM workshop finding: public read on demo export bucket
resource "google_storage_bucket_iam_member" "demo_public_read" {
  bucket = google_storage_bucket.demo_public.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_storage_bucket_object" "demo_customer_export" {
  name   = "exports/customer-export.json"
  bucket = google_storage_bucket.demo_public.name
  source = "${path.module}/../../demo-data/customer-export.json"
}

resource "google_storage_bucket" "function_source" {
  name                        = "${replace(local.name_prefix, "-", "")}-func-src-${random_string.suffix.result}"
  project                     = var.project_id
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = true
}
