from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.api.dependencies import verify_token
from app.models.user import User
from app.schemas.flashcard_schema import (
    GenerateRequest,
    DeckCreate, DeckUpdate,
    FlashcardCreate, FlashcardUpdate
)
from app.services import ai_service, flashcard_service

router = APIRouter()


#   AI Generation

@router.post("/generate")
async def generate_flashcard(
    req: GenerateRequest,
    current_user: User = Depends(verify_token)
):
    """Gọi AI (Groq) để phân tích từ/cụm từ tiếng Anh"""
    try:
        result = await ai_service.generate_flashcard_content(req.term)
        return success_response(data=result, message="Tạo flashcard AI thành công!")
    except Exception as e:
        return error_response(message=str(e), code=500)


#   Deck CRUD

@router.get("/decks")
def get_decks(
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Lấy tất cả deck của user"""
    decks = flashcard_service.get_user_decks(db, current_user.id)
    return success_response(data=decks)


@router.post("/decks")
def create_deck(
    data: DeckCreate,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Tạo deck mới"""
    deck = flashcard_service.create_deck(db, current_user.id, data)
    return success_response(
        data={"id": deck.id, "name": deck.name, "description": deck.description,
              "card_count": 0, "starred_count": 0, "created_at": str(deck.created_at)},
        message="Tạo bộ thẻ thành công!"
    )


@router.put("/decks/{deck_id}")
def update_deck(
    deck_id: int,
    data: DeckUpdate,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Sửa tên/mô tả deck"""
    deck = flashcard_service.update_deck(db, deck_id, current_user.id, data)
    return success_response(
        data={"id": deck.id, "name": deck.name, "description": deck.description,
              "created_at": str(deck.created_at)},
        message="Cập nhật bộ thẻ thành công!"
    )


@router.delete("/decks/{deck_id}")
def delete_deck(
    deck_id: int,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Xóa deck (cascade xóa tất cả cards bên trong)"""
    flashcard_service.delete_deck(db, deck_id, current_user.id)
    return success_response(message="Đã xóa bộ thẻ!")


#   Flashcard CRUD

def _card_to_dict(card):
    """Helper: Chuyển SQLAlchemy Flashcard object thành dict serializable"""
    return {
        "id": card.id,
        "deck_id": card.deck_id,
        "front": card.front,
        "back": card.back,
        "audio_url": card.audio_url,
        "image_url": card.image_url,
        "difficulty": card.difficulty,
        "is_starred": card.is_starred,
        "created_at": str(card.created_at) if card.created_at else None,
    }


@router.get("/decks/{deck_id}/cards")
def get_cards(
    deck_id: int,
    starred_only: bool = Query(False),
    difficulty: Optional[str] = Query(None),
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Lấy cards trong deck (filter: starred_only, difficulty)"""
    cards = flashcard_service.get_deck_flashcards(
        db, deck_id, current_user.id,
        starred_only=starred_only, difficulty=difficulty
    )
    return success_response(data=[_card_to_dict(c) for c in cards])


@router.post("/decks/{deck_id}/cards")
def create_card(
    deck_id: int,
    data: FlashcardCreate,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Thêm card mới vào deck"""
    card = flashcard_service.create_flashcard(db, deck_id, current_user.id, data)
    return success_response(data=_card_to_dict(card), message="Thêm thẻ thành công!")


@router.post("/decks/{deck_id}/cards/bulk")
def create_cards_bulk(
    deck_id: int,
    data: list[FlashcardCreate],
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Thêm nhiều cards mới vào deck cùng lúc"""
    cards = flashcard_service.create_flashcards_bulk(db, deck_id, current_user.id, data)
    return success_response(data=[_card_to_dict(c) for c in cards], message=f"Thêm thành công {len(cards)} thẻ!")


@router.put("/cards/{card_id}")
def update_card(
    card_id: int,
    data: FlashcardUpdate,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Sửa nội dung card"""
    card = flashcard_service.update_flashcard(db, card_id, current_user.id, data)
    return success_response(data=_card_to_dict(card), message="Cập nhật thẻ thành công!")


@router.delete("/cards/{card_id}")
def delete_card(
    card_id: int,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Xóa card"""
    flashcard_service.delete_flashcard(db, card_id, current_user.id)
    return success_response(message="Đã xóa thẻ!")


@router.patch("/cards/{card_id}/star")
def toggle_star(
    card_id: int,
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Toggle ⭐ đánh dấu thẻ khó"""
    card = flashcard_service.toggle_star(db, card_id, current_user.id)
    status = "đã đánh dấu ⭐" if card.is_starred else "đã bỏ đánh dấu"
    return success_response(data=_card_to_dict(card), message=f"Thẻ {status}!")


#   Review

@router.get("/decks/{deck_id}/review")
def get_review(
    deck_id: int,
    mode: str = Query("sequential", pattern="^(sequential|random)$"),
    starred_only: bool = Query(False),
    current_user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Lấy cards cho chế độ Carousel Review (sequential/random, starred filter)"""
    cards = flashcard_service.get_review_cards(
        db, deck_id, current_user.id,
        mode=mode, starred_only=starred_only
    )
    return success_response(data=[_card_to_dict(c) for c in cards], message=f"Review mode: {mode}")
