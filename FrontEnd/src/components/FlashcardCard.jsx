import { useState } from 'react';
import { speakText } from '../utils/speech';
import '../assets/styles/flashcard.css';

export default function FlashcardCard({ card, onToggleStar }) {
  const [flipped, setFlipped] = useState(false);

  let backData = {};
  try {
    backData = typeof card.back === 'string' ? JSON.parse(card.back) : card.back;
  } catch {
    backData = { vn_translation: card.back };
  }

  const difficultyClass = card.difficulty === 'easy' ? 'badge-easy'
    : card.difficulty === 'hard' ? 'badge-hard' : 'badge-medium';

  function handleStarClick(e) {
    e.stopPropagation();
    onToggleStar?.(card.id);
  }

  return (
    <div className="flip-card-container">
      <div className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
        {/* Star Button (visible on both sides) */}
        <button
          className={`card-star-btn ${card.is_starred ? 'starred' : ''}`}
          onClick={handleStarClick}
          title={card.is_starred ? 'Bỏ đánh dấu' : 'Đánh dấu thẻ khó'}
        >
          {card.is_starred ? '⭐' : '☆'}
        </button>

        {/* Difficulty badge */}
        <div className="card-difficulty">
          <span className={`badge ${difficultyClass}`}>{card.difficulty}</span>
        </div>

        {/* FRONT */}
        <div className="flip-card-face flip-card-front">
          <div className="card-word" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            {card.front}
            <button 
              onClick={(e) => { e.stopPropagation(); speakText(card.front); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', padding: 0, opacity: 0.8 }}
              title="Nghe phát âm"
              type="button"
            >
              🔊
            </button>
          </div>
          <div className="card-pos">{backData.part_of_speech || ''}</div>
          <div className="card-hint">👆 Nhấn để lật thẻ</div>
        </div>

        {/* BACK */}
        <div className="flip-card-face flip-card-back">
          <div className="flip-back-section">
            <div className="flip-back-label">Phiên âm</div>
            <div className="flip-back-ipa">{backData.ipa || '—'}</div>
          </div>

          <div className="flip-back-section">
            <div className="flip-back-label">Dịch nghĩa</div>
            <div className="flip-back-translation">{backData.vn_translation || '—'}</div>
          </div>

          <div className="flip-back-section">
            <div className="flip-back-label">Định nghĩa</div>
            <div className="flip-back-value">{backData.en_definition || '—'}</div>
          </div>

          {backData.context_nuance && (
            <div className="flip-back-section">
              <div className="flip-back-label">Ngữ cảnh</div>
              <div className="flip-back-value" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {backData.context_nuance}
              </div>
            </div>
          )}

          <div className="flip-back-section">
            <div className="flip-back-label">Ví dụ</div>
            <div className="flip-back-example" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {backData.example_en || '—'}
              {backData.example_en && (
                <button 
                  onClick={(e) => { e.stopPropagation(); speakText(backData.example_en); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0, opacity: 0.8 }}
                  title="Nghe câu ví dụ"
                  type="button"
                >
                  🔊
                </button>
              )}
            </div>
            <div className="flip-back-value" style={{ marginTop: 4, fontSize: '0.85rem', color: 'var(--accent-success)' }}>
              {backData.example_vn || ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
