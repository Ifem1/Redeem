import { createClient, createAccount } from 'file:///C:/Users/DELL/AppData/Roaming/npm/node_modules/genlayer/node_modules/genlayer-js/dist/index.js'
import { CalldataAddress } from 'file:///C:/Users/DELL/AppData/Roaming/npm/node_modules/genlayer/node_modules/genlayer-js/dist/chunk-EY35NPSE.js'
import { studionet } from 'file:///C:/Users/DELL/AppData/Roaming/npm/node_modules/genlayer/node_modules/genlayer-js/dist/chains/index.js'

const address = process.env.REDEEM_CONTRACT
const safe = (value) => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v)
const issuer = createClient({ chain: studionet, account: createAccount(process.env.REDEEM_ISSUER) })
const beneficiary = createClient({ chain: studionet, account: createAccount(process.env.REDEEM_BENEFICIARY_KEY || process.env.REDEEM_BENEFICIARY) })
async function finalized(client, hash) {
  for (let i=0;i<120;i++) {
    try { const r=await client.getTransactionReceipt({hash}); if (r?.status_name==='FINALIZED' || r?.status===7) return r } catch {}
    await new Promise(resolve=>setTimeout(resolve,5000))
  }
  throw new Error(`timed out waiting for ${hash}`)
}
const beneficiaryAddress = new CalldataAddress(Uint8Array.from(Buffer.from(process.env.REDEEM_BENEFICIARY.slice(2), 'hex')))
const sources = JSON.stringify([{ label:'Example primary', url:'https://example.com', authority:'PRIMARY', required:true }])
const outcomes = JSON.stringify([{ code:'NO_BREACH', description:'No breach established', payout_bps:0 }, { code:'BREACH', description:'Breach established', payout_bps:10000 }])
const args = [beneficiaryAddress, 'Live service guarantee', 'A public uptime promise', 0n, 4102444800n, 0n, 4102444800n, 1000000000000000000n, sources, outcomes]
const createHash = await issuer.writeContract({ address, functionName: 'create_guarantee', args, value: 1000000000000000000n })
console.log('create', createHash)
const createReceipt=await finalized(issuer,createHash); console.log('create-receipt',safe(createReceipt)); if(createReceipt.status_name!=='FINALIZED') throw new Error('creation did not finalize')
const openHash = await beneficiary.writeContract({ address, functionName: 'open_redemption', args: [1n], value: 0n })
console.log('open', openHash)
const openReceipt=await finalized(beneficiary,openHash); console.log('open-receipt',safe(openReceipt)); if(openReceipt.status_name!=='FINALIZED') throw new Error('open did not finalize')
const evalHash = await issuer.writeContract({ address, functionName: 'evaluate_redemption', args: [1n], value: 0n })
console.log('evaluate', evalHash)
const evalReceipt = await finalized(issuer,evalHash)
console.log('evaluate-receipt', safe(evalReceipt))
const finalHash = await issuer.writeContract({ address, functionName: 'finalize_redemption', args: [1n], value: 0n })
console.log('finalize', finalHash)
const finalReceipt = await finalized(issuer,finalHash)
console.log('finalize-receipt', safe(finalReceipt))
