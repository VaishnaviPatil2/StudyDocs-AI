from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import verify_access_token


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    payload = verify_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    return payload


def require_role(required_role: str):
    def role_checker(
        current_user=Depends(get_current_user),
    ):
        if current_user.get("role") != required_role:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions",
            )

        return current_user

    return role_checker