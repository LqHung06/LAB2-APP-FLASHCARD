from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.auth_schema import RegisterRequest, LoginRequest, UserResponse
from app.services import auth_service
from app.api.dependencies import verify_token
from app.models.user import User
from app.core.response import StandardResponse, success_response

router = APIRouter()

@router.post("/register", response_model=StandardResponse[UserResponse])
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    API Đăng ký bằng Email/Password
    """
    user = auth_service.register_user(db, req)
    return success_response(data=user, message="Đăng ký tài khoản thành công!", code=200)

@router.post("/login", response_model=StandardResponse[UserResponse])
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    API Đăng nhập: Áp dụng cho cả Google Login và Email/Password Login.
    Cần ID token từ FrontEnd để Backend xác thực và đồng bộ vào SQL Server.
    """
    user = auth_service.verify_and_sync_user(db, req.id_token)
    return success_response(data=user, message="Đăng nhập thành công!", code=200)

@router.post("/logout", response_model=StandardResponse[dict])
def logout(current_user: User = Depends(verify_token)):
    """
    API Đăng xuất: Bắt buộc user phải gửi kèm token hợp lệ (thông qua Depends verify_token)
    để xác nhận ai đang đăng xuất.
    """
    # Ghi log thao tác đăng xuất vào SQL Server ở đây (nếu cần)
    
    return success_response(
        data={"email": current_user.email}, 
        message=f"Tài khoản {current_user.email} đã đăng xuất. Yêu cầu Client xóa ID Token.", 
        code=200
    )