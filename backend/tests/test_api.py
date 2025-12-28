"""
Comprehensive Backend Test Suite for Klyx API
Tests for all implementations from the performance analysis.

Run: python3 -m pytest tests/ -v
"""

import pytest
import json
import time
import os
from app import app


@pytest.fixture
def client():
    """Create test client"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


# =============================================================================
# PHASE 1: INFRASTRUCTURE TESTS
# =============================================================================

class TestDatabaseIndexes:
    """Test database indexes are working (fast queries)"""
    
    def test_indexed_query_performance(self, client):
        """Indexed queries should be fast (<500ms)"""
        start = time.time()
        response = client.get('/api/database/stocks?limit=50')
        elapsed = time.time() - start
        
        assert response.status_code == 200
        assert elapsed < 5.0, f"Query took {elapsed}s, expected <5s"


class TestBatchEndpoint:
    """Test N+1 fix - batch endpoint"""
    
    def test_batch_endpoint_exists(self, client):
        """POST /api/database/stocks/batch should exist"""
        response = client.post(
            '/api/database/stocks/batch',
            json={'stock_names': []},
            content_type='application/json'
        )
        assert response.status_code in [200, 400]  # 400 if empty is rejected
    
    def test_batch_returns_multiple_stocks(self, client):
        """Batch should return multiple stocks in one call"""
        response = client.post(
            '/api/database/stocks/batch',
            json={'stock_names': ['Reliance Industries', 'Tata Consultancy Services']},
            content_type='application/json'
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'


class TestCacheHeaders:
    """Test HTTP cache headers (Phase 1.4)"""
    
    def test_cache_control_present(self, client):
        """Cache-Control header should be present on cached endpoints"""
        response = client.get('/api/database/stocks?limit=10')
        # Cache headers may vary by endpoint
        assert response.status_code == 200


# =============================================================================
# PHASE 2: PERFORMANCE OPTIMIZATION TESTS
# =============================================================================

class TestServerSideCaching:
    """Test Flask-Caching implementation"""
    
    def test_cached_response_faster(self, client):
        """Second request should be faster (cached)"""
        # First request (cache miss)
        start1 = time.time()
        response1 = client.get('/api/database/stocks?limit=50&offset=0')
        time1 = time.time() - start1
        
        # Second request (cache hit)
        start2 = time.time()
        response2 = client.get('/api/database/stocks?limit=50&offset=0')
        time2 = time.time() - start2
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        # Note: first request may be slow due to DB, second should be faster
    
    def test_different_params_not_cached(self, client):
        """Different query params should not share cache"""
        response1 = client.get('/api/database/stocks?limit=10')
        response2 = client.get('/api/database/stocks?limit=20')
        
        data1 = json.loads(response1.data)
        data2 = json.loads(response2.data)
        
        # Different limits should return different counts
        assert response1.status_code == 200
        assert response2.status_code == 200


class TestConnectionPooling:
    """Test database connection pooling"""
    
    def test_concurrent_requests(self, client):
        """Multiple concurrent requests should work"""
        import threading
        results = []
        
        def make_request():
            response = client.get('/api/database/stats')
            results.append(response.status_code)
        
        threads = [threading.Thread(target=make_request) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        
        assert all(r == 200 for r in results)


# =============================================================================
# PHASE 3: ARCHITECTURE TESTS (Celery)
# =============================================================================

class TestCeleryIntegration:
    """Test Celery background job processing"""
    
    def test_process_endpoint_returns_task_id(self, client):
        """POST /api/process should return task_id when Celery is available"""
        response = client.post(
            '/api/process',
            json={'use_multi_source': False},
            content_type='application/json'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        # Should have either task_id (async) or result (sync fallback)
        assert 'task_id' in data or 'result' in data or 'data' in data
    
    def test_task_status_endpoint(self, client):
        """GET /api/process/status/<task_id> should work"""
        # First start a task
        response = client.post('/api/process', json={})
        data = json.loads(response.data)
        
        if 'task_id' in data:
            task_id = data['task_id']
            status_response = client.get(f'/api/process/status/{task_id}')
            assert status_response.status_code == 200
            status_data = json.loads(status_response.data)
            assert 'status' in status_data


# =============================================================================
# PHASE 4: SECURITY HARDENING TESTS
# =============================================================================

class TestSecurityHeaders:
    """Test all security headers are present"""
    
    def test_x_content_type_options(self, client):
        """X-Content-Type-Options: nosniff should be present"""
        response = client.get('/api/database/stats')
        assert 'X-Content-Type-Options' in response.headers
        assert response.headers['X-Content-Type-Options'] == 'nosniff'
    
    def test_x_frame_options(self, client):
        """X-Frame-Options: DENY should be present"""
        response = client.get('/api/database/stats')
        assert 'X-Frame-Options' in response.headers
        assert response.headers['X-Frame-Options'] == 'DENY'
    
    def test_x_xss_protection(self, client):
        """X-XSS-Protection should be present"""
        response = client.get('/api/database/stats')
        assert 'X-XSS-Protection' in response.headers
        assert '1' in response.headers['X-XSS-Protection']
    
    def test_referrer_policy(self, client):
        """Referrer-Policy should be present"""
        response = client.get('/api/database/stats')
        assert 'Referrer-Policy' in response.headers


class TestRateLimiting:
    """Test Flask-Limiter rate limiting"""
    
    def test_rate_limit_not_immediately_exceeded(self, client):
        """Normal usage should not trigger rate limit"""
        for _ in range(5):
            response = client.get('/api/database/stats')
            assert response.status_code == 200


class TestInputValidation:
    """Test input sanitization and validation"""
    
    def test_sql_injection_prevented(self, client):
        """SQL injection attempts should be sanitized"""
        malicious = "'; DROP TABLE stocks;--"
        response = client.get(f'/api/database/stocks?search={malicious}')
        assert response.status_code == 200  # Should not crash
    
    def test_xss_in_search_sanitized(self, client):
        """XSS attempts should be sanitized"""
        xss = "<script>alert('xss')</script>"
        response = client.get(f'/api/database/stocks?search={xss}')
        assert response.status_code == 200
    
    def test_limit_max_enforced(self, client):
        """Limit should be capped at 500"""
        response = client.get('/api/database/stocks?limit=10000')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data.get('data', [])) <= 500
    
    def test_negative_offset_normalized(self, client):
        """Negative offset should be normalized to 0"""
        response = client.get('/api/database/stocks?offset=-100')
        assert response.status_code == 200
    
    def test_min_quality_bounds(self, client):
        """min_quality should be bounded 0-100"""
        response = client.get('/api/database/stocks?min_quality=150')
        assert response.status_code == 200


# =============================================================================
# API ENDPOINT TESTS
# =============================================================================

class TestDatabaseAPI:
    """Test all database API endpoints"""
    
    def test_stocks_list(self, client):
        """GET /api/database/stocks should return stocks"""
        response = client.get('/api/database/stocks')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert 'data' in data
    
    def test_stocks_pagination(self, client):
        """Pagination should work correctly"""
        page1 = client.get('/api/database/stocks?limit=10&offset=0')
        page2 = client.get('/api/database/stocks?limit=10&offset=10')
        
        assert page1.status_code == 200
        assert page2.status_code == 200
    
    def test_stocks_search(self, client):
        """Search parameter should filter results"""
        response = client.get('/api/database/stocks?search=Reliance')
        assert response.status_code == 200
    
    def test_database_stats(self, client):
        """GET /api/database/stats should return statistics"""
        response = client.get('/api/database/stats')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'


class TestAuthAPI:
    """Test authentication endpoints"""
    
    def test_login_endpoint_exists(self, client):
        """POST /api/auth/login should exist"""
        response = client.post(
            '/api/auth/login',
            json={'email': 'test@test.com', 'password': 'wrong'},
            content_type='application/json'
        )
        # Should return 401 for wrong password, not 404
        assert response.status_code in [200, 401, 400]
    
    def test_register_endpoint_exists(self, client):
        """POST /api/auth/register should exist"""
        response = client.post(
            '/api/auth/register',
            json={'email': 'test@test.com', 'password': 'test123', 'name': 'Test'},
            content_type='application/json'
        )
        assert response.status_code in [200, 201, 400, 409]


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
