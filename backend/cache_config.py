import os
from flask_caching import Cache

# Cache configuration
def normalize_redis_url(url):
    """Ensure Redis URL starts with redis:// (needed for some providers like Render/Vercel)"""
    if url and url.startswith("postgres://"):
        return url.replace("postgres://", "redis://", 1)  # Fix common copy-paste error
    if url and url.startswith("rediss://"):
        return url # SSL is fine
    return url

# Get Redis URL from environment
REDIS_URL = normalize_redis_url(os.environ.get("REDIS_URL") or os.environ.get("KV_URL"))

# Configure cache based on environment
if REDIS_URL:
    CACHE_CONFIG = {
        "CACHE_TYPE": "RedisCache",
        "CACHE_REDIS_URL": REDIS_URL,
        "CACHE_DEFAULT_TIMEOUT": 300,  # 5 minutes default
        "CACHE_KEY_PREFIX": "klyx_api_"
    }
    print("✓ Configured Redis Cache")
else:
    CACHE_CONFIG = {
        "CACHE_TYPE": "SimpleCache",  # In-memory cache for dev
        "CACHE_DEFAULT_TIMEOUT": 300,
        "CACHE_THRESHOLD": 500  # Max items
    }
    print("✓ Configured In-Memory Cache (SimpleCache)")

# Initialize cache extension
# We will init_app in app.py
cache = Cache(config=CACHE_CONFIG)
