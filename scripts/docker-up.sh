#!/bin/sh
set -e

# Charger les variables d'environnement si .env existe
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

docker-compose down
docker-compose up --build 