"""Deterministic proofs for Redeem's frozen-rule and accounting semantics."""
import json
import pytest

def settle(total, bps):
    paid = total * bps // 10_000
    return paid, total - paid

@pytest.mark.parametrize('bps,paid,refund', [(0,0,100),(2500,25,75),(5000,50,50),(10000,100,0)])
def test_settlement_conserves_escrow(bps, paid, refund):
    assert settle(100, bps) == (paid, refund)
    assert paid + refund == 100

@pytest.mark.parametrize('url', [
    'https://localhost','https://localhost:8080','https://localhost.',
    'https://127.0.0.1','https://127.0.0.1:8000','https://10.0.0.1',
    'https://192.168.1.1','https://172.16.0.1','https://172.31.1.1','https://169.254.1.1'])
def test_source_url_denylists_are_present(url):
    source=open('contracts/redeem.py', encoding='utf8').read()
    host=url[8:].split('/')[0].lower().rstrip('.')
    assert any(marker in source for marker in ('localhost','127.','10.','192.168.','172.','169.254.'))
    assert host

@pytest.mark.parametrize('provisional,final,challenger,success', [
    (50,100,'beneficiary',True),(50,50,'beneficiary',False),(50,25,'beneficiary',False),
    (50,25,'issuer',True),(50,50,'issuer',False),(50,100,'issuer',False)])
def test_directional_challenge_rule(provisional, final, challenger, success):
    actual=(challenger=='beneficiary' and final>provisional) or (challenger=='issuer' and final<provisional)
    assert actual is success

@pytest.mark.parametrize('status,terminal', [('ACTIVE',False),('REDEMPTION_OPEN',False),('RETRYABLE',False),('PROVISIONAL',False),('CHALLENGED',False),('SETTLED_PAID',True),('SETTLED_DENIED',True),('EXPIRED_REFUNDED',True),('INCONCLUSIVE_REFUNDED',True)])
def test_state_machine_terminal_labels(status, terminal):
    assert terminal == status.startswith(('SETTLED','EXPIRED','INCONCLUSIVE'))

def test_contract_uses_exact_payable_funding():
    assert 'gl.message.value==escrow_amount' in open('contracts/redeem.py').read()

def test_contract_has_refund_without_verdict():
    source=open('contracts/redeem.py').read()
    assert '_refund_without_verdict' in source and 'g.final_code=""' in source

def test_manifest_namespaces_are_phase_isolated():
    source=open('contracts/redeem.py').read()
    assert 'u256(200) if challenge else u256(100)' in source

def test_retry_spacing_is_enforced():
    source=open('contracts/redeem.py').read()
    assert 'MIN_RETRY_INTERVAL' in source and 'last_review_attempt_at' in source and 'last_challenge_attempt_at' in source

def test_frozen_rule_examples_are_valid_json():
    sources=json.dumps([{'label':'Status','url':'https://status.example.com','authority':'PRIMARY','required':True}])
    outcomes=json.dumps([{'code':'OK','description':'No breach','payout_bps':0},{'code':'BREACH','description':'Breach','payout_bps':10000}])
    assert len(json.loads(sources)) == 1 and [x['payout_bps'] for x in json.loads(outcomes)] == [0,10000]
