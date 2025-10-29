param(
  [Parameter(Mandatory=$true)]
  [string]$RunId
)
$owner = 'Dhruv290405'
$repo = 'rimmel'
$logsApi = "https://api.github.com/repos/$owner/$repo/actions/runs/$RunId/logs"
$out = "e:\\rimmel\\runlogs-$RunId.zip"
Write-Output "Downloading logs for run $RunId to $out..."
try {
  Invoke-WebRequest -Uri $logsApi -OutFile $out -UseBasicParsing -ErrorAction Stop
  Write-Output "Saved logs zip: $out"
  $dest = "e:\\rimmel\\runlogs-$RunId"
  if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
  Expand-Archive -Path $out -DestinationPath $dest -Force
  Write-Output "Extracted to $dest"
  # List files
  Get-ChildItem -Path $dest -Recurse | Select-Object FullName, Length | Sort-Object FullName | Out-String | Write-Output
}
catch {
  Write-Output "Failed to download or extract logs: $_"
  exit 1
}
