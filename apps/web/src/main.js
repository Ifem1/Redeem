import './style.css';
import { createClient, createAccount } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { CHAIN_ID } from './protocol.js';

const app = document.querySelector('#app');
const qs = selector => /** @type {any} */ (document.querySelector(selector));
const address = import.meta.env.VITE_REDEEM_CONTRACT_ADDRESS || '';
let client, wallet;
const routes = ['/', '/issue', '/guarantees', '/my-rights', '/my-issued', '/activity', '/about'];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nav = () => routes.map(r => `<a href="${r}" data-link>${r === '/' ? 'Home' : r.slice(1).replaceAll('-', ' ')}</a>`).join('');
function shell(body) {
  app.innerHTML = `<main><nav><a class="mark" href="/" data-link>REDEEM</a><div class="links">${nav()}</div><button id="connect">${wallet ? wallet.slice(0, 6) + '…' + wallet.slice(-4) : 'Connect wallet'}</button></nav>${body}<footer>Studionet · ${CHAIN_ID} · AI classifies. Deterministic code pays.</footer></main>`;
  document.querySelectorAll('[data-link]').forEach(a => a.onclick = e => { e.preventDefault(); history.pushState({}, '', a.getAttribute('href')); render(); });
  qs('#connect').onclick = connect;
}
async function connect() {
  if (!window.ethereum) return alert('Install an external EIP-1193 wallet.');
  const id = Number(await window.ethereum.request({ method: 'eth_chainId' }));
  if (id !== CHAIN_ID) return alert(`Switch to GenLayer Studionet (${CHAIN_ID}).`);
  [wallet] = await window.ethereum.request({ method: 'eth_requestAccounts' });
  client = createClient({ chain: studionet, provider: window.ethereum, account: createAccount(wallet) });
  render();
}
const read = (functionName, args = []) => {
  if (!client || !address) throw new Error('Connect a wallet and set VITE_REDEEM_CONTRACT_ADDRESS.');
  return client.readContract({ address, functionName, args });
};
async function write(functionName, args = [], value = 0n) {
  if (!client || !address || !wallet) throw new Error('Connect a wallet and set the verified contract address.');
  const hash = await client.writeContract({ address, functionName, args, value });
  return client.waitForTransactionReceipt({ hash });
}
function issue() {
  shell(`<header class="page"><p class="eyebrow">ISSUE</p><h1>Fund a guarantee.</h1></header><section class="panel"><form id="issue-form" class="form">
  <label>Beneficiary<input name="beneficiary" required placeholder="0x…"></label><label>Title<input name="title" required></label><label>Terms<textarea name="terms" required></textarea></label>
  <label>Coverage start<input name="start" type="number" required></label><label>Coverage end<input name="end" type="number" required></label><label>Evaluation earliest<input name="evaluate" type="number" required></label><label>Claim deadline<input name="deadline" type="number" required></label><label>Escrow (wei)<input name="escrow" type="number" min="1" required></label>
  <label>Source rules JSON<textarea name="sources" required>[{"label":"Status page","url":"https://example.com/status","authority":"PRIMARY","required":true}]</textarea></label><label>Outcome rules JSON<textarea name="outcomes" required>[{"code":"MET","description":"Promise met","payout_bps":10000},{"code":"BREACH","description":"Promise breached","payout_bps":0}]</textarea></label><button>Review & fund</button><p id="issue-status" class="notice">Immutable terms are sent to the finalized contract.</p></form></section>`);
}
async function submitIssue(e) {
  e.preventDefault(); const f = new FormData(e.currentTarget), status = qs('#issue-status');
  try { status.textContent = 'Awaiting wallet approval…'; const receipt = await write('create_guarantee', [f.get('beneficiary'), f.get('title'), f.get('terms'), Number(f.get('start')), Number(f.get('end')), Number(f.get('evaluate')), Number(f.get('deadline')), BigInt(f.get('escrow')), f.get('sources'), f.get('outcomes')], BigInt(f.get('escrow'))); status.textContent = `Submitted: ${receipt?.transaction_hash || receipt?.hash || 'confirmed'}`; } catch (err) { status.textContent = `Blocked: ${err.message}`; }
}
async function detail(id) {
  shell(`<header class="page"><p class="eyebrow">GUARANTEE DETAIL</p><h1>#${esc(id)}</h1></header><section class="panel"><p id="record">Loading contract state…</p><div class="actions"><button data-action="open_redemption">Open redemption</button><button data-action="evaluate_redemption">Evaluate</button><button data-action="challenge_redemption">Challenge</button><button data-action="finalize_redemption">Finalize</button></div></section>`);
  try { qs('#record').textContent = JSON.stringify(await read('get_guarantee', [Number(id)])); } catch (e) { qs('#record').textContent = `Unavailable: ${e.message}`; }
  document.querySelectorAll('[data-action]').forEach(b => b.onclick = async () => { try { b.disabled = true; b.textContent = 'Submitting…'; await write(b.dataset.action, [Number(id)]); b.textContent = 'Confirmed'; } catch (e) { b.disabled = false; b.textContent = `Blocked: ${e.message}`; } });
}
async function collection(title, filter) {
  shell(`<header class="page"><p class="eyebrow">${title.toUpperCase()}</p><h1>${title}</h1></header><section class="panel"><p id="records">Reading verified contract state…</p></section>`);
  try { const count = await read('get_guarantee_counter'), rows = await read(filter || 'list_guarantees', filter ? [wallet, 0, 25] : [0, 25]); qs('#records').textContent = `${count} guarantees\n${JSON.stringify(rows)}`; } catch (e) { qs('#records').textContent = `Unavailable: ${e.message}`; }
}
function render() { const p = location.pathname; if (p === '/') return shell(`<section class="hero"><p class="eyebrow">ESCROW-BACKED GUARANTEES</p><h1>Promises, backed<br><em>before they break.</em></h1><p class="lede">Fund immutable terms, approved evidence and deterministic payouts.</p><div class="actions"><a class="button" href="/issue" data-link>Issue a guarantee</a><a class="button ghost" href="/guarantees" data-link>Explore</a></div></section>`); if (p === '/issue') { issue(); document.querySelector('#issue-form').onsubmit = submitIssue; return; } if (p.startsWith('/guarantees/')) return detail(p.split('/').pop()); if (p === '/about') return shell('<header class="page"><p class="eyebrow">ABOUT REDEEM</p><h1>Rules first. Payouts second.</h1><p>Redeem is a non-custodial consensus-evaluated guarantee protocol.</p></header>'); const names={'/guarantees':'Guarantees','/my-rights':'My rights','/my-issued':'My issued guarantees','/activity':'Activity'}; return collection(names[p] || 'Not found',p==='/my-rights'?'list_guarantees_by_beneficiary':p==='/my-issued'?'list_guarantees_by_issuer':undefined); }
window.onpopstate = render; render();
