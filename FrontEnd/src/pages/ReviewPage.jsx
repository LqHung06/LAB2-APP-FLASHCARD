import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardAPI } from '../services/api';
import CardCarousel from '../components/CardCarousel';
import '../assets/styles/flashcard.css';

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [deckName, setDeckName] = useState('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('sequential');
  const [starredOnly, setStarredOnly] = useState(false);

  useEffect(() => {
    loadReview();
  }, [id, mode, starredOnly]);

  async function loadReview() {
    setLoading(true);
    try {
      const [reviewRes, decksRes] = await Promise.all([
        flashcardAPI.getReviewCards(id, { mode, starredOnly }),
        flashcardAPI.getDecks(),
      ]);
      setCards(reviewRes.Data || []);
      const deck = (decksRes.Data || []).find(d => d.id === Number(id));
      setDeckName(deck?.name || 'Bộ thẻ');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStar(cardId) {
    try {
      const res = await flashcardAPI.toggleStar(cardId);
      const updated = res.Data;
      setCards(prev => prev.map(c =>
        c.id === cardId ? { ...c, is_starred: updated.is_starred } : c
      ));
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 0' }}>
        <div className="shimmer-loading" style={{ height: 340, borderRadius: 'var(--radius-xl)', marginBottom: 24 }} />
        <div className="shimmer-loading" style={{ height: 48, width: '50%', margin: '0 auto', borderRadius: 'var(--radius-full)' }} />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 16 }}>
      {/* Mode Controls */}
      <div className="carousel-modes" style={{ marginBottom: 24 }}>
        <button
          className={`mode-btn ${mode === 'sequential' && !starredOnly ? 'active' : ''}`}
          onClick={() => { setMode('sequential'); setStarredOnly(false); }}
        >
          📋 Tuần tự
        </button>
        <button
          className={`mode-btn ${mode === 'random' && !starredOnly ? 'active' : ''}`}
          onClick={() => { setMode('random'); setStarredOnly(false); }}
        >
          🔀 Ngẫu nhiên
        </button>
        <button
          className={`mode-btn ${starredOnly ? 'active' : ''}`}
          onClick={() => setStarredOnly(!starredOnly)}
        >
          ⭐ Chỉ thẻ đánh dấu
        </button>
      </div>

      <CardCarousel
        cards={cards}
        deckName={deckName}
        onToggleStar={handleToggleStar}
        onBack={() => navigate(`/decks/${id}`)}
      />
    </div>
  );
}
