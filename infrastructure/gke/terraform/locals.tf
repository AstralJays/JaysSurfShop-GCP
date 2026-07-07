locals {
  name_prefix = module.workshop.name_prefix
  namespace   = replace(local.name_prefix, "_", "-")

  services = {
    frontend = {
      port    = 3000
      image   = "frontend"
      public  = true
      command = ["node", "server.js"]
    }
    chat-rag = {
      port    = 8001
      image   = "chat-rag"
      public  = false
      command = ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
    }
    board-generator = {
      port    = 8002
      image   = "board-generator"
      public  = false
      command = ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
    }
  }

  internal_service_urls = {
    chat-rag        = "http://chat-rag.${local.namespace}.svc.cluster.local:8001"
    board-generator = "http://board-generator.${local.namespace}.svc.cluster.local:8002"
  }
}
