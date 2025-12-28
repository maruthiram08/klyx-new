from functools import wraps
from flask import make_response, request
import hashlib

def cache_response(max_age=3600, etag=True):
    """
    Decorator to add HTTP cache headers to Flask responses.
    
    Args:
        max_age: Cache duration in seconds (default: 1 hour)
        etag: Whether to generate ETag for cache validation (default: True)
    
    Usage:
        @app.route("/api/something")
        @cache_response(max_age=1800)  # Cache for 30 minutes
        def something():
            return jsonify(data)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Call the original function
            result = f(*args, **kwargs)
            
            # Convert to response object if needed
            if not isinstance(result, tuple):
                response = make_response(result)
            else:
                response = make_response(*result)
            
            # Add cache headers
            response.headers['Cache-Control'] = f'public, max-age={max_age}'
            
            # Generate ETag if requested
            if etag and response.status_code == 200:
                # Generate ETag from response body
                content = response.get_data()
                etag_value = hashlib.md5(content).hexdigest()
                response.headers['ETag'] = f'"{etag_value}"'
                
                # Check if client has cached version
                if request.headers.get('If-None-Match') == f'"{etag_value}"':
                    # Client has fresh copy, send 304 Not Modified
                    return '', 304
            
            return response
        
        return decorated_function
    return decorator
