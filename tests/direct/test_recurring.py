import json
import sys
import pytest

SOURCE = json.dumps([{"label":"primary","url":"https://example.com/status","authority":"PRIMARY","required":True}])
OUTCOMES = json.dumps([{"code":"MET","description":"met","payout_bps":0},{"code":"MINOR","description":"minor","payout_bps":4000},{"code":"MAJOR","description":"major","payout_bps":10000}])
START = 1893456000  # 2030-01-01T00:00:00Z

def addr(c, value): return type(c._zero())(value)

def create(vm, c, issuer, beneficiary, epochs=3, escrow=3000, duration=10, grace=20):
    vm.sender=addr(c,issuer); vm.value=escrow
    c.create_recurring_guarantee(addr(c,beneficiary),"Weekly uptime","Frozen SLA",START,duration,epochs,grace,escrow,SOURCE,OUTCOMES)

def warp(vm, timestamp):
    vm.warp(timestamp)
    sys.modules["genlayer.gl"].message_raw["datetime"] = timestamp

@pytest.mark.direct
def test_recurring_creation_freezes_equal_bounded_epoch_liability(direct_vm,direct_deploy,direct_alice,direct_bob):
    c=direct_deploy("contracts/redeem.py"); create(direct_vm,c,direct_alice,direct_bob)
    p=c.get_recurring_guarantee(1)
    assert p.epoch_count==3 and p.funded==3000 and p.remaining==3000
    assert c.get_epoch(1,0).liability==1000 and c.get_epoch(1,2).coverage_start==START+20
    assert c.get_epoch(1,2).coverage_end==START+30 and c.get_recurring_accounting(1)["paid"]==0

@pytest.mark.direct
@pytest.mark.parametrize("count",[1,13])
def test_recurring_epoch_count_is_bounded(direct_vm,direct_deploy,direct_alice,direct_bob,count):
    c=direct_deploy("contracts/redeem.py");direct_vm.sender=addr(c,direct_alice);direct_vm.value=count*1000
    with pytest.raises(AssertionError):c.create_recurring_guarantee(addr(c,direct_bob),"x","y",100,10,count,20,count*1000,SOURCE,OUTCOMES)

@pytest.mark.direct
def test_recurring_rejects_non_divisible_liability(direct_vm,direct_deploy,direct_alice,direct_bob):
    c=direct_deploy("contracts/redeem.py");direct_vm.sender=addr(c,direct_alice);direct_vm.value=1001
    with pytest.raises(AssertionError):c.create_recurring_guarantee(addr(c,direct_bob),"x","y",100,10,3,20,1001,SOURCE,OUTCOMES)

@pytest.mark.direct
def test_future_epoch_cannot_be_opened_early(direct_vm,direct_deploy,direct_alice,direct_bob):
    c=direct_deploy("contracts/redeem.py");create(direct_vm,c,direct_alice,direct_bob)
    direct_vm.sender=addr(c,direct_bob);warp(direct_vm,"2030-01-01T00:00:15Z")
    with pytest.raises(AssertionError):c.open_epoch(1,1)

@pytest.mark.direct
def test_expired_unclaimed_epoch_is_terminal_and_keeps_refund_for_parent_close(direct_vm,direct_deploy,direct_alice,direct_bob):
    c=direct_deploy("contracts/redeem.py");create(direct_vm,c,direct_alice,direct_bob)
    warp(direct_vm,"2030-01-01T00:00:31Z")
    assert int(c._now()) > int(c.get_epoch(1,0).claim_deadline)
    c.expire_epoch(1,0)
    assert c.get_epoch(1,0).status==7
    assert c.get_recurring_accounting(1)["remaining"]==3000

@pytest.mark.direct
def test_parent_cannot_finalize_with_unresolved_epochs(direct_vm,direct_deploy,direct_alice,direct_bob):
    c=direct_deploy("contracts/redeem.py");create(direct_vm,c,direct_alice,direct_bob)
    with pytest.raises(AssertionError):c.finalize_recurring(1)

@pytest.mark.direct
def test_epoch_outcomes_settle_independently_and_preserve_parent_liability(direct_vm,direct_deploy,direct_alice,direct_bob,direct_charlie):
    c=direct_deploy("contracts/redeem.py");create(direct_vm,c,direct_alice,direct_bob,epochs=2,escrow=20000,duration=172800,grace=172800)
    direct_vm.mock_web("example.com/status",{"method":"GET","status":200,"body":"Service was available throughout this period."})
    direct_vm.sender=addr(c,direct_bob);warp(direct_vm,"2030-01-03T00:00:00Z");c.open_epoch(1,0)
    direct_vm.mock_llm(".*","MET");direct_vm.sender=addr(c,direct_charlie);c.evaluate_epoch(1,0)
    assert c.get_epoch(1,0).provisional_code=="MET" and c.get_epoch(1,1).status==0
    warp(direct_vm,"2030-01-05T00:00:11Z");c.finalize_epoch(1,0)
    assert c.get_epoch(1,0).status==6 and c.get_epoch(1,1).status==0
    assert c.get_recurring_accounting(1)["remaining"]==20000
    direct_vm.clear_mocks();direct_vm.mock_web("example.com/status",{"method":"GET","status":200,"body":"Service failed during the second period."})
    warp(direct_vm,"2030-01-05T00:00:11Z");direct_vm.sender=addr(c,direct_bob);c.open_epoch(1,1)
    direct_vm.mock_llm(".*","MAJOR");direct_vm.sender=addr(c,direct_charlie);c.evaluate_epoch(1,1)
    assert c.get_epoch(1,1).provisional_code=="MAJOR" and c.get_epoch(1,0).final_code=="MET"
    warp(direct_vm,"2030-01-07T00:00:12Z");c.finalize_epoch(1,1)
    assert c.get_epoch(1,1).status==5 and c.get_epoch(1,1).paid==10000
    assert c.get_recurring_accounting(1)["paid"]==10000 and c.get_recurring_accounting(1)["remaining"]==10000

@pytest.mark.direct
def test_challenge_bond_and_result_are_scoped_to_one_epoch(direct_vm,direct_deploy,direct_alice,direct_bob,direct_charlie):
    c=direct_deploy("contracts/redeem.py");create(direct_vm,c,direct_alice,direct_bob,epochs=2,escrow=40000,duration=172800,grace=172800)
    direct_vm.mock_web("example.com/status",{"method":"GET","status":200,"body":"Initial status"})
    direct_vm.sender=addr(c,direct_bob);warp(direct_vm,"2030-01-03T00:00:00Z");c.open_epoch(1,0)
    direct_vm.mock_llm(".*","MET");direct_vm.sender=addr(c,direct_charlie);c.evaluate_epoch(1,0)
    bond=1000;direct_vm.sender=addr(c,direct_bob);direct_vm.value=bond;c.challenge_epoch(1,0)
    assert c.get_epoch(1,0).status==4 and c.get_epoch(1,0).challenge_bond==bond
    assert c.get_epoch(1,1).status==0 and c.get_contract_accounting()["bonds_locked"]==bond
    direct_vm.clear_mocks();direct_vm.mock_web("example.com/status",{"method":"GET","status":200,"body":"Major breach evidence"})
    direct_vm.mock_llm(".*","MAJOR");direct_vm.sender=addr(c,direct_charlie);c.resolve_epoch_challenge(1,0)
    assert c.get_epoch(1,0).status==5 and c.get_epoch(1,0).final_code=="MAJOR"
    assert c.get_epoch(1,1).status==0
    accounting=c.get_contract_accounting()
    assert accounting["bonds_locked"]==0 and accounting["bonds_returned"]==bond and accounting["bonds_forfeited"]==0

@pytest.mark.direct
def test_permissionless_parent_finalization_refunds_all_unused_liability(direct_vm,direct_deploy,direct_alice,direct_bob,direct_charlie):
    c=direct_deploy("contracts/redeem.py");create(direct_vm,c,direct_alice,direct_bob)
    direct_vm.sender=addr(c,direct_charlie);warp(direct_vm,"2030-01-01T00:00:51Z")
    for n in range(3):c.expire_epoch(1,n)
    c.finalize_recurring(1)
    p=c.get_recurring_accounting(1)
    assert p=={"funded":3000,"remaining":0,"paid":0,"refunded":3000}
    assert c.get_recurring_guarantee(1).status==6
    assert [c.get_epoch(1,n).refunded for n in range(3)]==[1000,1000,1000]

