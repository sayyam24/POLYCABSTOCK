# First get the current state to find your orgId
$state = Invoke-RestMethod -Uri "http://localhost:3000/api/state" -Method Get
$distributorOrg = $state.organizations | Where-Object { $_.type -eq "distributor" }

if ($distributorOrg) {
    $orgId = $distributorOrg.id
    Write-Host "Found distributor orgId: $orgId"
    
    $body = @{
        orgId = $orgId
        quantity = 1000
        orgName = $distributorOrg.name
        orgType = "distributor"
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/bulk-update-stock" -Method Post -Body $body -ContentType "application/json"
    Write-Host "Stock update result: $($result | ConvertTo-Json)"
} else {
    Write-Host "No distributor organization found in state"
    Write-Host "Available organizations:"
    $state.organizations | ForEach-Object { Write-Host "  - $($_.id) ($($_.type)): $($_.name)" }
}
