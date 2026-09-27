# Deployment

## Previously accepted single-guarantee deployment

- Contract: `0xAf5972b86E7491ea3D16CcBb45c2c7FE358f91d2`
- Deployment transaction: `0xeb85d6f5ef1d2c52a4bc519d8a1ceb8d838a8d0776f3280cfe7b6df68030cbc0`
- Deployed source commit: `23551558807073dacebf5659f62217f6d9ee8cba`
- The original single-guarantee deployment remains at this address.

## Recurring milestone deployment

- Network: GenLayer Studionet, chain ID `61999`, RPC `https://studio.genlayer.com/api`
- Contract: `0x4a04d24fF3184c09b32dFB999096CC237DCC9f1C`
- Deployment transaction: `0x21c56699d3b464825bee74e9a29155190d68bc093000a3534d38ba9833392a87`
- Deployed source commit: `de017b824e4d811817cb493fbfd5648070180d0e`
- CLI: `npx --yes genlayer@0.39.1` (0.39.1)
- Deployment receipt: finalized, majority agreement, successful execution.
- Frontend deployment: user-managed through Vercel; set the variables below before building.

```env
VITE_REDEEM_CONTRACT_ADDRESS=0x4a04d24fF3184c09b32dFB999096CC237DCC9f1C
VITE_REDEEM_CHAIN_ID=61999
VITE_REDEEM_RPC_URL=https://studio.genlayer.com/api
```

Do not commit wallet keys. No recurring live transaction proof has been produced because the issuer and beneficiary signer keys were unavailable in this environment.
