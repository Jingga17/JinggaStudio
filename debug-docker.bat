@echo off
echo === START FRONTEND === > docker-debug.txt
docker start dcm-frontend >> docker-debug.txt 2>&1
echo. >> docker-debug.txt
echo === INSPECT FRONTEND ERROR === >> docker-debug.txt
docker inspect --format="{{.State.Error}}" dcm-frontend >> docker-debug.txt 2>&1
echo. >> docker-debug.txt
echo === DOCKER PS === >> docker-debug.txt
docker ps -a >> docker-debug.txt 2>&1
echo. >> docker-debug.txt
echo === DOCKER COMPOSE LOGS === >> docker-debug.txt
docker compose logs --tail=50 >> docker-debug.txt 2>&1
echo. >> docker-debug.txt
echo Diagnostics completed! Please let the AI know you have run this script.
pause
