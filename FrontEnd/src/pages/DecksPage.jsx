import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { flashcardAPI } from '../services/api';
import DeckModal from '../components/DeckModal';
import '../assets/styles/deck.css';

export default function DecksPage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDeck, setEditDeck] = useState(null);

  useEffect(() => {
    loadDecks();
  }, []);

  async function loadDecks() {
    try {
      const res = await flashcardAPI.getDecks();
      setDecks(res.Data || []);
    } catch (err) {
      console.error('Failed to load decks:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDeck(data) {
    try {
      if (editDeck) {
        await flashcardAPI.updateDeck(editDeck.id, data);
      } else {
        await flashcardAPI.createDeck(data.name, data.description);
      }
      setShowModal(false);
      setEditDeck(null);
      loadDecks();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteDeck(deckId, e) {
    e.stopPropagation();
    if (!confirm('Xóa bộ thẻ này? Tất cả thẻ bên trong sẽ bị xóa.')) return;
    try {
      await flashcardAPI.deleteDeck(deckId);
      loadDecks();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleEditDeck(deck, e) {
    e.stopPropagation();
    setEditDeck(deck);
    setShowModal(true);
  }

  return (
    <div className="decks-page">
      <div className="decks-header">
        <h1>📚 Bộ thẻ của bạn</h1>
        <button className="btn btn-primary" onClick={() => { setEditDeck(null); setShowModal(true); }} id="create-deck-btn">
          ➕ Tạo bộ thẻ
        </button>
      </div>

      {loading ? (
        <div className="decks-grid">
          {[1,2,3].map(i => (
            <div key={i} className="shimmer-loading" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Chưa có bộ thẻ nào</h3>
          <p>Tạo bộ thẻ đầu tiên để bắt đầu học từ vựng với AI!</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Tạo bộ thẻ
          </button>
        </div>
      ) : (
        <div className="decks-grid">
          {decks.map(deck => (
            <div
              key={deck.id}
              className="deck-card"
              onClick={() => navigate(`/decks/${deck.id}`)}
            >
              <div className="deck-card-header">
                <div className="deck-card-icon">📚</div>
                <div className="deck-card-actions">
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={(e) => handleEditDeck(deck, e)}
                    title="Sửa"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={(e) => handleDeleteDeck(deck.id, e)}
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="deck-card-name">{deck.name}</div>
              <div className="deck-card-desc">{deck.description || 'Chưa có mô tả'}</div>
              <div className="deck-card-footer">
                <span>🃏 {deck.card_count} thẻ</span>
                <span>⭐ {deck.starred_count} đánh dấu</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <DeckModal
          deck={editDeck}
          onSave={handleSaveDeck}
          onClose={() => { setShowModal(false); setEditDeck(null); }}
        />
      )}
    </div>
  );
}
