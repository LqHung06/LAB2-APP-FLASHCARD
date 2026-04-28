from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


#   AI Generation

class GenerateRequest(BaseModel):
    """Input cho AI: từ hoặc cụm từ cần phân tích"""
    term: str


class AIResultResponse(BaseModel):
    """Kết quả trả về từ Groq AI"""
    term_or_phrase: str = ""
    ipa: str = ""
    part_of_speech: str = ""
    context_nuance: str = ""
    en_definition: str = ""
    vn_translation: str = ""
    example_en: str = ""
    example_vn: str = ""


#   Deck

class DeckCreate(BaseModel):
    name: str
    description: Optional[str] = None


class DeckUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class DeckResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    card_count: int = 0
    starred_count: int = 0
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


#   Flashcard

class FlashcardCreate(BaseModel):
    """Tạo flashcard mới (front = từ gốc, back = JSON string từ AI)"""
    front: str
    back: str                              # JSON string
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    difficulty: str = "medium"


class FlashcardUpdate(BaseModel):
    front: Optional[str] = None
    back: Optional[str] = None
    difficulty: Optional[str] = None
    is_starred: Optional[bool] = None
    audio_url: Optional[str] = None
    image_url: Optional[str] = None


class FlashcardResponse(BaseModel):
    id: int
    deck_id: int
    front: str
    back: str
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    difficulty: str = "medium"
    is_starred: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
