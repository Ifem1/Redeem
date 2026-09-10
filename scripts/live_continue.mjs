import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
const c=createClient({chain:studionet,account:createAccount(process.env.REDEEM_ISSUER)}); const address=process.env.REDEEM_CONTRACT
const h=await c.writeContract({address,functionName:'evaluate_redemption',args:[1n],value:0n}); console.log('evaluate',h); console.log(JSON.stringify(await c.waitForTransactionReceipt({hash:h,status:'FINALIZED',retries:100,interval:5000})))
const f=await c.writeContract({address,functionName:'finalize_redemption',args:[1n],value:0n}); console.log('finalize',f); console.log(JSON.stringify(await c.waitForTransactionReceipt({hash:f,status:'FINALIZED',retries:100,interval:5000})))
