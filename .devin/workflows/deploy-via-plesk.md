---
description: Deploy Maqder ERP to Plesk using Docker with MongoDB inside the server
---

# Deploy Maqder to Plesk via Docker

This workflow deploys the full Maqder stack (frontend, backend, MongoDB) to a Plesk server using Docker Compose.

## Prerequisites

- Plesk server with Docker extension installed
- SSH access as `maqder.com_eucg0ssmgds` or root
- Domain `maqder.com` configured in Plesk
- Git or project files uploaded to `/var/www/vhosts/maqder.com/httpdocs`

## Step 1: Upload the project

Upload the project to:

```
/var/www/vhosts/maqder.com/httpdocs
```

Make sure the following files are present:

- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `.env` (copy from `.env.example` and fill values)
- `backup.sh`

## Step 2: Create the environment file

```bash
cd /var/www/vhosts/maqder.com/httpdocs
cp .env.example .env
nano .env
```

Required values:

- `JWT_SECRET`: a long random string
- `FRONTEND_URL`: `https://maqder.com`
- `ZATCA_MODE`: `production` or `sandbox`

## Step 3: Build and start containers

// turbo
```bash
cd /var/www/vhosts/maqder.com/httpdocs
docker-compose down
docker-compose up -d --build
```

## Step 4: Verify containers are running

```bash
docker-compose ps
docker-compose logs -f backend
```

## Step 5: Configure Plesk Docker proxy

1. Go to **Plesk → Domains → maqder.com → Docker Proxy Rules**.
2. Add a new rule:
   - **Domain**: `maqder.com`
   - **Container**: `maqder_frontend`
   - **Port**: `80`
3. Save the rule.

Plesk Nginx will now forward all traffic to the frontend container.

## Step 6: SSL certificate

1. Go to **Plesk → Domains → maqder.com → SSL/TLS Certificates**.
2. Issue a free Let's Encrypt certificate.
3. Make sure the Docker proxy rule passes HTTPS to the container.

## Step 7: Set up daily backups

```bash
cd /var/www/vhosts/maqder.com/httpdocs
chmod +x backup.sh
```

Add to crontab as root or the system user:

```bash
0 3 * * * /var/www/vhosts/maqder.com/httpdocs/backup.sh >> /var/www/vhosts/maqder.com/httpdocs/logs/backup.log 2>&1
```

## Step 8: Update the application

To deploy new code:

```bash
cd /var/www/vhosts/maqder.com/httpdocs
git pull origin main
docker-compose down
docker-compose up -d --build
```

## Troubleshooting

- **Port 3000 exposed accidentally?** The backend should not be exposed directly. Only the frontend container port 80 is proxied.
- **MongoDB not connecting?** The backend uses `mongodb://mongo:27017/maqder`. Do not use `localhost` inside Docker.
- **Frontend not loading?** Check `docker-compose logs frontend` and verify the Plesk Docker proxy rule is active.
- **Backup script fails?** Make sure `docker exec` can run as the user running the cron job.

## Security notes

- MongoDB is not exposed externally (no port mapping in `docker-compose.yml`).
- Backend is only reachable through the Nginx proxy inside the container network.
- Change `JWT_SECRET` before first deployment.
- Keep backups outside the server or in a separate storage bucket.
