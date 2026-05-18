from fastapi import APIRouter, Depends
from core.security import get_current_user
from models.models import User

router = APIRouter(tags=["family"])

@router.get("/")
def get_family(current_user: User = Depends(get_current_user)):
    return []
