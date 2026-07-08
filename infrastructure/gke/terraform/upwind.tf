# Upwind GKE operator (optional — set credentials in terraform.tfvars)
module "kubernetes_helm_upwind_operator" {
  count  = var.upwind_client_id != "" ? 1 : 0
  source = "https://get.upwind.io/terraform/modules/kubernetes-helm-upwind-operator/kubernetes-helm-upwind-operator-1.1.0.tar.gz"

  upwind_client_id     = var.upwind_client_id
  upwind_client_secret = var.upwind_client_secret

  helm_release_config = {
    values = [
      <<-EOF
region: us
extraArgs:
    - --cloud-provider=gcp
    - --cloud-account-id=${var.project_id}
    - --cluster-name=${google_container_cluster.main.name}
agent:
    values:
        extraArgs:
            - --cloud-provider=gcp
            - --cloud-account-id=${var.project_id}
            - --cluster-name=${google_container_cluster.main.name}
        scanAgent:
            enabled: true
            sidecar: false
clusterAgent:
    values:
        resources:
            limits:
                cpu: 500m
                memory: 1Gi
            requests:
                cpu: 100m
                memory: 256Mi
        extraArgs:
            - --cloud-provider=gcp
            - --cloud-account-id=${var.project_id}
            - --cluster-name=${google_container_cluster.main.name}
        replicas: 1
        scanJob:
            enabled: false
EOF
    ]
  }

  depends_on = [google_container_node_pool.main]
}
