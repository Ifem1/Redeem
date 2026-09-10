# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from dataclasses import dataclass
from genlayer import *

ACTIVE=0; OPEN=1; PROVISIONAL=2; CHALLENGED=3; PAID=4; DENIED=5

@allow_storage
@dataclass
class Guarantee:
    issuer: Address
    beneficiary: Address
    title: str
    terms: str
    sources: str
    outcomes: str
    payouts: str
    escrow: u256
    status: u8
    redemption: bool

class Redeem(gl.Contract):
    next_id: u256
    guarantees: TreeMap[u256, Guarantee]

    def __init__(self):
        self.next_id=u256(1)
        self.guarantees=TreeMap()

    def _get(self,gid:u256)->Guarantee:
        assert gid in self.guarantees,"unknown guarantee"
        return self.guarantees[gid]
    def _pay(self,to:Address,amount:u256):
        if amount>0:
            @gl.evm.contract_interface
            class Recipient:
                class View: pass
                class Write: pass
            Recipient(to).emit_transfer(value=amount)
    def _set(self,gid:u256,to:Address,amount:u256,status:u8):
        g=self._get(gid); assert g.escrow>=amount; g.escrow-=amount; g.status=status; self.guarantees[gid]=g; self._pay(to,amount)

    @gl.public.write.payable
    def create_guarantee(self,beneficiary:Address,title:str,terms:str,coverage_start:u256,coverage_end:u256,evaluation_earliest_at:u256,claim_deadline:u256,source_urls:str,outcome_codes:str,payout_bps:str):
        assert beneficiary!=Address.zero() and beneficiary!=gl.message.sender_address
        assert 0<len(title)<=140 and 0<len(terms)<=2000 and coverage_start<coverage_end<=claim_deadline and coverage_start<=evaluation_earliest_at<=claim_deadline and gl.message.value>0
        ss=source_urls.split("\n"); cs=outcome_codes.split("\n"); ps=payout_bps.split(",")
        assert 1<=len(ss)<=4 and 2<=len(cs)<=5 and len(cs)==len(ps) and all(x.startswith("https://") for x in ss) and len(set(ss))==len(ss) and len(set(cs))==len(cs)
        assert any(int(x)==0 for x in ps) and any(int(x)>0 for x in ps)
        for x in ps: assert 0<=int(x)<=10000
        gid=self.next_id; self.next_id+=1; self.guarantees[gid]=Guarantee(gl.message.sender_address,beneficiary,title,terms,source_urls,outcome_codes,payout_bps,gl.message.value,u8(ACTIVE),False)

    @gl.public.write
    def open_redemption(self,guarantee_id:u256):
        g=self._get(guarantee_id); assert g.status==u8(ACTIVE) and not g.redemption and gl.message.sender_address==g.beneficiary; g.redemption=True; g.status=u8(OPEN); self.guarantees[guarantee_id]=g
    @gl.public.write
    def evaluate_redemption(self,guarantee_id:u256):
        g=self._get(guarantee_id); assert g.status==u8(OPEN)
        def review()->str:
            page=gl.nondet.web.render(g.sources.split("\n")[0],mode="text")[:4000]
            return gl.nondet.exec_prompt("Return JSON {outcome_code,reasoning}; choose only a frozen outcome code. Terms:"+g.terms+" Evidence:"+page)
        result=gl.eq_principle.prompt_comparative(review,principle="outcome_code must match and be a frozen code; reasoning is non-economic")
        g.status=u8(PROVISIONAL); self.guarantees[guarantee_id]=g
    @gl.public.write.payable
    def challenge_redemption(self,guarantee_id:u256,reason:str):
        g=self._get(guarantee_id); assert g.status==u8(PROVISIONAL) and (gl.message.sender_address==g.issuer or gl.message.sender_address==g.beneficiary) and gl.message.value==g.escrow*u256(500)//u256(10000) and len(reason)<=500; g.status=u8(CHALLENGED); self.guarantees[guarantee_id]=g
    @gl.public.write
    def resolve_challenge(self,guarantee_id:u256):
        g=self._get(guarantee_id); assert g.status==u8(CHALLENGED); self._set(guarantee_id,g.beneficiary,g.escrow,u8(PAID))
    @gl.public.write
    def finalize_redemption(self,guarantee_id:u256):
        g=self._get(guarantee_id); assert g.status==u8(PROVISIONAL); self._set(guarantee_id,g.beneficiary,g.escrow,u8(PAID))
    @gl.public.write
    def reclaim_expired_guarantee(self,guarantee_id:u256):
        g=self._get(guarantee_id); assert g.status==u8(ACTIVE); self._set(guarantee_id,g.issuer,g.escrow,u8(DENIED))
    @gl.public.view
    def get_guarantee(self,guarantee_id:u256)->Guarantee: return self._get(guarantee_id)
    @gl.public.view
    def get_status(self,guarantee_id:u256)->u8: return self._get(guarantee_id).status
