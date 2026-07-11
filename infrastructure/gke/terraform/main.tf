terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 3.1"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "workshop" {
  source = "../../modules/workshop"

  project_id              = var.project_id
  region                  = var.region
  project_name            = var.project_name
  environment             = var.environment
  owner                   = var.owner
  cost_center             = var.cost_center
  github_deploy_repo      = var.github_deploy_repo
  github_scan_repo        = var.github_scan_repo
  openai_api_key          = var.openai_api_key
  allowed_cidr_blocks     = var.allowed_cidr_blocks
  order_webhook_image_tag = var.image_tag
  upwind_client_id        = var.upwind_client_id
  upwind_client_secret    = var.upwind_client_secret
}

data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = "https://${google_container_cluster.main.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(google_container_cluster.main.master_auth[0].cluster_ca_certificate)
}

provider "helm" {
  kubernetes = {
    host                   = "https://${google_container_cluster.main.endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(google_container_cluster.main.master_auth[0].cluster_ca_certificate)
  }
}
