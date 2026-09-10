$ErrorActionPreference = 'Stop'
Write-Output 'Redeem reviewer verification'
Write-Output 'Target network: GenLayer Studionet (61999)'
if (-not $env:VITE_REDEEM_CONTRACT_ADDRESS) { Write-Output 'STATUS: NOT DEPLOYED (VITE_REDEEM_CONTRACT_ADDRESS is unset)' } else { Write-Output "Contract: $env:VITE_REDEEM_CONTRACT_ADDRESS" }
genvm-lint check contracts/redeem.py --json
genvm-lint schema contracts/redeem.py --output artifacts/redeem.schema.json
Write-Output 'PASS: local contract gates'
