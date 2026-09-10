import { createClient, createAccount } from 'file:///C:/Users/DELL/AppData/Roaming/npm/node_modules/genlayer/node_modules/genlayer-js/dist/index.js'
import { studionet } from 'file:///C:/Users/DELL/AppData/Roaming/npm/node_modules/genlayer/node_modules/genlayer-js/dist/chains/index.js'

const address = process.env.REDEEM_CONTRACT
const safe = (value) => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v)
const issuer = createClient({ chain: studionet, account: createAccount(process.env.REDEEM_ISSUER) })
const beneficiary = createClient({ chain: studionet, account: createAccount(process.env.REDEEM_BENEFICIARY) })
const args = [process.env.REDEEM_BENEFICIARY, 'Live service guarantee', 'A public uptime promise', 0n, 4102444800n, 0n, 4102444800n, 'https://example.com', 'OK\nBREACH', '0,10000']
const createHash = await issuer.writeContract({ address, functionName: 'create_guarantee', args, value: 1000000000000000000n })
console.log('create', createHash)
const createReceipt=await issuer.waitForTransactionReceipt({ hash: createHash, status: 'FINALIZED', retries: 100, interval: 5000 }); console.log('create-receipt',safe(createReceipt)); if(createReceipt.status_name!=='FINALIZED') throw new Error('creation did not finalize')
const openHash = await beneficiary.writeContract({ address, functionName: 'open_redemption', args: [1n], value: 0n })
console.log('open', openHash)
const openReceipt=await beneficiary.waitForTransactionReceipt({ hash: openHash, status: 'FINALIZED', retries: 100, interval: 5000 }); console.log('open-receipt',safe(openReceipt)); if(openReceipt.status_name!=='FINALIZED') throw new Error('open did not finalize')
const evalHash = await issuer.writeContract({ address, functionName: 'evaluate_redemption', args: [1n], value: 0n })
console.log('evaluate', evalHash)
const evalReceipt = await issuer.waitForTransactionReceipt({ hash: evalHash, status: 'FINALIZED', retries: 100, interval: 5000 })
console.log('evaluate-receipt', safe(evalReceipt))
const finalHash = await issuer.writeContract({ address, functionName: 'finalize_redemption', args: [1n], value: 0n })
console.log('finalize', finalHash)
const finalReceipt = await issuer.waitForTransactionReceipt({ hash: finalHash, status: 'FINALIZED', retries: 100, interval: 5000 })
console.log('finalize-receipt', safe(finalReceipt))
