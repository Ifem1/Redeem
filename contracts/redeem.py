# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from dataclasses import dataclass
import json
import datetime
from genlayer import *

ACTIVE=0; OPEN=1; PROVISIONAL=2; CHALLENGED=3; PAID=4; DENIED=5; EVALUATION_FAILED=6
CHALLENGE_GRACE=u256(3600)

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
    coverage_start: u256
    coverage_end: u256
    evaluation_earliest_at: u256
    claim_deadline: u256
    provisional_code: str
    provisional_amount: u256
    challenge_bond: u256
    challenger: Address
    challenge_deadline: u256
    evaluation_attempts: u8

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
        assert beneficiary!=self._zero_address() and beneficiary!=gl.message.sender_address
        assert 0<len(title)<=140 and 0<len(terms)<=2000 and coverage_start<coverage_end<=claim_deadline and coverage_start<=evaluation_earliest_at<=claim_deadline and gl.message.value>0
        ss=source_urls.split("\n"); cs=outcome_codes.split("\n"); ps=payout_bps.split(",")
        assert 1<=len(ss)<=4 and 2<=len(cs)<=5 and len(cs)==len(ps) and all(x.startswith("https://") for x in ss) and len(set(ss))==len(ss) and len(set(cs))==len(cs)
        assert any(int(x)==0 for x in ps) and any(int(x)>0 for x in ps)
        for x in ps: assert 0<=int(x)<=10000
        gid=self.next_id; self.next_id+=1; self.guarantees[gid]=Guarantee(self._addr(gl.message.sender_address),self._addr(beneficiary),title,terms,source_urls,outcome_codes,payout_bps,gl.message.value,u8(ACTIVE),False,coverage_start,coverage_end,evaluation_earliest_at,claim_deadline,"",u256(0),u256(0),self._zero_address(),u256(0),u8(0))

    @gl.public.write
    def open_redemption(self,guarantee_id:u256):
        g=self._get(guarantee_id); assert g.status==u8(ACTIVE) and not g.redemption and gl.message.sender_address==g.beneficiary; assert self._now()>=g.evaluation_earliest_at and self._now()<=g.claim_deadline; g.redemption=True; g.status=u8(OPEN); self.guarantees[guarantee_id]=g
    @gl.public.write
    def evaluate_redemption(self,guarantee_id:u256):
        g=self._get(guarantee_id); assert g.status in (u8(OPEN),u8(EVALUATION_FAILED)); assert self._now()<=g.claim_deadline; g.evaluation_attempts+=u8(1)
        def review()->str:
            page=gl.nondet.web.render(g.sources.split("\n")[0],mode="text")[:4000]
            return gl.nondet.exec_prompt("Return JSON {outcome_code,reasoning}; choose only a frozen outcome code. Terms:"+g.terms+" Evidence:"+page)
        result=gl.eq_principle.prompt_comparative(review,principle="outcome_code must match and be a frozen code; reasoning is non-economic")
        try:
            parsed=json.loads(result); code=parsed["outcome_code"]; amount=self._payout(g,code)
        except Exception:
            g.status=u8(EVALUATION_FAILED); self.guarantees[guarantee_id]=g; return
        g.provisional_code=code; g.provisional_amount=amount; g.challenge_deadline=self._now()+CHALLENGE_GRACE; g.status=u8(PROVISIONAL); self.guarantees[guarantee_id]=g
    @gl.public.write.payable
    def challenge_redemption(self,guarantee_id:u256,reason:str):
        g=self._get(guarantee_id); assert g.status==u8(PROVISIONAL) and self._now()<=g.challenge_deadline and (Address(gl.message.sender_address)==g.issuer or Address(gl.message.sender_address)==g.beneficiary) and gl.message.value==g.escrow*u256(500)//u256(10000) and len(reason)<=500; g.status=u8(CHALLENGED); g.challenge_bond=gl.message.value; g.challenger=Address(gl.message.sender_address); self.guarantees[guarantee_id]=g
    @gl.public.write
    def resolve_challenge(self,guarantee_id:u256):
        g=self._get(guarantee_id); assert g.status==u8(CHALLENGED) and self._now()>=g.challenge_deadline
        def second()->str:
            page=gl.nondet.web.render(g.sources.split("\n")[0],mode="text")[:4000]
            return gl.nondet.exec_prompt("Independent second review. Return JSON with outcome_code only. Frozen:"+g.outcomes+" Terms:"+g.terms+" Evidence:"+page)
        result=gl.eq_principle.prompt_comparative(second,principle="outcome_code must match and be a frozen code")
        try: code=json.loads(result)["outcome_code"]; amount=self._payout(g,code)
        except Exception: raise gl.vm.UserError("challenge resolution unavailable; retry")
        bond=g.challenge_bond; g.challenge_bond=u256(0); self.guarantees[guarantee_id]=g; self._set(guarantee_id,g.beneficiary,amount,u8(PAID) if amount>0 else u8(DENIED)); self._pay(g.challenger if amount!=g.provisional_amount else (g.issuer if g.challenger==g.beneficiary else g.beneficiary),bond)
    @gl.public.write
    def finalize_redemption(self,guarantee_id:u256):
        g=self._get(guarantee_id); assert g.status==u8(PROVISIONAL) and self._now()>=g.challenge_deadline; self._set(guarantee_id,g.beneficiary,g.provisional_amount,u8(PAID) if g.provisional_amount>0 else u8(DENIED))
    @gl.public.write
    def reclaim_expired_guarantee(self,guarantee_id:u256):
        g=self._get(guarantee_id); assert g.status==u8(ACTIVE) and self._now()>g.claim_deadline; self._set(guarantee_id,g.issuer,g.escrow,u8(DENIED))
    @gl.public.view
    def get_guarantee(self,guarantee_id:u256)->Guarantee: return self._get(guarantee_id)
    @gl.public.view
    def get_status(self,guarantee_id:u256)->u8: return self._get(guarantee_id).status
    @gl.public.view
    def status_label(self,guarantee_id:u256)->str:
        labels={0:"ACTIVE",1:"OPEN",2:"PROVISIONAL",3:"CHALLENGED",4:"PAID",5:"DENIED",6:"EVALUATION_FAILED"}
        return labels[self._get(guarantee_id).status]

    def _payout(self,g:Guarantee,code:str)->u256:
        codes=g.outcomes.split("\n"); values=g.payouts.split(","); assert len(codes)==len(values)
        for i in range(len(codes)):
            if codes[i]==code: return g.escrow*u256(int(values[i]))//u256(10000)
        raise gl.vm.UserError("outcome code is not frozen")
    def _now(self)->u256:
        return u256(int(datetime.datetime.fromisoformat(gl.message_raw["datetime"]).timestamp()))
    def _zero_address(self)->Address:
        return Address("0x0000000000000000000000000000000000000000")
    def _addr(self,value)->Address:
        return value if isinstance(value,Address) else Address(value)
