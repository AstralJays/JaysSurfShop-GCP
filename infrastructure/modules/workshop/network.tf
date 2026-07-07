resource "google_compute_network" "main" {
  name                    = "${local.name_prefix}-vpc"
  project                 = var.project_id
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "public" {
  name          = "${local.name_prefix}-public"
  project       = var.project_id
  region        = var.region
  network       = google_compute_network.main.id
  ip_cidr_range = cidrsubnet(var.vpc_cidr, 8, 1)
}

resource "google_compute_subnetwork" "private" {
  name                     = "${local.name_prefix}-private"
  project                  = var.project_id
  region                   = var.region
  network                  = google_compute_network.main.id
  ip_cidr_range            = cidrsubnet(var.vpc_cidr, 8, 2)
  private_ip_google_access = true
}

resource "google_compute_subnetwork" "gke" {
  name                     = "${local.name_prefix}-gke"
  project                  = var.project_id
  region                   = var.region
  network                  = google_compute_network.main.id
  ip_cidr_range            = cidrsubnet(var.vpc_cidr, 8, 3)
  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = cidrsubnet(var.vpc_cidr, 4, 4)
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = cidrsubnet(var.vpc_cidr, 4, 5)
  }
}

resource "google_compute_router" "main" {
  name    = "${local.name_prefix}-router"
  project = var.project_id
  region  = var.region
  network = google_compute_network.main.id
}

resource "google_compute_router_nat" "main" {
  name                               = "${local.name_prefix}-nat"
  project                            = var.project_id
  router                             = google_compute_router.main.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

# CSPM workshop finding: SSH open to the world
resource "google_compute_firewall" "demo_open_ssh" {
  name    = "${local.name_prefix}-demo-open-ssh"
  project = var.project_id
  network = google_compute_network.main.name

  direction = "INGRESS"
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["workshop-demo"]
}

resource "google_compute_firewall" "allow_http" {
  name    = "${local.name_prefix}-allow-http"
  project = var.project_id
  network = google_compute_network.main.name

  direction = "INGRESS"
  allow {
    protocol = "tcp"
    ports    = ["80", "443", "3000", "8001", "8002"]
  }

  source_ranges = var.allowed_cidr_blocks
  target_tags   = ["workshop-demo"]
}
