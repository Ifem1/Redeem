import { createClient, createAccount } from 'file:///C:/Users/DELL/AppData/Roaming/npm/node_modules/genlayer/node_modules/genlayer-js/dist/index.js'
import { studionet } from 'file:///C:/Users/DELL/AppData/Roaming/npm/node_modules/genlayer/node_modules/genlayer-js/dist/chains/index.js'
const address=process.env.REDEEM_CONTRACT
const issuer=createClient({chain:studionet,account:createAccount(process.env.REDEEM_ISSUER)})
const beneficiary=createClient({chain:studionet,account:createAccount(process.env.REDEEM_BENEFICIARY_KEY)})
const safe=v=>JSON.stringify(v,(_,x)=>typeof x==='bigint'?x.toString():x)
const wait=async(c,h)=>c.waitForTransactionReceipt({hash:h,status:'FINALIZED',retries:30,interval:3000})
const open=await beneficiary.writeContract({address,functionName:'open_redemption',args:[1n],value:0n}); console.log('open',open); console.log('open-receipt',safe(await wait(beneficiary,open)))
const evaluate=await issuer.writeContract({address,functionName:'evaluate_redemption',args:[1n],value:0n}); console.log('evaluate',evaluate); console.log('evaluate-receipt',safe(await wait(issuer,evaluate)))
const finalize=await issuer.writeContract({address,functionName:'finalize_redemption',args:[1n],value:0n}); console.log('finalize',finalize); console.log('finalize-receipt',safe(await wait(issuer,finalize)))
