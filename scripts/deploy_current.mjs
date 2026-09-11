import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
const client=createClient({chain:studionet, account:createAccount(process.env.REDEEM_ISSUER)})
import { readFile } from 'node:fs/promises'
const code=await readFile('contracts/redeem.py','utf8')
const hash=await client.deployContract({code,args:[]})
console.log('deploy',hash)
const receipt=await client.waitForTransactionReceipt({hash,status:'FINALIZED',retries:100,interval:5000});console.log(JSON.stringify({hash:receipt.hash,address:receipt.data?.contract_address,result_name:receipt.result_name,execution_result:receipt.consensus_data?.leader_receipt?.[0]?.execution_result,status_name:receipt.status_name}))
