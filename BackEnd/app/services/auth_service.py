from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.core.firebase import firebase_auth
from app.models.user import User
from app.schemas.auth_schema import RegisterRequest

def register_user(db: Session, req: RegisterRequest):
    # 1. Tạo user trên hệ thống Firebase
    try:
        firebase_user = firebase_auth.create_user(
            email=req.email,
            password=req.password
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi từ Firebase: {str(e)}")

    # 2. Lưu thông tin user vào SQL Server
    db_user = User(firebase_uid=firebase_user.uid, email=req.email)
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user) # Cập nhật lại ID tự tăng từ SQL Server
    except Exception as e:
        db.rollback()
        # Rollback: Xóa user trên Firebase nếu SQL Server bị lỗi
        firebase_auth.delete_user(firebase_user.uid)
        raise HTTPException(status_code=500, detail="Lỗi lưu database, đã hoàn tác.")

    return db_user

def verify_and_sync_user(db: Session, id_token: str):
    # 1. Giải mã token do Frontend gửi lên
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn")

    uid = decoded_token.get("uid")
    email = decoded_token.get("email")

    # 2. Kiểm tra xem user này đã có trong SQL Server chưa
    user = db.query(User).filter(User.firebase_uid == uid).first()
    
    # Nếu đăng nhập bằng Google lần đầu, user chưa tồn tại trong SQL Server -> Tạo mới
    if not user:
        user = User(firebase_uid=uid, email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
        
    return user