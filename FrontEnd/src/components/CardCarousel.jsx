import { useState, useEffect, useCallback } from 'react';
import FlashcardCard from './FlashcardCard';
import '../assets/styles/flashcard.css';

export default function CardCarousel({ cards, deckName, onToggleStar, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goNext = useCallback(() => {
    if (currentIndex < cards.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, cards.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  // Reset index khi danh sách thẻ thực sự thay đổi (số lượng hoặc thứ tự)
  // Tránh reset index khi chỉ thay đổi thuộc tính (như click sao)
  const cardIds = cards ? cards.map(c => c.id).join(',') : '';
  useEffect(() => {
    setCurrentIndex(0);
  }, [cardIds]);

  if (!cards || cards.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h3>Không có thẻ nào để ôn</h3>
        <p>Hãy thêm thẻ vào bộ thẻ hoặc thay đổi bộ lọc</p>
        {onBack && <button className="btn btn-secondary" onClick={onBack}>← Quay lại</button>}
      </div>
    );
  }

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="carousel-page">
      {/* Header */}
      <div className="carousel-header">
        <div>
          {onBack && (
            <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 8 }}>
              ← Quay lại
            </button>
          )}
          <div className="carousel-title">📚 {deckName}</div>
        </div>
        <div className="carousel-counter">
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      {/* Card Display */}
      <div className="carousel-viewport">
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {cards.map((card, idx) => (
            <div className="carousel-slide" key={card.id || idx}>
              <FlashcardCard card={card} onToggleStar={onToggleStar} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="carousel-nav">
        <button
          className="carousel-nav-btn"
          onClick={goPrev}
          disabled={currentIndex === 0}
          aria-label="Thẻ trước"
        >
          ◀
        </button>

        <div className="carousel-progress">
          <div className="carousel-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <button
          className="carousel-nav-btn"
          onClick={goNext}
          disabled={currentIndex === cards.length - 1}
          aria-label="Thẻ tiếp"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
