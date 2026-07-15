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
  type        = string
  sensitive   = true
  default     = ""
  description = "Optional OpenAI key for openai LLM/IMAGE_PROVIDER fallback"
}

variable "llm_provider" {
  type        = string
  default     = "vertex"
  description = "LLM backend for chat-rag: vertex (GCP) or openai"
}

variable "image_provider" {
  type        = string
  default     = "vertex"
  description = "Image backend for board-generator: vertex (Imagen) or openai"
}

variable "vertex_chat_model" {
  type    = string
  default = "gemini-2.5-flash"
}

variable "vertex_embed_model" {
  type    = string
  default = "text-embedding-004"
}

variable "vertex_image_model" {
  type    = string
  default = "imagen-3.0-generate-001"
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

variable "upwind_client_id" {
  type      = string
  default   = ""
  sensitive = true
}

variable "upwind_client_secret" {
  type      = string
  default   = ""
  sensitive = true
}
