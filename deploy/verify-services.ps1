Param(
    [string]$BackendUrl = "http://localhost:5003/api/health",
    [string]$DatabaseHost = "localhost",
    [int]$DatabasePort = 5432
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Verificando salud del backend" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $BackendUrl -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend OK" -ForegroundColor Green
    } else {
        Write-Warning "Backend respondió con código $($response.StatusCode)"
    }
} catch {
    Write-Error "No se pudo contactar el backend: $_"
}

Write-Host "🔍 Verificando puerto de base de datos" -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $asyncResult = $tcpClient.BeginConnect($DatabaseHost, $DatabasePort, $null, $null)
    $waitHandle = $asyncResult.AsyncWaitHandle
    if ($waitHandle.WaitOne(3000)) {
        $tcpClient.EndConnect($asyncResult)
        Write-Host "✅ PostgreSQL accesible en $DatabaseHost:$DatabasePort" -ForegroundColor Green
    } else {
        throw "Timeout al conectar"
    }
    $tcpClient.Close()
} catch {
    Write-Error "No se pudo conectar a PostgreSQL: $_"
}
