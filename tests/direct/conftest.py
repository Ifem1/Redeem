"""Windows compatibility for gltest's fd-backed direct loader.

The loader unlinks a file while stdin still owns it; Windows delays that
unlink.  Closing the duplicated descriptor is handled by gltest, so retaining
the temporary name until process cleanup is safe for these tests.
"""
import os
import pytest


@pytest.fixture(autouse=True, scope="session")
def tolerate_windows_temp_unlink():
    if os.name != "nt":
        yield
        return
    original = os.unlink
    def unlink(path):
        try:
            original(path)
        except PermissionError:
            pass
    os.unlink = unlink
    yield
    os.unlink = original
