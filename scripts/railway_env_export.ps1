# PowerShell script to read config.env and print KEY=VALUE lines for Railway
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$config = Join-Path $scriptDir '..\config.env' -Resolve
if (-not (Test-Path $config)) {
  Write-Error "config.env not found at $config"
  exit 1
}
Write-Output '# Copy the following lines into Railway Dashboard -> Variables (KEY=VALUE):'
Get-Content $config | ForEach-Object {
  $line = $_ -replace '#.*$',''  # strip comments
  $line = $line.Trim()
  if ([string]::IsNullOrWhiteSpace($line)) { return }
  if ($line -notmatch '=') { return }
  $parts = $line.Split('=',2)
  $key = $parts[0].Trim()
  $val = $parts[1].Trim()
  if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
    $val = $val.Substring(1,$val.Length-2)
  }
  Write-Output "$key=$val"
}
