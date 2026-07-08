locals {
  name_prefix = module.workshop.name_prefix
  namespace   = replace(local.name_prefix, "_", "-")

  services = {
    frontend = {
      port   = 3000
      image  = "frontend"
      public = true
    }
    chat-rag = {
      port   = 8001
      image  = "chat-rag"
      public = false
    }
    board-generator = {
      port   = 8002
      image  = "board-generator"
      public = false
    }
  }

  internal_service_urls = {
    chat-rag        = "http://chat-rag.${local.namespace}.svc.cluster.local:8001"
    board-generator = "http://board-generator.${local.namespace}.svc.cluster.local:8002"
  }
}
