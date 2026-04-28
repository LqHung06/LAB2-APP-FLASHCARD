from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.firebase import firebase_auth
from app.core.database import get_db
from app.models.user import User

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    """
    Middleware xác thực User: 
    Giải mã Bearer Token truyền vào Header.
    Trả về đối tượng User lấy từ SQL Server nếu Token hợp lệ.
    """
    token = credentials.credentials
    try:
        decoded_token = firebase_auth.verify_id_token(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token không hợp lệ hoặc đã hết hạn: {str(e)}")

    uid = decoded_token.get("uid")
    # Lấy thông tin user đăng nhập từ Databse
    user = db.query(User).filter(User.firebase_uid == uid).first()

    if not user:
        raise HTTPException(status_code=401, detail="Xác thực từ Firebase thành công nhưng User chưa được đồng bộ vào Database!")

    return user
