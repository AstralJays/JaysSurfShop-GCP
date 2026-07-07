variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "project_name" {
  type    = string
  default = "jays-surf-shop"
}

variable "environment" {
  type    = string
  default = "demo"
}

variable "owner" {
  type    = string
  default = "workshop-team"
}

variable "cost_center" {
  type    = string
  default = "security-demo"
}

variable "github_deploy_repo" {
  type    = string
  default = "AstralJays/JaysSurfShop-GCP"
}

variable "github_scan_repo" {
  type    = string
  default = "JustinDPerkins/shiftleft-automated"
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}

variable "allowed_cidr_blocks" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}

variable "image_tag" {
  type    = string
  default = "latest"
}

variable "min_instances" {
  type    = number
  default = 0
}

variable "max_instances" {
  type    = number
  default = 3
}
