terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
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
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "workshop" {
  source = "../../modules/workshop"

  project_id          = var.project_id
  region              = var.region
  project_name        = var.project_name
  environment         = var.environment
  owner               = var.owner
  cost_center         = var.cost_center
  github_deploy_repo  = var.github_deploy_repo
  github_scan_repo    = var.github_scan_repo
  openai_api_key      = var.openai_api_key
  allowed_cidr_blocks = var.allowed_cidr_blocks
}
