import { useState, useEffect } from 'react';
import { flashcardAPI } from '../services/api';
import { speakText } from '../utils/speech';
import '../assets/styles/flashcard.css';

export default function GenerateForm({ decks, onCardSaved, defaultDeckId }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState(defaultDeckId || '');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [progress, setProgress] = useState({ total: 0, current: 0 });

  useEffect(() => {
    if (defaultDeckId) setSelectedDeckId(defaultDeckId);
  }, [defaultDeckId]);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!term.trim()) return;

    // Parse terms separated by commas
    const rawTerms = Array.from(new Set(term.split(',').map(t => t.trim()).filter(Boolean)));
    if (rawTerms.length === 0) return;

    if (rawTerms.length > 10) {
      setError('⚠ Vượt quá giới hạn! Chỉ được phép tạo tối đa 10 từ/cụm từ cùng lúc.');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setSuccessMsg('');
    setProgress({ total: rawTerms.length, current: 0 });

    const currentResults = [];
    const failedTerms = [];

    for (let i = 0; i < rawTerms.length; i++) {
        const t = rawTerms[i];
        setProgress({ total: rawTerms.length, current: i + 1 });
        try {
            const res = await flashcardAPI.generate(t);
            // AI trả về thiếu trường thì lấy term mặc định
            if (!res.Data.term_or_phrase) {
                res.Data.term_or_phrase = t;
            }
            currentResults.push(res.Data);
            setResults([...currentResults]); // Update UI progressively
        } catch (err) {
            failedTerms.push(t);
        }
    }

    setLoading(false);

    if (failedTerms.length > 0) {
        setError(`❌ Không thể phân tích ${failedTerms.length} từ: ${failedTerms.join(', ')}`);
    }
    
    if (currentResults.length > 0) {
        if (failedTerms.length === 0) setSuccessMsg('✨ Phân tích hoàn tất!');
    } else {
        setError('❌ Không nhận được kết quả phân tích nào, vui lòng thử lại.');
    }
  }

  async function handleSave() {
    if (!selectedDeckId || results.length === 0) return;
    setSaving(true);
    setError('');

    try {
      const payload = results.map(r => ({
        front: r.term_or_phrase,
        back: JSON.stringify(r),
        difficulty: 'medium',
      }));

      await flashcardAPI.createCardsBulk(selectedDeckId, payload);
      setSuccessMsg(`✅ Đã lưu ${results.length} thẻ vào bộ thẻ thành công!`);
      setResults([]);
      setTerm('');
      setProgress({ total: 0, current: 0 });
      onCardSaved?.();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Không thể lưu thẻ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="generate-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>🤖 Tạo Flashcard Hàng Loạt (AI)</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tối đa 10 từ/lần</span>
      </div>

      <form onSubmit={handleGenerate}>
        <div className="generate-input-row">
          <textarea
            className="input"
            style={{ resize: 'vertical', minHeight: '60px' }}
            placeholder="Nhập 1 hoặc nhiều từ tiếng Anh cách nhau bởi dấu phẩy (vd: apple, banana, run out of...)"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            disabled={loading}
            id="ai-term-input"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !term.trim()}
            id="ai-generate-btn"
            style={{ alignSelf: 'stretch' }}
          >
            {loading ? '⏳...' : '✨ Phân tích'}
          </button>
        </div>
      </form>

      {/* Progress Bar during generation */}
      {loading && progress.total > 0 && (
          <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                  <span>Đang xử lý phân tích AI...</span>
                  <span>{progress.current} / {progress.total}</span>
              </div>
              <div style={{ height: 6, width: '100%', backgroundColor: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ 
                      height: '100%', 
                      width: `${(progress.current / progress.total) * 100}%`, 
                      backgroundColor: 'var(--accent-primary)',
                      transition: 'width 0.3s ease'
                   }} />
              </div>
          </div>
      )}

      {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}
      {successMsg && <div style={{ marginTop: 12, color: 'var(--accent-success)', fontSize: '0.9rem', fontWeight: 'bold' }}>{successMsg}</div>}

      {/* List of Results */}
      {results.length > 0 && (
        <div className="generate-results-container animate-fade-in-up" style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {results.map((result, idx) => (
              <div key={idx} className="generate-result" style={{ padding: 16, backgroundColor: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {result.term_or_phrase}
                      <button 
                        onClick={() => speakText(result.term_or_phrase)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0, opacity: 0.7, transition: 'opacity 0.2s' }}
                        title="Nghe phát âm"
                        onMouseOver={(e) => e.target.style.opacity = 1}
                        onMouseOut={(e) => e.target.style.opacity = 0.7}
                        type="button"
                      >
                        🔊
                      </button>
                    </div>
                    <div style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                      {result.ipa}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr', gap: '4px 12px', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Loại:</span>
                    <span>{result.part_of_speech}</span>
                    
                    <span style={{ color: 'var(--text-secondary)' }}>Dịch:</span>
                    <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>{result.vn_translation}</span>
                    
                    <span style={{ color: 'var(--text-secondary)' }}>Nghĩa:</span>
                    <span>{result.en_definition}</span>

                    {result.example_en && (
                      <>
                        <span style={{ color: 'var(--text-secondary)' }}>Ví dụ:</span>
                        <div>
                          <div style={{ fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {result.example_en}
                            <button 
                              onClick={() => speakText(result.example_en)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: 0, opacity: 0.7 }}
                              title="Nghe câu ví dụ"
                              type="button"
                            >
                              🔊
                            </button>
                          </div>
                          <div style={{ color: 'var(--accent-success)', fontSize: '0.85rem', marginTop: 4 }}>
                            {result.example_vn}
                          </div>
                        </div>
                      </>
                    )}
                </div>
              </div>
          ))}

          {/* Save to deck */}
          <div className="generate-save-row" style={{ marginTop: 16 }}>
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              id="deck-select"
            >
              <option value="">-- Chọn bộ thẻ để lưu {results.length} thẻ --</option>
              {decks.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!selectedDeckId || saving || loading}
              id="save-card-btn"
            >
              {saving ? '⏳ Đang lưu...' : `💾 Lưu ${results.length} thẻ`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
