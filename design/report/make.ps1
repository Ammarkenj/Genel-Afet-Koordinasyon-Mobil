# Rebuilds the designed pages and the full project PDF (v3).
#   1. prints design-pages.html with headless Edge -> design-pages.pdf
#   2. merges report pages 1-7 + designed pages + the 4 boards -> -son-v3.pdf
param(
  [string]$Out = 'E:\YH\design\YasamHatti-proje-dosyasi-son-v3.pdf',
  [string]$EdgeProfile = "$env:TEMP\yh-edge-profile"
)
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$pdf = Join-Path $here 'design-pages.pdf'
if (Test-Path $pdf) { Remove-Item $pdf -Force }
& $edge --headless=new --disable-gpu --no-pdf-header-footer --allow-file-access-from-files `
  --user-data-dir="$EdgeProfile" --virtual-time-budget=8000 --print-to-pdf="$pdf" `
  "file:///$($here.Replace('\','/'))/design-pages.html" 2>$null
Start-Sleep -Seconds 3
python -X utf8 (Join-Path $here 'build_pdf.py') $Out   # no -I: Pillow is in the user site
