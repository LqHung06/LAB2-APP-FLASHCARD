from sqlalchemy import Column, Integer, Unicode
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    
    # UID cấp bởi Firebase (Cực kỳ quan trọng để check xem user này có hợp lệ không)
    firebase_uid = Column(Unicode(50), unique=True, index=True, nullable=False)
    
    email = Column(Unicode(255), unique=True, index=True, nullable=False)
    display_name = Column(Unicode(255), nullable=True)
    avatar_url = Column(Unicode(1000), nullable=True)
