from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.core.database import get_db
from app.models.course import Course
from app.schemas.course import CourseCreate, CourseResponse

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post(
    "",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a course (admin only)",
)
def create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin")),
):
    course = Course(
        name=payload.name,
        description=payload.description,
        created_by=int(current_user["sub"]),
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get(
    "",
    response_model=list[CourseResponse],
    summary="List all courses",
)
def list_courses(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    return db.query(Course).order_by(Course.id).all()
