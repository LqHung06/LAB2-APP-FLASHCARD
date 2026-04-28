from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    confirmpassword: str

class LoginRequest(BaseModel):
    id_token: str

class UserResponse(BaseModel):
    id: int
    firebase_uid: str
    email: EmailStr
    display_name: str | None = None
    avatar_url: str | None = None
    access_token: str | None = None
    refresh_token: str | None = None

    class Config:
        from_attributes = True

