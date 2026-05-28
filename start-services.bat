@echo off
echo ========================================
echo   Smart E-Commerce Platform - Docker
echo ========================================

echo.
echo 1. Arrêt des containers existants...
docker-compose down

echo.
echo 2. Construction et démarrage des services...
docker-compose up --build -d

echo.
echo 3. Attente du démarrage des services (30 secondes)...
timeout /t 30 /nobreak

echo.
echo 4. Vérification du statut des services...
docker-compose ps

echo.
echo ========================================
echo   Services disponibles:
echo ========================================
echo   API Gateway:        http://localhost:8080
echo   Auth Service:       http://localhost:8081
echo   Product Service:    http://localhost:8082
echo   Inventory Service:  http://localhost:8083
echo   Order Service:      http://localhost:8084
echo.
echo   Bases de données:
echo   - auth_db:          localhost:3310
echo   - product_db:       localhost:3311
echo   - inventory_db:     localhost:3312
echo   - order_db:         localhost:3313
echo ========================================

pause