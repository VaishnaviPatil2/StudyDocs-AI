from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import get_user_by_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse, summary="Login and obtain JWT")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, data.email)

    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(
        data={"sub": str(user.id), "email": user.email, "role": user.role}
    )

    return TokenResponse(access_token=token)
