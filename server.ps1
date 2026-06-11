
# Counselor Connect — Simple HTTP Server (PowerShell + .NET)
# Jalankan file ini untuk membuka frontend di browser

$port = 8080
$root = Join-Path $PSScriptRoot "frontend"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host ""
Write-Host "  =====================================" -ForegroundColor Cyan
Write-Host "    Counselor Connect Server Berjalan!" -ForegroundColor Green
Write-Host "  =====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Panel Admin   : http://localhost:$port/admin.html" -ForegroundColor Yellow
Write-Host "  Kuesioner Demo: http://localhost:$port/index.html?token=abc123xyz" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Gray
Write-Host ""

# Auto-open browser
Start-Process "http://localhost:$port/admin.html"

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
  ".woff2"= "font/woff2"
  ".woff" = "font/woff"
  ".ttf"  = "font/ttf"
}

while ($listener.IsListening) {
  try {
    $context  = $listener.GetContext()
    $request  = $context.Request
    $response = $context.Response

    $urlPath = $request.Url.LocalPath
    if ($urlPath -eq "/") { $urlPath = "/admin.html" }

    $filePath = Join-Path $root $urlPath.TrimStart("/").Replace("/", "\")

    if (Test-Path $filePath -PathType Leaf) {
      $ext      = [System.IO.Path]::GetExtension($filePath).ToLower()
      $mime     = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
      $content  = [System.IO.File]::ReadAllBytes($filePath)

      $response.ContentType   = $mime
      $response.ContentLength64 = $content.Length
      $response.StatusCode    = 200
      $response.OutputStream.Write($content, 0, $content.Length)
      Write-Host "  200  $urlPath" -ForegroundColor DarkGray
    } else {
      $notFound = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1><p>$urlPath</p>")
      $response.StatusCode      = 404
      $response.ContentType     = "text/html"
      $response.ContentLength64 = $notFound.Length
      $response.OutputStream.Write($notFound, 0, $notFound.Length)
      Write-Host "  404  $urlPath" -ForegroundColor Red
    }

    $response.OutputStream.Close()
  } catch {
    if ($listener.IsListening) {
      Write-Host "  Error: $_" -ForegroundColor Red
    }
  }
}
