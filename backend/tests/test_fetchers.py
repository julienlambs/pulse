from types import SimpleNamespace

from fetchers import REDDIT_RETIRED, run_fetcher


def test_reddit_source_reports_retirement_without_network():
    assert run_fetcher(SimpleNamespace(type="reddit"), db=None) == (0, REDDIT_RETIRED)


def test_unknown_type():
    count, error = run_fetcher(SimpleNamespace(type="mastodon"), db=None)
    assert count == 0 and "inconnu" in error


def test_seed_has_no_reddit():
    from seed import INITIAL_SOURCES
    assert INITIAL_SOURCES and all(s["type"] != "reddit" for s in INITIAL_SOURCES)
