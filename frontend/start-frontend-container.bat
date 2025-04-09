@echo off
echo Starting Frontend container...

docker-compose -f docker-compose.yml up -d --build

echo Frontend container started successfully!
pause 