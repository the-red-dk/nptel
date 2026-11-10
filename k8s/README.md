# Kubernetes deployment

Replace `ghcr.io/OWNER/REPOSITORY:latest` in `app.yaml` with the image published by GitHub Actions. Create the credentials outside Git, then apply the manifests:

```sh
kubectl create secret generic postgres-secrets --from-literal=password='YOUR_DB_PASSWORD'
kubectl create secret generic nptelboard-secrets \
  --from-literal=database-url='postgresql://nptelboard:YOUR_DB_PASSWORD@postgres:5432/nptelboard?schema=public' \
  --from-literal=admin-password='YOUR_ADMIN_PASSWORD' \
  --from-literal=otp-secret='YOUR_RANDOM_64_HEX_CHAR_SECRET' \
  --from-literal=resend-api-key='YOUR_RESEND_KEY' \
  --from-literal=email-from='NPTELBoard <verified-sender@example.com>'
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/app.yaml
```

The application container applies committed Prisma migrations and the idempotent starter seed at startup. Set `YOUR_HOSTNAME` in `app.yaml`. The NodePort service listens on `30080`; use your cluster's node address, or add an Ingress for a hostname and TLS.
