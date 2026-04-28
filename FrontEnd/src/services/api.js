/**
 * API Service — Fetch wrapper với auth headers
 * Sử dụng Vite proxy: /api → http://localhost:8000/api
 */

let _getToken = null;

// Được gọi từ AuthContext để inject hàm lấy token
export function setTokenGetter(fn) {
  _getToken = fn;
}

async function request(endpoint, options = {}) {
  const token = _getToken ? await _getToken() : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`/api/v1${endpoint}`, {
    cache: 'no-store',
    ...options,
    headers,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.Message || data.detail || 'Có lỗi xảy ra');
  }

  return data;
}

//  Auth
export const authAPI = {
  register: (email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, confirmpassword: password }),
    }),

  login: (idToken) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    }),

  logout: () =>
    request('/auth/logout', { method: 'POST' }),
};

//  Flashcards
export const flashcardAPI = {
  // AI Generation
  generate: (term) =>
    request('/flashcards/generate', {
      method: 'POST',
      body: JSON.stringify({ term }),
    }),

  // Decks
  getDecks: () =>
    request('/flashcards/decks'),

  createDeck: (name, description = '') =>
    request('/flashcards/decks', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  updateDeck: (deckId, data) =>
    request(`/flashcards/decks/${deckId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteDeck: (deckId) =>
    request(`/flashcards/decks/${deckId}`, { method: 'DELETE' }),

  // Cards
  getCards: (deckId, { starredOnly = false, difficulty = null } = {}) => {
    const params = new URLSearchParams();
    if (starredOnly) params.set('starred_only', 'true');
    if (difficulty) params.set('difficulty', difficulty);
    const qs = params.toString();
    return request(`/flashcards/decks/${deckId}/cards${qs ? '?' + qs : ''}`);
  },

  createCard: (deckId, cardData) =>
    request(`/flashcards/decks/${deckId}/cards`, {
      method: 'POST',
      body: JSON.stringify(cardData),
    }),

  createCardsBulk: (deckId, cardsData) =>
    request(`/flashcards/decks/${deckId}/cards/bulk`, {
      method: 'POST',
      body: JSON.stringify(cardsData),
    }),

  updateCard: (cardId, data) =>
    request(`/flashcards/cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCard: (cardId) =>
    request(`/flashcards/cards/${cardId}`, { method: 'DELETE' }),

  toggleStar: (cardId) =>
    request(`/flashcards/cards/${cardId}/star`, { method: 'PATCH' }),

  // Review
  getReviewCards: (deckId, { mode = 'sequential', starredOnly = false } = {}) => {
    const params = new URLSearchParams({ mode });
    if (starredOnly) params.set('starred_only', 'true');
    return request(`/flashcards/decks/${deckId}/review?${params}`);
  },
};
