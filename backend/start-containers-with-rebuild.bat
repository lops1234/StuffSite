@echo off
docker-compose -f docker-compose.sql-server.yml up -d
docker-compose up -d --build