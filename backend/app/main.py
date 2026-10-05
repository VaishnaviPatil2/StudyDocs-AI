from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.exc import IntegrityError

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.courses import router as courses_router
from app.core.database import get_db
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse


app = FastAPI(title="StudyDocs AI API")

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(courses_router)


@app.get("/")
def root():
    return {"message": "StudyDocs AI API is running"}


@app.get("/db-test")
def db_test(db=Depends(get_db)):
    return {"message": "Database session received"}


@app.post(
    "/users",
    response_model=UserResponse,
    status_code=201,
)
def create_user(
    user: UserCreate,
    db=Depends(get_db),
):
    password_hash = hash_password(user.password)

    user_db = User(
        name=user.name,
        email=user.email,
        password_hash=password_hash,
    )

    db.add(user_db)

    try:
        db.commit()
        db.refresh(user_db)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    return {
        "id": user_db.id,
        "name": user_db.name,
        "email": user_db.email,
        "role": user_db.role,
    }