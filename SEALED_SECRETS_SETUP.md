# Install Sealed Secrets controller into the cluster
# Run once:
# kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Create the cloudflare-tunnel-credentials Secret locally (unencrypted):
# kubectl create secret generic cloudflare-tunnel-credentials \
#   --from-literal=credentials.json='{"AccountTag":"4c84b5d670564238dfccc3a7d4419965","TunnelSecret":"rKPxHHDkcHJPsznQDRUgoOS5c7BvKzJqI0aDYPQ6o44=","TunnelID":"0b0b67bc-20fa-400b-a3f9-b4bc8bbadd0e","Endpoint":""}' \
#   --namespace iot-dashboard \
#   --dry-run=client \
#   -o yaml > /tmp/secret.yaml

# Seal it (encrypts with cluster public key):
# kubeseal -f /tmp/secret.yaml -w k8s/cloudflare-tunnel-sealed-secret.yaml

# The sealed secret is safe to commit to git.
# ArgoCD will apply it and the controller will decrypt it at runtime.
