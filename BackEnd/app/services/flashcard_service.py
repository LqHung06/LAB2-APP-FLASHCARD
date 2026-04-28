import random
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.flashcard_models import FlashcardDeck, Flashcard
from app.schemas.flashcard_schema import (
    DeckCreate, DeckUpdate, FlashcardCreate, FlashcardUpdate
)


#   Deck CRUD

def check_duplicate_deck_name(db: Session, user_id: int, name: str, exclude_id: int = None):
    query = db.query(FlashcardDeck).filter(
        func.lower(FlashcardDeck.name) == name.lower(),
        FlashcardDeck.user_id == user_id
    )
    if exclude_id is not None:
        query = query.filter(FlashcardDeck.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=400, detail="Tên bộ thẻ đã tồn tại. Xin vui lòng chọn tên khác.")

def create_deck(db: Session, user_id: int, data: DeckCreate) -> FlashcardDeck:
    check_duplicate_deck_name(db, user_id, data.name)
    deck = FlashcardDeck(user_id=user_id, name=data.name, description=data.description)
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return deck


def get_user_decks(db: Session, user_id: int) -> list[dict]:
    """Lấy tất cả deck của user kèm card_count và starred_count"""
    decks = db.query(FlashcardDeck).filter(FlashcardDeck.user_id == user_id).order_by(FlashcardDeck.created_at.desc()).all()
    result = []
    for deck in decks:
        card_count = db.query(func.count(Flashcard.id)).filter(
            Flashcard.deck_id == deck.id
        ).scalar()
        starred_count = db.query(func.count(Flashcard.id)).filter(
            Flashcard.deck_id == deck.id, Flashcard.is_starred == True
        ).scalar()
        result.append({
            "id": deck.id,
            "name": deck.name,
            "description": deck.description,
            "card_count": card_count,
            "starred_count": starred_count,
            "created_at": str(deck.created_at) if deck.created_at else None
        })
    return result


def get_deck_by_id(db: Session, deck_id: int, user_id: int) -> FlashcardDeck:
    deck = db.query(FlashcardDeck).filter(
        FlashcardDeck.id == deck_id,
        FlashcardDeck.user_id == user_id
    ).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Không tìm thấy bộ thẻ")
    return deck


def update_deck(db: Session, deck_id: int, user_id: int, data: DeckUpdate) -> FlashcardDeck:
    deck = get_deck_by_id(db, deck_id, user_id)
    if data.name is not None and data.name != deck.name:
        check_duplicate_deck_name(db, user_id, data.name, exclude_id=deck_id)
        deck.name = data.name
    if data.description is not None:
        deck.description = data.description
    db.commit()
    db.refresh(deck)
    return deck


def delete_deck(db: Session, deck_id: int, user_id: int):
    deck = get_deck_by_id(db, deck_id, user_id)
    db.delete(deck)
    db.commit()


#   Flashcard CRUD

def create_flashcard(db: Session, deck_id: int, user_id: int, data: FlashcardCreate) -> Flashcard:
    get_deck_by_id(db, deck_id, user_id)
    card = Flashcard(
        deck_id=deck_id,
        front=data.front,
        back=data.back,
        audio_url=data.audio_url,
        image_url=data.image_url,
        difficulty=data.difficulty
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


def create_flashcards_bulk(db: Session, deck_id: int, user_id: int, parsed_cards: list[FlashcardCreate]) -> list[Flashcard]:
    get_deck_by_id(db, deck_id, user_id)
    cards = []
    for data in parsed_cards:
        card = Flashcard(
            deck_id=deck_id,
            front=data.front,
            back=data.back,
            audio_url=data.audio_url,
            image_url=data.image_url,
            difficulty=data.difficulty
        )
        cards.append(card)
    db.bulk_save_objects(cards, return_defaults=True)
    db.commit()
    return cards


def get_deck_flashcards(
    db: Session, deck_id: int, user_id: int,
    starred_only: bool = False,
    difficulty: str | None = None
) -> list[Flashcard]:
    """Lấy cards trong deck, hỗ trợ filter starred_only và difficulty"""
    get_deck_by_id(db, deck_id, user_id)
    query = db.query(Flashcard).filter(Flashcard.deck_id == deck_id)
    if starred_only:
        query = query.filter(Flashcard.is_starred == True)
    if difficulty:
        query = query.filter(Flashcard.difficulty == difficulty)
    return query.order_by(Flashcard.created_at.desc()).all()


def get_flashcard_by_id(db: Session, card_id: int, user_id: int) -> Flashcard:
    card = db.query(Flashcard).join(FlashcardDeck).filter(
        Flashcard.id == card_id,
        FlashcardDeck.user_id == user_id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Không tìm thấy thẻ")
    return card


def update_flashcard(db: Session, card_id: int, user_id: int, data: FlashcardUpdate) -> Flashcard:
    card = get_flashcard_by_id(db, card_id, user_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return card


def delete_flashcard(db: Session, card_id: int, user_id: int):
    card = get_flashcard_by_id(db, card_id, user_id)
    db.delete(card)
    db.commit()


def toggle_star(db: Session, card_id: int, user_id: int) -> Flashcard:
    """Đổi trạng thái ⭐ starred"""
    card = get_flashcard_by_id(db, card_id, user_id)
    card.is_starred = not card.is_starred
    db.commit()
    db.refresh(card)
    return card


#   Review

def get_review_cards(
    db: Session, deck_id: int, user_id: int,
    mode: str = "sequential",      # sequential | random
    starred_only: bool = False
) -> list[Flashcard]:
    """Lấy cards cho carousel review"""
    cards = get_deck_flashcards(db, deck_id, user_id, starred_only=starred_only)
    if mode == "random":
        random.shuffle(cards)
    return cards
