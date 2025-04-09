@echo off
echo Starting all containers...

echo Starting SQL Server...
docker-compose -f backend/docker-compose.sql-server.yml up -d

echo Starting Backend containers...
docker-compose -f backend/docker-compose.yml up -d --build

echo Starting Frontend containers...
docker-compose -f frontend/docker-compose.yml up -d --build

echo All containers started successfully!
pause 