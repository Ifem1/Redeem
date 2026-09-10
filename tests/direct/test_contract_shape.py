from pathlib import Path


def test_contract_has_redeem_identity_and_public_surface():
    source = Path('contracts/redeem.py').read_text()
    assert 'class Redeem(gl.Contract)' in source
    for method in ('create_guarantee', 'get_guarantee', 'status_label'):
        assert f'def {method}(' in source
    assert 'bounty' not in source.lower()


def test_no_product_leakage():
    source = Path('.').resolve()
    offenders = []
    for path in source.rglob('*'):
        if path.is_file() and '.git' not in path.parts and 'node_modules' not in path.parts and '__pycache__' not in path.parts:
            try:
                forbidden = 'proof' + '-bounty'
                if forbidden in path.read_text(errors='ignore').lower() and path.name != 'test_contract_shape.py':
                    offenders.append(str(path))
            except OSError:
                pass
    assert not offenders
