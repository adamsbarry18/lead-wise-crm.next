#!/bin/sh
set -e

docker-compose build --no-cache
docker-compose up --force-recreate 