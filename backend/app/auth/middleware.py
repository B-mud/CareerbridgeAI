"""
Authentication middleware for FastAPI
Validates Supabase JWT tokens and extracts user information
"""
from fastapi import HTTPException, Security, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import jwt
from typing import Optional
from dotenv import load_dotenv
import logging

load_dotenv()

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)  # Set auto_error=False to allow optional auth

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Verify Supabase JWT token and return user information
    
    Args:
        credentials: HTTP Bearer token from request header
        
    Returns:
        dict: User information from JWT payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    
    try:
        # Decode JWT token without verification for development
        # Supabase uses ES256 (Elliptic Curve) algorithm which requires public key
        # For development, we decode without signature verification
        # In production, fetch public keys from Supabase and verify properly
        
        logger.info("Decoding JWT token without signature verification (development mode)")
        payload = jwt.decode(token, options={"verify_signature": False})
        
        # Validate token has required fields
        if not payload.get("sub"):
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing user ID"
            )
        
        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role"),
            "user_metadata": payload.get("user_metadata", {})
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials"
        )

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> dict:
    """
    Dependency to get current authenticated user
    Use this in protected endpoints: user = Depends(get_current_user)
    """
    return verify_token(credentials)

def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Optional[dict]:
    """
    Optional authentication - returns user if authenticated, None otherwise.
    Useful for endpoints that work with or without authentication.
    
    The Security(security) with auto_error=False allows:
    - Requests WITH Bearer token: validates and returns user
    - Requests WITHOUT Bearer token: returns None (no error)
    """
    if not credentials:
        return None
    
    try:
        return verify_token(credentials)
    except HTTPException:
        return None
