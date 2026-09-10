import { createClient, createAccount } from 'file:///C:/Users/DELL/AppData/Roaming/npm/node_modules/genlayer/node_modules/genlayer-js/dist/index.js'
import { studionet } from 'file:///C:/Users/DELL/AppData/Roaming/npm/node_modules/genlayer/node_modules/genlayer-js/dist/chains/index.js'
const client=createClient({chain:studionet, account:createAccount(process.env.REDEEM_ISSUER)})
import { readFile } from 'node:fs/promises'
const code=await readFile('contracts/redeem.py','utf8')
const hash=await client.deployContract({code,args:[]})
console.log('deploy',hash)
console.log(JSON.stringify(await client.waitForTransactionReceipt({hash,status:'FINALIZED',retries:100,interval:5000}),(_,v)=>typeof v==='bigint'?v.toString():v))
