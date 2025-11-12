Param(
    [string]$ProjectRoot = "F:\Windsurf proyectos\Inventarios ASD",
    [string]$NodeEnv = "production"
)

$ErrorActionPreference = "Stop"

$backendPath = Join-Path $ProjectRoot "backend"
if (-not (Test-Path $backendPath)) {
    throw "Directorio backend no encontrado: $backendPath"
}

Set-Location $backendPath
$env:NODE_ENV = $NodeEnv

if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    throw "npx no está disponible en el PATH"
}

Write-Host "🛠️ Ejecutando migraciones para entorno $NodeEnv" -ForegroundColor Yellow
npx sequelize-cli db:migrate
if ($LASTEXITCODE -ne 0) {
    throw "Migraciones fallaron con código $LASTEXITCODE"
}

Write-Host "✅ Migraciones completadas" -ForegroundColor Green
