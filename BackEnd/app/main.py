import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.database import Base, engine
from app.api.v1.endpoints import auth, flashcard
from app.core.response import success_response, error_response

# Import models để SQLAlchemy tự tạo bảng
from app.models.user import User
from app.models.flashcard_models import FlashcardDeck, Flashcard

#   Auto Migration
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Flashcard AI API", version="1.0.0")

#   EXCEPTION HANDLERS
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(message=exc.detail, code=exc.status_code).model_dump()
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content=error_response(message="Dữ liệu đầu vào không hợp lệ", code=422, data=exc.errors()).model_dump()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đấu nối Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(flashcard.router, prefix="/api/v1/flashcards", tags=["Flashcards"])

import os
from fastapi.responses import HTMLResponse

@app.get("/")
def read_root():
    # Tìm đường dẫn tuyệt đối của file test_frontend.html (nằm tận ở thư mục gốc lab2 ngoài cùng)
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    html_path = os.path.join(base_dir, "test_frontend.html")
    
    try:
        with open(html_path, "r", encoding="utf-8") as f:
            html_content = f.read()
            return HTMLResponse(content=html_content)
    except FileNotFoundError:
        return success_response(
            message="Server Backend SQL Server x Firebase Auth đã hoạt động! Truy cập /docs để test."
        )

# Mã khởi chạy Uvicorn trực tiếp từ Python (Thay cho lệnh Terminal dài dòng)
if __name__ == "__main__":
    import uvicorn
    # Khởi chạy server ở cổng 8000, chú ý sử dụng đúng module dẫn hướng tới file này
    uvicorn.run("app.main:app", host="localhost", port=8000, reload=True)
