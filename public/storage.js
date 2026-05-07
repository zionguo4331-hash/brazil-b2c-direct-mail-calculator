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
  try {
    const raw = JSON.stringify(value);
    localStorage.setItem(key, raw);
    return { ok: true };
  } catch (error) {
    console.warn("storage write failed", key, error.message);
    return { ok: false, error: error.message };
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function loadQuoteCards() {
  return safeRead(STORAGE_KEYS.quoteCards, []);
}

export function saveQuoteCards(quoteCards) {
  return safeWrite(STORAGE_KEYS.quoteCards, quoteCards);
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
    safeRemove(key);
  }
}
