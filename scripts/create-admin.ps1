# PowerShell script to create an admin account for E-Transit
# Usage: .\create-admin.ps1

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "E-Transit Admin Account Creation" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Get input from user
$firstName = Read-Host "Enter admin first name"
$lastName = Read-Host "Enter admin last name"
$username = Read-Host "Enter admin username"
$email = Read-Host "Enter admin email (optional, press Enter to skip)"
$password = Read-Host "Enter admin password" -AsSecureString
$passwordPlain = [System.Net.NetworkCredential]::new('', $password).Password

$passwordConfirm = Read-Host "Confirm password" -AsSecureString
$passwordConfirmPlain = [System.Net.NetworkCredential]::new('', $passwordConfirm).Password

# Validate inputs
if ([string]::IsNullOrWhiteSpace($firstName) -or [string]::IsNullOrWhiteSpace($lastName) -or [string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrWhiteSpace($passwordPlain)) {
    Write-Host "Error: First name, last name, username, and password are required." -ForegroundColor Red
    exit 1
}

if ($passwordPlain -ne $passwordConfirmPlain) {
    Write-Host "Error: Passwords do not match." -ForegroundColor Red
    exit 1
}

if ($passwordPlain.Length -lt 6) {
    Write-Host "Error: Password must be at least 6 characters long." -ForegroundColor Red
    exit 1
}

if ($username.Length -lt 3) {
    Write-Host "Error: Username must be at least 3 characters long." -ForegroundColor Red
    exit 1
}

# Navigate to backend directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir ".." "backend" "Api"

if (-not (Test-Path $backendDir)) {
    Write-Host "Error: Backend directory not found at $backendDir" -ForegroundColor Red
    exit 1
}

Push-Location $backendDir

Write-Host "Running admin creation script..." -ForegroundColor Yellow

# Run the dotnet command
if ([string]::IsNullOrWhiteSpace($email)) {
    & dotnet run --no-build -- create-admin "$firstName" "$lastName" "$username" "$passwordPlain"
} else {
    & dotnet run --no-build -- create-admin "$firstName" "$lastName" "$username" "$passwordPlain" "$email"
}

$exitCode = $LASTEXITCODE
Pop-Location

if ($exitCode -eq 0) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Admin account created successfully!" -ForegroundColor Green
    Write-Host "Username: $username" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "Failed to create admin account." -ForegroundColor Red
    exit 1
}
