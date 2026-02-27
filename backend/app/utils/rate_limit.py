"""
Simple in-memory rate limiter for auth endpoints.
For multi-instance deployments, consider Redis.
"""
import time
from collections import defaultdict
from threading import Lock

_lock = Lock()
_counts: dict[str, list[float]] = defaultdict(list)


def check_rate_limit(key: str, limit: int, window_seconds: int = 60) -> bool:
    """
    Returns True if request is allowed, False if rate limited.
    """
    now = time.time()
    cutoff = now - window_seconds
    with _lock:
        _counts[key] = [t for t in _counts[key] if t > cutoff]
        if len(_counts[key]) >= limit:
            return False
        _counts[key].append(now)
    return True
