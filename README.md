# Flashcard AI — Học từ vựng tiếng Anh thông minh

Ứng dụng Flashcard tích hợp AI (Groq LLaMA) giúp phân tích, dịch nghĩa, và tạo thẻ từ vựng tiếng Anh-Việt tự động.

## Các Tính năng

- 🔐 **Xác thực**: Email/Password + Google OAuth (Firebase Auth)
- 🤖 **AI Generation**: Nhập từ → AI phân tích (IPA, nghĩa, ngữ cảnh, ví dụ)
- 📚 **Quản lý Deck**: Tạo, sửa, xóa bộ thẻ theo chủ đề
- 🃏 **CRUD Flashcard**: Thêm, sửa, xóa thẻ từ vựng
- ⭐ **Đánh dấu sao**: Đánh dấu thẻ khó để ôn tập riêng
- 🎴 **Carousel Review**: Lướt thẻ tuần tự/ngẫu nhiên/chỉ thẻ đánh dấu
- 🎨 **UI Premium**: Dark mode, glassmorphism, 3D flip animation

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + Vanilla CSS |
| Backend | Python FastAPI + SQLAlchemy |
| Database | SQL Server (local) |
| Auth | Firebase Auth (Admin SDK + Client SDK) |
| AI | Groq API — llama-3.1-8b-instant |

## Cài đặt & Hướng dẫn chạy

### 1. Hướng dẫn cài đặt environment

**Yêu cầu hệ thống:**
- Python 3.10+
- Node.js 18+
- SQL Server (và SQL Server Management Studio)

**Chuẩn bị Database:**
1. Mở **SQL Server Management Studio (SSMS)**.
2. Tạo database `DB_Lab2` nếu chưa có.
3. *(Tùy chọn)* Chạy lệnh trong file `BackEnd/migration.sql` để tạo bảng thủ công.

**Cấu hình biến môi trường (.env):**
Tạo file `.env` ở thư mục gốc của dự án. 
Mẫu cấu hình:
```env
DATABASE_URL=mssql+pyodbc://sa:MatKhau@localhost/tenDB?driver=ODBC+Driver+17+for+SQL+Server
GROQ_API_KEY=gsk_xxxxx
SECRET_KEY=your-secret-key
FIREBASE_CREDENTIALS_JSON='{ ... }'
```

### 2. Hướng dẫn chạy backend

```bash
cd BackEnd

# Tạo virtual environment
python -m venv .venv

# Kích hoạt virtual environment
# Trên Windows:
.venv\Scripts\activate
# Trên macOS/Linux:
# source .venv/bin/activate

# Cài đặt các thư viện (được định nghĩa trong requirements.txt)
pip install -r requirements.txt

# Chạy server
python -m app.main
```
Backend sẽ chạy tại: `http://localhost:8000`  
Swagger UI (Tài liệu API): `http://localhost:8000/docs`

### 3. Hướng dẫn chạy frontend

```bash
cd FrontEnd

# Cài đặt các packages phụ thuộc
npm install

# Chạy development server
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:5173`

### 4. Đường dẫn đến video demo
https://drive.google.com/file/d/1dt-6Lr_AVQv0_rJMS0sLjZiHEO7vxkTy/view?usp=drive_link

### 5. Sử dụng Hệ thống
1. Mở `http://localhost:5173` trên trình duyệt.
2. Đăng ký tài khoản (Email hoặc Google).
3. Tạo Bộ thẻ (Deck).
4. Dùng AI Generator để tạo flashcard.
5. Lưu thẻ vào bộ thẻ.
6. Bắt đầu ôn tập với Carousel mode!

## 📁 Cấu trúc dự án

```
LAB2-APP-FLASHCARD/
├── .env                          # Cấu hình chung
├── BackEnd/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dependencies.py   # Auth middleware
│   │   │   └── v1/endpoints/
│   │   │       ├── auth.py       # Auth API
│   │   │       └── flashcard.py  # Flashcard API
│   │   ├── core/
│   │   │   ├── config.py         # Settings
│   │   │   ├── database.py       # SQLAlchemy
│   │   │   ├── firebase.py       # Firebase Admin
│   │   │   └── response.py       # Standard response
│   │   ├── models/
│   │   │   ├── user.py           # User model
│   │   │   └── flashcard_models.py
│   │   ├── schemas/
│   │   │   ├── auth_schema.py
│   │   │   └── flashcard_schema.py
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── ai_service.py     # Groq AI + Cache
│   │   │   └── flashcard_service.py
│   │   └── main.py
│   ├── migration.sql
│   └── requirements.txt
├── FrontEnd/
│   ├── src/
│   │   ├── assets/styles/        # Design system
│   │   ├── components/           # UI components
│   │   ├── pages/                # Route pages
│   │   ├── services/             # API + Firebase
│   │   ├── context/              # Auth state
│   │   ├── App.jsx               # Router
│   │   └── main.jsx
│   ├── vite.config.js            # Proxy config
│   └── package.json
└── README.md
```

## API Endpoints

| Method | Path | Mô tả |
|--------|------|--------|
| POST | `/api/v1/auth/register` | Đăng ký |
| POST | `/api/v1/auth/login` | Đăng nhập |
| POST | `/api/v1/auth/logout` | Đăng xuất |
| POST | `/api/v1/flashcards/generate` | AI tạo flashcard |
| GET | `/api/v1/flashcards/decks` | Lấy danh sách deck |
| POST | `/api/v1/flashcards/decks` | Tạo deck |
| PUT | `/api/v1/flashcards/decks/{id}` | Sửa deck |
| DELETE | `/api/v1/flashcards/decks/{id}` | Xóa deck |
| GET | `/api/v1/flashcards/decks/{id}/cards` | Lấy cards |
| POST | `/api/v1/flashcards/decks/{id}/cards` | Thêm card |
| PUT | `/api/v1/flashcards/cards/{id}` | Sửa card |
| DELETE | `/api/v1/flashcards/cards/{id}` | Xóa card |
| PATCH | `/api/v1/flashcards/cards/{id}/star` | Toggle ⭐ |
| GET | `/api/v1/flashcards/decks/{id}/review` | Carousel review |
