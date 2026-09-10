import { createWalletClient, custom, defineChain, parseEther } from 'viem'
import './style.css'

const chain = defineChain({ id: 61999, name: 'GenLayer Studionet', nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 }, rpcUrls: { default: { http: [import.meta.env.VITE_REDEEM_RPC_URL || 'https://studio.genlayer.com/api'] } } })
const address = import.meta.env.VITE_REDEEM_CONTRACT_ADDRESS
const abi = [
  { name:'get_guarantee', type:'function', stateMutability:'view', inputs:[{name:'guarantee_id',type:'uint256'}], outputs:[{type:'string'}] },
  { name:'get_status', type:'function', stateMutability:'view', inputs:[{name:'guarantee_id',type:'uint256'}], outputs:[{type:'uint8'}] },
  { name:'open_redemption', type:'function', stateMutability:'nonpayable', inputs:[{name:'guarantee_id',type:'uint256'}], outputs:[] },
  { name:'evaluate_redemption', type:'function', stateMutability:'nonpayable', inputs:[{name:'guarantee_id',type:'uint256'}], outputs:[] },
  { name:'finalize_redemption', type:'function', stateMutability:'nonpayable', inputs:[{name:'guarantee_id',type:'uint256'}], outputs:[] },
]
const app = document.querySelector('#app')
app.innerHTML = `<main><nav><span class="mark">REDEEM</span><button id="connect">Connect wallet</button></nav><section class="hero"><p class="eyebrow">ESCROW-BACKED GUARANTEES</p><h1>Promises, backed<br><em>before they break.</em></h1><p class="lede">Turn a promise into a funded, publicly verifiable guarantee. GenLayer interprets the evidence. Deterministic code pays.</p><div class="actions"><button id="create">Create a guarantee</button><button class="ghost" id="browse">Inspect a guarantee</button></div></section><section class="panel"><h2>On-chain guarantee</h2><div class="lookup"><input id="id" type="number" min="1" placeholder="Guarantee ID"><button id="lookup">Read contract</button></div><div class="actions"><button id="open">Open redemption</button><button id="evaluate">Evaluate</button><button id="finalize">Finalize</button></div><pre id="result">Connect a wallet or enter a deployed contract address to begin.</pre></section><footer>Studionet · Chain 61999 · AI classifies. Deterministic code pays.</footer></main>`
let wallet
document.querySelector('#connect').onclick = async () => { if (!window.ethereum) return alert('Install an external wallet such as MetaMask.'); wallet = createWalletClient({ chain, transport: custom(window.ethereum) }); const [account] = await wallet.requestAddresses(); document.querySelector('#connect').textContent = account.slice(0,6)+'…'+account.slice(-4) }
document.querySelector('#lookup').onclick = async () => { if (!address) return document.querySelector('#result').textContent='No deployed contract configured. Set VITE_REDEEM_CONTRACT_ADDRESS.'; try { const r = await wallet?.readContract({ address, abi, functionName:'get_guarantee', args:[BigInt(document.querySelector('#id').value)] }); document.querySelector('#result').textContent = r || 'No guarantee found.' } catch(e) { document.querySelector('#result').textContent = e.shortMessage || e.message } }
document.querySelector('#create').onclick = () => document.querySelector('#result').textContent='Creation form is intentionally schema-driven; deploy the verified contract and wire create_guarantee with its generated ABI before accepting funds.'
document.querySelector('#browse').onclick = () => document.querySelector('#id').focus()
async function write(functionName) { if (!wallet || !address) return document.querySelector('#result').textContent='Connect a wallet and configure VITE_REDEEM_CONTRACT_ADDRESS.'; try { const [account] = await wallet.getAddresses(); const hash = await wallet.writeContract({ address, abi, functionName, args:[BigInt(document.querySelector('#id').value)], account, chain }); document.querySelector('#result').textContent = `Submitted ${functionName}: ${hash}` } catch(e) { document.querySelector('#result').textContent = e.shortMessage || e.message } }
document.querySelector('#open').onclick = () => write('open_redemption')
document.querySelector('#evaluate').onclick = () => write('evaluate_redemption')
document.querySelector('#finalize').onclick = () => write('finalize_redemption')
