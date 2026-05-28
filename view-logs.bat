@echo off
echo ========================================
echo   Logs des Services
echo ========================================
echo.
echo Choisissez le service à monitorer:
echo 1. API Gateway
echo 2. Auth Service
echo 3. Product Service
echo 4. Inventory Service
echo 5. Order Service
echo 6. Tous les services
echo.

set /p choice="Votre choix (1-6): "

if "%choice%"=="1" (
    echo Logs de API Gateway...
    docker-compose logs -f api-gateway
) else if "%choice%"=="2" (
    echo Logs de Auth Service...
    docker-compose logs -f auth-service
) else if "%choice%"=="3" (
    echo Logs de Product Service...
    docker-compose logs -f product-service
) else if "%choice%"=="4" (
    echo Logs de Inventory Service...
    docker-compose logs -f inventory-service
) else if "%choice%"=="5" (
    echo Logs de Order Service...
    docker-compose logs -f order-service
) else if "%choice%"=="6" (
    echo Logs de tous les services...
    docker-compose logs -f
) else (
    echo Choix invalide!
    pause
)