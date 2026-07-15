resource "google_service_account" "app" {
  project      = var.project_id
  account_id   = "${replace(local.name_prefix, "-", "")}-app"
  display_name = "${local.name_prefix} app workloads"
}

resource "google_project_iam_member" "app_storage_admin" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.app.email}"
}

# CSPM workshop finding: overprivileged workload service account
resource "google_project_iam_member" "app_demo_editor" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.app.email}"
}

# Explicit Vertex AI access (also covered by demo roles/editor)
resource "google_project_iam_member" "app_aiplatform_user" {
  project = var.project_id
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:${google_service_account.app.email}"
}

resource "google_container_cluster" "main" {
  name     = "${local.name_prefix}-gke"
  project  = var.project_id
  location = var.region

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = module.workshop.vpc_name
  subnetwork = module.workshop.gke_subnet_name

  ip_allocation_policy {
    cluster_secondary_range_name  = module.workshop.pods_range_name
    services_secondary_range_name = module.workshop.services_range_name
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  depends_on = [module.workshop]
}

resource "google_container_node_pool" "main" {
  name       = "${local.name_prefix}-nodes"
  project    = var.project_id
  location   = var.region
  cluster    = google_container_cluster.main.name
  node_count = var.node_count

  node_config {
    machine_type = var.node_machine_type
    tags         = ["workshop-demo"]

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }
}

resource "google_service_account_iam_member" "app_workload_identity" {
  service_account_id = google_service_account.app.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[${local.namespace}/app]"
}
