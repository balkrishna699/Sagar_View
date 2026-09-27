"""Verifies the Day-3 fallback path: if Person 4's dataset/parsers aren't available in
this checkout, the server must still boot and GET /data must still return a valid,
schema-complete response - just from the fake grid instead of the real one.

This imports app.sample_data directly (bypassing app.main's import-time try/except,
which can't be re-triggered within one process) to check the fallback module on its
own contract, independent of whichever module main.py actually picked at import time.
"""
from app import sample_data
from app.models import OceanData


def test_sample_data_alone_satisfies_the_full_schema():
    dataset = sample_data.get_dataset()
    assert isinstance(dataset, OceanData)
    # Would raise pydantic.ValidationError if any field (e.g. currentSpeed) were missing -
    # this is exactly the bug this test would have caught before it shipped.
    OceanData.model_validate(dataset.model_dump())


def test_sample_data_depth_filtering_still_works():
    lo, hi = sample_data.FULL_DEPTH[1], sample_data.FULL_DEPTH[-2]
    dataset = sample_data.get_dataset(min_depth=lo, max_depth=hi)
    assert dataset.grid.depth == [d for d in sample_data.FULL_DEPTH if lo <= d <= hi]
