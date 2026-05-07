const STORAGE_KEYS = {
  quoteCards: "brazil-sku-tool.quote-cards.v1",
  userDefaults: "brazil-sku-tool.user-defaults.v1",
  recentSkuPreview: "brazil-sku-tool.recent-sku-preview.v1",
  recentResults: "brazil-sku-tool.recent-results.v1"
};

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadQuoteCards() {
  return safeRead(STORAGE_KEYS.quoteCards, []);
}

export function saveQuoteCards(quoteCards) {
  safeWrite(STORAGE_KEYS.quoteCards, quoteCards);
}

export function loadUserDefaults() {
  return safeRead(STORAGE_KEYS.userDefaults, null);
}

export function saveUserDefaults(payload) {
  safeWrite(STORAGE_KEYS.userDefaults, payload);
}

export function loadRecentSkuPreview() {
  return safeRead(STORAGE_KEYS.recentSkuPreview, []);
}

export function saveRecentSkuPreview(rows) {
  safeWrite(STORAGE_KEYS.recentSkuPreview, rows);
}

export function loadRecentResults() {
  return safeRead(STORAGE_KEYS.recentResults, []);
}

export function saveRecentResults(rows) {
  safeWrite(STORAGE_KEYS.recentResults, rows);
}

export function clearAllLocalData() {
  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
}
