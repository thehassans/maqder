#!/bin/bash
set -e

# Detect docker compose command
if docker compose version &>/dev/null; then
  COMPOSE="docker compose"
elif docker-compose version &>/dev/null; then
  COMPOSE="docker-compose"
else
  echo "Error: docker compose is not installed" >&2
  exit 1
fi

DEPLOY_PATH="/var/www/vhosts/maqder.com/httpdocs"
cd "$DEPLOY_PATH"

echo "Pulling latest code..."
git fetch origin main
git reset --hard origin/main

echo "Deploying with $COMPOSE..."
$COMPOSE down
$COMPOSE up -d --build

echo "Deployment complete. Running containers:"
$COMPOSE ps
