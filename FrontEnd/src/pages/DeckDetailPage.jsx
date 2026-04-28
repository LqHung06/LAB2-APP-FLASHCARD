import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardAPI } from '../services/api';
import GenerateForm from '../components/GenerateForm';
import '../assets/styles/deck.css';

export default function DeckDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ starred: false, difficulty: null });

  useEffect(() => {
    loadAll();
  }, [id]);

  useEffect(() => {
    if (id) loadCards();
  }, [filter]);

  async function loadAll() {
    try {
      const [decksRes, cardsRes] = await Promise.all([
        flashcardAPI.getDecks(),
        flashcardAPI.getCards(id, {
          starredOnly: filter.starred,
          difficulty: filter.difficulty,
        }),
      ]);
      const allDecks = decksRes.Data || [];
      setDecks(allDecks);
      setDeck(allDecks.find(d => d.id === Number(id)));
      setCards(cardsRes.Data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCards() {
    try {
      const res = await flashcardAPI.getCards(id, {
        starredOnly: filter.starred,
        difficulty: filter.difficulty,
      });
      setCards(res.Data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggleStar(cardId) {
    try {
      await flashcardAPI.toggleStar(cardId);
      setCards(prev => prev.map(c =>
        c.id === cardId ? { ...c, is_starred: !c.is_starred } : c
      ));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteCard(cardId) {
    if (!confirm('Xóa thẻ này?')) return;
    try {
      await flashcardAPI.deleteCard(cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
    } catch (err) {
      alert(err.message);
    }
  }

  function parseBack(back) {
    try {
      return typeof back === 'string' ? JSON.parse(back) : back;
    } catch {
      return { vn_translation: back };
    }
  }

  if (loading) {
    return (
      <div className="deck-detail">
        <div className="shimmer-loading" style={{ height: 32, width: '40%', marginBottom: 16 }} />
        <div className="shimmer-loading" style={{ height: 200, marginBottom: 16 }} />
      </div>
    );
  }

  return (
    <div className="deck-detail">
      <div className="deck-detail-header">
        <div className="deck-detail-back" onClick={() => navigate('/decks')}>
          ← Quay lại bộ thẻ
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="deck-detail-title">{deck?.name || 'Bộ thẻ'}</h1>
            <p className="deck-detail-desc">{deck?.description}</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/decks/${id}/review`)}
            disabled={cards.length === 0}
            id="start-review-btn"
          >
            🎴 Bắt đầu ôn tập
          </button>
        </div>
      </div>

      {/* AI Generate */}
      <GenerateForm decks={decks} onCardSaved={loadAll} defaultDeckId={id} />

      {/* Filters */}
      <div className="filters-bar" style={{ marginTop: 24 }}>
        <button
          className={`filter-chip ${!filter.starred && !filter.difficulty ? 'active' : ''}`}
          onClick={() => setFilter({ starred: false, difficulty: null })}
        >
          Tất cả
        </button>
        <button
          className={`filter-chip ${filter.starred ? 'active' : ''}`}
          onClick={() => setFilter(f => ({ ...f, starred: !f.starred }))}
        >
          ⭐ Đã đánh dấu
        </button>
        {['easy', 'medium', 'hard'].map(d => (
          <button
            key={d}
            className={`filter-chip ${filter.difficulty === d ? 'active' : ''}`}
            onClick={() => setFilter(f => ({ ...f, difficulty: f.difficulty === d ? null : d }))}
          >
            {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d}
          </button>
        ))}
      </div>

      {/* Cards List */}
      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa có thẻ nào</h3>
          <p>Dùng AI Generator ở trên để tạo thẻ mới!</p>
        </div>
      ) : (
        <div className="cards-list">
          {cards.map(card => {
            const back = parseBack(card.back);
            return (
              <div key={card.id} className="card-item">
                <div className="card-item-header">
                  <span className="card-item-front">{card.front}</span>
                  <button
                    className={`card-item-star ${card.is_starred ? 'starred' : ''}`}
                    onClick={() => handleToggleStar(card.id)}
                    title={card.is_starred ? 'Bỏ đánh dấu' : 'Đánh dấu thẻ khó'}
                  >
                    {card.is_starred ? '⭐' : '☆'}
                  </button>
                </div>
                <div className="card-item-ipa">{back.ipa || ''}</div>
                <div className="card-item-translation">{back.vn_translation || '—'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  {back.en_definition || ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span className={`badge ${
                    card.difficulty === 'easy' ? 'badge-easy' :
                    card.difficulty === 'hard' ? 'badge-hard' : 'badge-medium'
                  }`}>
                    {card.difficulty}
                  </span>
                </div>
                <div className="card-item-actions">
                  <button className="btn btn-ghost" onClick={() => handleDeleteCard(card.id)} style={{ fontSize: '0.8rem', color: 'var(--accent-danger)' }}>
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
