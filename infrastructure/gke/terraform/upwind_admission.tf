# Upwind Admission Webhook — deploy-time guardrails (OPA + audit).
# Requires the Upwind operator (upwind.tf) and cert-manager for TLS.
# Runtime monitoring remains on node scan agents (scanAgent.sidecar: false).

locals {
  upwind_enabled = var.upwind_client_id != ""
}

resource "helm_release" "cert_manager" {
  count = local.upwind_enabled ? 1 : 0

  name             = "cert-manager"
  repository       = "https://charts.jetstack.io"
  chart            = "cert-manager"
  version          = "v1.17.1"
  namespace        = "cert-manager"
  create_namespace = true
  wait             = true
  timeout          = 600

  set = [{
    name  = "crds.enabled"
    value = "true"
  }]

  depends_on = [google_container_node_pool.main]
}

resource "helm_release" "upwind_admission_webhook" {
  count = local.upwind_enabled ? 1 : 0

  name       = "upwind-admission-webhook"
  repository = "https://charts.upwind.io"
  chart      = "upwind-admission-webhook"
  version    = "0.10.6"
  namespace  = "upwind"
  wait       = true
  timeout    = 600

  values = [
    yamlencode({
      region = "us"
      credentials = {
        create     = false
        secretName = "upwind-operator-client-credentials"
      }
      certManager = {
        enabled = true
      }
      tracerInject = {
        enabled = true
      }
      opaValidateWebhook = {
        enabled = true
      }
      admissionAuditWebhook = {
        enabled = true
      }
      extraArgs = [
        "--cloud-provider=gcp",
        "--cloud-account-id=${var.project_id}",
      ]
    })
  ]

  depends_on = [
    module.kubernetes_helm_upwind_operator,
    helm_release.cert_manager,
  ]
}
