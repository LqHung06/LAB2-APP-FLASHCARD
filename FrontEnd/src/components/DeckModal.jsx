import { useState } from 'react';

export default function DeckModal({ deck, onSave, onClose }) {
  const [name, setName] = useState(deck?.name || '');
  const [description, setDescription] = useState(deck?.description || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{deck ? '✏️ Sửa bộ thẻ' : '➕ Tạo bộ thẻ mới'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: 16 }}>
            <label>Tên bộ thẻ</label>
            <input
              type="text"
              className="input"
              placeholder="VD: Phrasal Verbs, IELTS Writing..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              id="deck-name-input"
            />
          </div>

          <div className="input-group">
            <label>Mô tả (tùy chọn)</label>
            <input
              type="text"
              className="input"
              placeholder="Mô tả ngắn về bộ thẻ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              id="deck-desc-input"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim() || loading}
              id="deck-save-btn"
            >
              {loading ? '⏳ Đang lưu...' : (deck ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
