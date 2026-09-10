# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

@gl.evm.contract_interface
class _Recipient:
    class View: pass
    class Write: pass

class Redeem(gl.Contract):
    next_id: u256
    statuses: TreeMap[u256, u8]
    issuers: TreeMap[u256, Address]
    beneficiaries: TreeMap[u256, Address]
    escrows: TreeMap[u256, u256]
    terms: TreeMap[u256, str]
    redemptions: TreeMap[u256, str]

    def __init__(self):
        self.next_id=u256(1); self.statuses=TreeMap(); self.issuers=TreeMap(); self.beneficiaries=TreeMap(); self.escrows=TreeMap(); self.terms=TreeMap(); self.redemptions=TreeMap()

    def _send(self, to: Address, amount: u256):
        if amount > 0: _Recipient(to).emit_transfer(value=amount)
    def _known(self, gid: u256): assert self.issuers.get(gid, Address.zero()) != Address.zero(), "unknown guarantee"

    @gl.public.write.payable
    def create_guarantee(self, beneficiary: Address, title: str, terms: str, coverage_start: u256, coverage_end: u256, evaluation_earliest_at: u256, claim_deadline: u256, source_urls: str, outcome_codes: str, payout_bps: str):
        assert beneficiary != Address.zero() and beneficiary != gl.message.sender_address
        assert 0 < len(title) <= 140 and 0 < len(terms) <= 2000
        assert coverage_start < coverage_end <= claim_deadline and coverage_start <= evaluation_earliest_at <= claim_deadline and gl.message.value > 0
        urls=source_urls.split("\n"); codes=outcome_codes.split("\n"); payouts=payout_bps.split(",")
        assert 1 <= len(urls) <= 4 and 2 <= len(codes) <= 5 and len(codes)==len(payouts)
        assert all(u.startswith("https://") for u in urls) and len(set(urls))==len(urls) and len(set(codes))==len(codes)
        assert any(int(p)==0 for p in payouts) and any(int(p)>0 for p in payouts)
        for p in payouts: assert 0 <= int(p) <= 10000
        gid=self.next_id; self.next_id+=1; self.statuses[gid]=u8(0); self.issuers[gid]=gl.message.sender_address; self.beneficiaries[gid]=beneficiary; self.escrows[gid]=gl.message.value
        self.terms[gid]=title+"|"+terms+"|"+source_urls+"|"+outcome_codes+"|"+payout_bps

    @gl.public.write
    def open_redemption(self, guarantee_id: u256):
        self._known(guarantee_id); assert self.statuses[guarantee_id]==u8(0); assert gl.message.sender_address==self.beneficiaries[guarantee_id]; assert self.redemptions.get(guarantee_id,"")==""; self.redemptions[guarantee_id]="OPEN"; self.statuses[guarantee_id]=u8(1)

    @gl.public.write
    def evaluate_redemption(self, guarantee_id: u256):
        self._known(guarantee_id); assert self.statuses[guarantee_id]==u8(1); frozen=self.terms[guarantee_id]
        def review() -> str:
            evidence=gl.nondet.web.get(frozen.split("|")[2].split("\n")[0]).body.decode("utf-8")[:4000]
            return gl.nondet.exec_prompt("Return JSON with outcome_code only. Use one frozen code. Terms:"+frozen.split("|")[1]+" Evidence:"+evidence)
        result=gl.eq_principle.prompt_comparative(review, principle="outcome_code must match and be a frozen code; reasoning is untrusted")
        self.redemptions[guarantee_id]="PROVISIONAL|"+result[:1000]; self.statuses[guarantee_id]=u8(2)

    @gl.public.write.payable
    def challenge_redemption(self, guarantee_id: u256, reason: str):
        self._known(guarantee_id); assert self.statuses[guarantee_id]==u8(2); assert gl.message.sender_address==self.issuers[guarantee_id] or gl.message.sender_address==self.beneficiaries[guarantee_id]; assert gl.message.value==self.escrows[guarantee_id]*u256(500)//u256(10000); assert len(reason)<=500; self.redemptions[guarantee_id]="CHALLENGED|"+reason; self.statuses[guarantee_id]=u8(3)

    @gl.public.write
    def resolve_challenge(self, guarantee_id: u256):
        self._known(guarantee_id); assert self.statuses[guarantee_id]==u8(3); self._settle(guarantee_id,True,self.beneficiaries[guarantee_id])
    @gl.public.write
    def finalize_redemption(self, guarantee_id: u256):
        self._known(guarantee_id); assert self.statuses[guarantee_id]==u8(2); self._settle(guarantee_id,True,self.beneficiaries[guarantee_id])
    @gl.public.write
    def reclaim_expired_guarantee(self, guarantee_id: u256):
        self._known(guarantee_id); assert self.statuses[guarantee_id]==u8(0); self._refund(guarantee_id,u8(6))
    @gl.public.write
    def finalize_inconclusive(self, guarantee_id: u256):
        self._known(guarantee_id); assert self.statuses[guarantee_id]==u8(1); self._refund(guarantee_id,u8(7))
    @gl.public.write
    def finalize_stalled_challenge(self, guarantee_id: u256):
        self._known(guarantee_id); assert self.statuses[guarantee_id]==u8(3); self._settle(guarantee_id,True,self.beneficiaries[guarantee_id])
    def _settle(self,gid: u256,paid: bool,to: Address):
        amount=self.escrows[gid]; self.escrows[gid]=u256(0); self.statuses[gid]=u8(4) if paid else u8(5); self._send(to if paid else self.issuers[gid],amount)
    def _refund(self,gid: u256,status: u8):
        amount=self.escrows[gid]; self.escrows[gid]=u256(0); self.statuses[gid]=status; self._send(self.issuers[gid],amount)
    @gl.public.view
    def get_guarantee(self, guarantee_id: u256) -> str: self._known(guarantee_id); return self.terms[guarantee_id]
    @gl.public.view
    def get_status(self, guarantee_id: u256) -> u8: self._known(guarantee_id); return self.statuses[guarantee_id]
    @gl.public.view
    def status_label(self,status: u8)->str:
        labels=["ACTIVE","REDEMPTION_OPEN","PROVISIONAL","CHALLENGED","SETTLED_PAID","SETTLED_DENIED","EXPIRED_REFUNDED","INCONCLUSIVE_REFUNDED"]; assert status<len(labels); return labels[status]
