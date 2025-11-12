Param(
    [string]$ProjectRoot = "F:\Windsurf proyectos\Inventarios ASD",
    [string]$NodeEnv = "production",
    [string]$Pm2ProcessName = "inventarios-backend",
    [switch]$RunMigrations
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Iniciando despliegue backend (PowerShell)" -ForegroundColor Cyan

$backendPath = Join-Path $ProjectRoot "backend"
if (-not (Test-Path $backendPath)) {
    throw "No se encontró el directorio backend en $backendPath"
}

Set-Location $backendPath

Write-Host "📦 Instalando dependencias (npm ci --only=production)" -ForegroundColor Yellow
npm ci --only=production

if ($LASTEXITCODE -ne 0) {
    throw "npm ci falló con código $LASTEXITCODE"
}

if ($RunMigrations.IsPresent) {
    Write-Host "🛠️ Ejecutando migraciones Sequelize" -ForegroundColor Yellow
    npx sequelize-cli db:migrate
    if ($LASTEXITCODE -ne 0) {
        throw "Las migraciones fallaron con código $LASTEXITCODE"
    }
}

Write-Host "📄 Generando archivo .env.production si no existe" -ForegroundColor Yellow
$envFile = Join-Path $backendPath ".env.production"
if (-not (Test-Path $envFile)) {
    throw "Se requiere $envFile con las variables de entorno de producción"
}

$env:NODE_ENV = $NodeEnv

Write-Host "🔁 Reiniciando proceso con PM2" -ForegroundColor Yellow
pm2 describe $Pm2ProcessName | Out-Null 2>$null
if ($LASTEXITCODE -eq 0) {
    pm2 reload $Pm2ProcessName --update-env
} else {
    pm2 start npm --name $Pm2ProcessName -- run start
}
pm2 save

Write-Host "✅ Backend desplegado correctamente" -ForegroundColor Green
