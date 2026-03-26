# Script pour exécuter Prisma db operations avec les variables d'environnement chargées
# Usage: .\scripts\db-operation.ps1 -Operation "push"|"seed"|"generate"

param(
    [ValidateSet("push", "seed", "generate", "studio")]
    [string]$Operation = "push"
)

# Charger les variables depuis .env
$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) ".env"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    $vars = @{}
    $content -split "`n" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $keyValue = $line -split "=", 2
            if ($keyValue.Count -eq 2) {
                $key = $keyValue[0].Trim()
                $value = $keyValue[1].Trim().TrimStart('"').TrimEnd('"')
                $vars[$key] = $value
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
                Write-Host "✓ $key chargé" -ForegroundColor Green
            }
        }
    }

    # Vérifier que DATABASE_URL est présent
    $dbUrl = $vars["DATABASE_URL"]
    if (-not $dbUrl) {
        Write-Error "DATABASE_URL non défini dans .env!"
        exit 1
    }

    Write-Host "✓ DATABASE_URL: $($dbUrl.Substring(0, 50))..." -ForegroundColor Green

    # Exécuter l'opération Prisma avec --url pour contourner les problèmes de chargement du fichier .env
    Write-Host "Exécution: npx prisma db $Operation" -ForegroundColor Cyan
    
    if ($Operation -eq "push") {
        $directUrl = $vars["DIRECT_URL"]
        if ($directUrl) {
            & npx prisma db push --url "$directUrl"
        } else {
            & npx prisma db push --url "$($vars['DATABASE_URL'])"
        }
    } elseif ($Operation -eq "seed") {
        # Exécuter le wrapper du seed qui charge les variables
        & npx tsx scripts/db-seed.ts
    } else {
        & npx prisma $Operation
    }

    exit $LASTEXITCODE
} else {
    Write-Error "Fichier .env non trouvé: $envFile"
    exit 1
}

