"""Direct GenLayer VM integration coverage.

These tests deploy the contract through gltest's direct_deploy fixture and invoke
the public methods against the real storage/runtime adapter.  They do not mock
the contract itself; only nondeterministic review is mocked where required.
"""
import json
import pytest


SOURCE = json.dumps([{"label": "primary", "url": "https://example.com/status", "authority": "PRIMARY", "required": True}])
OUTCOMES = json.dumps([
    {"code": "OK", "description": "met", "payout_bps": 10000},
    {"code": "MISS", "description": "not met", "payout_bps": 0},
])


def deploy(direct_deploy):
    return direct_deploy("contracts/redeem.py")


def addr(contract, value):
    return type(contract._zero())(value)


def create(vm, contract, issuer, beneficiary, escrow=1000):
    issuer, beneficiary = addr(contract, issuer), addr(contract, beneficiary)
    vm._datetime = "1970-01-01T00:00:01Z"
    vm.sender, vm.value = issuer, escrow
    contract.create_guarantee(beneficiary, "Uptime", "Service remains available", 0, 100, 0, 200, escrow, SOURCE, OUTCOMES)


@pytest.mark.direct
def test_direct_deployment_initializes_counter(direct_deploy):
    assert deploy(direct_deploy).get_guarantee_counter() == 0


@pytest.mark.direct
def test_direct_creation_persists_immutable_terms(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy); create(direct_vm, c, direct_alice, direct_bob)
    g = c.get_guarantee(1)
    assert g.issuer == addr(c, direct_alice) and g.beneficiary == addr(c, direct_bob) and g.escrow_remaining == 1000


@pytest.mark.direct
def test_direct_creation_updates_accounting(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy); create(direct_vm, c, direct_alice, direct_bob)
    assert c.get_contract_accounting()["funded"] == 1000
    assert c.get_guarantee_accounting(1)["escrow_total"] == 1000


@pytest.mark.direct
def test_direct_creation_rejects_wrong_value(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy); direct_vm.sender, direct_vm.value = addr(c, direct_alice), 1
    with pytest.raises(AssertionError): c.create_guarantee(addr(c, direct_bob), "x", "y", 0, 100, 0, 200, 1000, SOURCE, OUTCOMES)


@pytest.mark.direct
def test_direct_creation_rejects_issuer_as_beneficiary(direct_vm, direct_deploy, direct_alice):
    c = deploy(direct_deploy); direct_vm.sender, direct_vm.value = addr(c, direct_alice), 1000
    with pytest.raises(AssertionError): c.create_guarantee(addr(c, direct_alice), "x", "y", 0, 100, 0, 200, 1000, SOURCE, OUTCOMES)


@pytest.mark.direct
def test_direct_open_requires_beneficiary(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy); create(direct_vm, c, direct_alice, direct_bob)
    direct_vm.sender = addr(c, direct_alice)
    with pytest.raises(AssertionError): c.open_redemption(1)
    direct_vm._datetime = "1970-01-01T00:00:02Z"
    direct_vm.sender = addr(c, direct_bob)
    c.open_redemption(1)
    assert c.status_label(1) == "REDEMPTION_OPEN"


@pytest.mark.direct
def test_direct_reads_are_bounded(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy); create(direct_vm, c, direct_alice, direct_bob)
    assert len(c.list_guarantees(0, 25)) == 1
    with pytest.raises(AssertionError): c.list_guarantees(0, 26)


@pytest.mark.direct
def test_direct_source_and_outcome_manifest_reads(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy); create(direct_vm, c, direct_alice, direct_bob)
    assert c.get_source_rule(1, 0)["authority"] == "PRIMARY"
    assert c.get_outcome_rule(1, 1)["payout_bps"] == 0


@pytest.mark.direct
def test_direct_constants_expose_safety_limits(direct_deploy):
    constants = deploy(direct_deploy).get_constants()
    assert constants["max_page_size"] == 25
    assert constants["challenge_bond_bps"] == 500


@pytest.mark.direct
def test_direct_expiry_refunds_escrow(direct_vm, direct_deploy, direct_alice, direct_bob):
    c = deploy(direct_deploy); create(direct_vm, c, direct_alice, direct_bob)
    direct_vm.sender = addr(c, direct_alice)
    direct_vm._datetime = "1970-01-01T00:03:21Z"
    c.reclaim_expired_guarantee(1)
    assert c.status_label(1) == "EXPIRED_REFUNDED"
    assert c.get_guarantee_accounting(1)["escrow_remaining"] == 0


@pytest.mark.direct
def test_direct_unknown_guarantee_reverts(direct_deploy):
    with pytest.raises(AssertionError): deploy(direct_deploy).get_guarantee(99)
