from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, func, Unicode, UnicodeText
from sqlalchemy.orm import relationship
from app.core.database import Base


class FlashcardDeck(Base):
    """Bộ thẻ (Deck) - nhóm flashcard theo chủ đề"""
    __tablename__ = "flashcard_decks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(Unicode(200), nullable=False)
    description = Column(Unicode(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    flashcards = relationship(
        "Flashcard", back_populates="deck", cascade="all, delete-orphan",
        lazy="dynamic"
    )


class Flashcard(Base):
    """Thẻ từ vựng - lưu kết quả AI dưới dạng JSON trong cột 'back'"""
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(
        Integer,
        ForeignKey("flashcard_decks.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    front = Column(Unicode(500), nullable=False)        # Từ/cụm từ gốc
    back = Column(UnicodeText, nullable=False)           # JSON: nghĩa, IPA, ví dụ...
    audio_url = Column(Unicode(1000), nullable=True)
    image_url = Column(Unicode(1000), nullable=True)
    difficulty = Column(Unicode(20), default="medium")   # easy / medium / hard
    is_starred = Column(Boolean, default=False)          # ⭐ Đánh dấu thẻ khó
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    deck = relationship("FlashcardDeck", back_populates="flashcards")
