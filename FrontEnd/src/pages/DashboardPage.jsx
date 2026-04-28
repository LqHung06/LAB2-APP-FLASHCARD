import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { flashcardAPI } from '../services/api';
import GenerateForm from '../components/GenerateForm';
import '../assets/styles/dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [stats, setStats] = useState({ totalDecks: 0, totalCards: 0, starredCards: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await flashcardAPI.getDecks();
      const deckList = res.Data || [];
      setDecks(deckList);

      const totalCards = deckList.reduce((sum, d) => sum + (d.card_count || 0), 0);
      const starredCards = deckList.reduce((sum, d) => sum + (d.starred_count || 0), 0);
      setStats({
        totalDecks: deckList.length,
        totalCards,
        starredCards,
      });
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return '🌅 Chào buổi sáng';
    if (h < 18) return '☀️ Chào buổi chiều';
    return '🌙 Chào buổi tối';
  })();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{greeting}, {user?.display_name || user?.email?.split('@')[0]}!</h1>
        <p>Sẵn sàng học từ vựng hôm nay?</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{stats.totalDecks}</div>
          <div className="stat-label">Bộ thẻ</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🃏</div>
          <div className="stat-value">{stats.totalCards}</div>
          <div className="stat-label">Tổng thẻ</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">{stats.starredCards}</div>
          <div className="stat-label">Thẻ đánh dấu</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-value">AI</div>
          <div className="stat-label">Groq LLaMA</div>
        </div>
      </div>

      {/* AI Generate Section */}
      <GenerateForm decks={decks} onCardSaved={loadData} />

      {/* Recent Decks */}
      <div style={{ marginTop: 32 }}>
        <div className="section-header">
          <h2>📂 Bộ thẻ gần đây</h2>
          <button className="btn btn-ghost" onClick={() => navigate('/decks')}>
            Xem tất cả →
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} className="shimmer-loading" style={{ height: 120, flex: 1, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : decks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Chưa có bộ thẻ nào</h3>
            <p>Hãy tạo bộ thẻ đầu tiên để bắt đầu học!</p>
            <button className="btn btn-primary" onClick={() => navigate('/decks')}>
              ➕ Tạo bộ thẻ
            </button>
          </div>
        ) : (
          <div className="recent-decks-grid">
            {decks.slice(0, 6).map(deck => (
              <div
                key={deck.id}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/decks/${deck.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                    background: 'var(--gradient-hero)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                  }}>📚</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{deck.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {deck.card_count} thẻ • {deck.starred_count} ⭐
                    </div>
                  </div>
                </div>
                {deck.description && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {deck.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
