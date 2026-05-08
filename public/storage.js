const STORAGE_KEYS = {
  quoteCards: "brazil-sku-tool.quote-cards.v2",
  userDefaults: "brazil-sku-tool.user-defaults.v1",
  recentSkuPreview: "brazil-sku-tool.recent-sku-preview.v1",
  recentResults: "brazil-sku-tool.recent-results.v1"
};

const LEGACY_QUOTE_KEYS = [
  "brazil-sku-tool.quote-cards.v1"
];

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function safeWriteRaw(key, value) {
  try {
    const raw = JSON.stringify(value);
    const sizeKb = Math.round(raw.length / 1024);
    if (sizeKb > 4500) {
      return { ok: false, error: `数据过大（约 ${sizeKb}KB）。请减少历史数据或继续精简当前报价。` };
    }
    localStorage.setItem(key, raw);
    return { ok: true, sizeKb };
  } catch (error) {
    console.warn("storage write failed", key, error.message);
    return { ok: false, error: "保存失败：浏览器存储空间不足。请先到“数据备份”页清空旧数据后再试。" };
  }
}

function trimText(text, maxLength = 1200) {
  if (!text) {
    return "";
  }
  return String(text).length > maxLength ? `${String(text).slice(0, maxLength)}...` : String(text);
}

function compactConfidenceSummary(summary = {}) {
  return {
    overall: summary.overall || "medium",
    high_confidence_fields: Array.isArray(summary.high_confidence_fields) ? summary.high_confidence_fields.slice(0, 20) : [],
    low_confidence_fields: Array.isArray(summary.low_confidence_fields) ? summary.low_confidence_fields.slice(0, 20) : [],
    needs_human_check: Array.isArray(summary.needs_human_check) ? summary.needs_human_check.slice(0, 20) : []
  };
}

function compactQuestions(questions = []) {
  return Array.isArray(questions)
    ? questions.slice(0, 20).map((item) => [item.question || "", item.answer || "", item.required !== false ? 1 : 0])
    : [];
}

function expandQuestions(questions = []) {
  return Array.isArray(questions)
    ? questions.map((item) => ({
      question: item[0] || "",
      answer: item[1] || "",
      required: item[2] !== 0
    }))
    : [];
}

function compactMainRates(items = []) {
  return Array.isArray(items)
    ? items.map((item) => [item.product_code || "", item.per_kg_cny ?? item.per_kg ?? 0, item.notes || ""])
    : [];
}

function expandMainRates(items = []) {
  return Array.isArray(items)
    ? items.map((item) => ({
      product_code: item[0] || "",
      per_kg_cny: item[1] ?? 0,
      notes: item[2] || ""
    }))
    : [];
}

function compactHandlingTiers(items = []) {
  return Array.isArray(items)
    ? items.map((item) => [item.min_weight_kg ?? 0, item.max_weight_kg ?? 0, item.fee_cny ?? 0, item.label || ""])
    : [];
}

function expandHandlingTiers(items = []) {
  return Array.isArray(items)
    ? items.map((item) => ({
      min_weight_kg: item[0] ?? 0,
      max_weight_kg: item[1] ?? 0,
      fee_cny: item[2] ?? 0,
      label: item[3] || ""
    }))
    : [];
}

function compactTailMatrix(matrix = {}) {
  const entries = Array.isArray(matrix.entries)
    ? matrix.entries.map((item) => [item.zone || "", item.min_weight_kg ?? 0, item.max_weight_kg ?? 0, item.fee_cny ?? 0])
    : [];
  return {
    z: Array.isArray(matrix.zones) ? matrix.zones : [],
    w: Array.isArray(matrix.weight_columns) ? matrix.weight_columns : [],
    e: entries
  };
}

function expandTailMatrix(matrix = {}) {
  return {
    zones: Array.isArray(matrix.z) ? matrix.z : [],
    weight_columns: Array.isArray(matrix.w) ? matrix.w : [],
    entries: Array.isArray(matrix.e)
      ? matrix.e.map((item) => ({
        zone: item[0] || "",
        min_weight_kg: item[1] ?? 0,
        max_weight_kg: item[2] ?? 0,
        fee_cny: item[3] ?? 0
      }))
      : []
  };
}

function normalizePostalEntry(entry = {}) {
  return {
    postcode_start: Number(entry.postcode_start || 0),
    postcode_end: Number(entry.postcode_end || 0),
    zone: entry.zone || "",
    state_code: entry.state_code || "",
    city: entry.city || "",
    state: entry.state || "",
    region: entry.region || ""
  };
}

function mergePostalEntries(entries = []) {
  const normalized = entries
    .map(normalizePostalEntry)
    .filter((item) => item.postcode_start > 0 && item.postcode_end > 0 && item.zone)
    .sort((left, right) => left.postcode_start - right.postcode_start);

  if (!normalized.length) {
    return [];
  }

  const merged = [normalized[0]];
  for (const current of normalized.slice(1)) {
    const previous = merged[merged.length - 1];
    const sameMeta =
      previous.zone === current.zone &&
      previous.state_code === current.state_code &&
      previous.city === current.city &&
      previous.state === current.state &&
      previous.region === current.region;
    if (sameMeta && current.postcode_start <= previous.postcode_end + 1) {
      previous.postcode_end = Math.max(previous.postcode_end, current.postcode_end);
    } else {
      merged.push(current);
    }
  }
  return merged;
}

function compactPostalMap(map = {}) {
  const merged = mergePostalEntries(Array.isArray(map.entries) ? map.entries : []);
  const entries = merged.map((item) => [
    item.postcode_start || 0,
    item.postcode_end || 0,
    item.zone || "",
    item.state_code || ""
  ]);
  return { e: entries };
}

function expandPostalMap(map = {}) {
  return {
    entries: Array.isArray(map.e)
      ? map.e.map((item) => ({
        postcode_start: item[0] || "",
        postcode_end: item[1] || "",
        zone: item[2] || "",
        city: "",
        state: "",
        state_code: item[3] || "",
        region: ""
      }))
      : []
  };
}

function compactQuoteCard(quoteCard, mode = "full") {
  const compacted = {
    ...quoteCard,
    __compressed: true,
    validation: undefined,
    can_participate_in_calculation: undefined,
    original_text_excerpt: mode === "lite" ? "" : trimText(quoteCard.original_text_excerpt, 800),
    notes: mode === "lite" ? trimText(quoteCard.notes, 400) : trimText(quoteCard.notes, 2000),
    confidence_summary: mode === "lite" ? compactConfidenceSummary({ overall: quoteCard.confidence_summary?.overall || "medium" }) : compactConfidenceSummary(quoteCard.confidence_summary),
    questions_for_user: mode === "lite" ? [] : compactQuestions(quoteCard.questions_for_user),
    main_prc_rates: compactMainRates(quoteCard.main_prc_rates),
    handling_fee_tiers: compactHandlingTiers(quoteCard.handling_fee_tiers),
    tail_delivery_matrix: compactTailMatrix(quoteCard.tail_delivery_matrix),
    postal_zone_map: compactPostalMap(quoteCard.postal_zone_map),
    restriction_notes: mode === "lite" ? [] : Array.isArray(quoteCard.restriction_notes) ? quoteCard.restriction_notes.slice(0, 20) : []
  };
  return compacted;
}

function expandQuoteCard(quoteCard) {
  if (!quoteCard?.__compressed) {
    return quoteCard;
  }
  return {
    ...quoteCard,
    questions_for_user: expandQuestions(quoteCard.questions_for_user),
    main_prc_rates: expandMainRates(quoteCard.main_prc_rates),
    handling_fee_tiers: expandHandlingTiers(quoteCard.handling_fee_tiers),
    tail_delivery_matrix: expandTailMatrix(quoteCard.tail_delivery_matrix),
    postal_zone_map: expandPostalMap(quoteCard.postal_zone_map)
  };
}

export function loadQuoteCards() {
  const current = safeRead(STORAGE_KEYS.quoteCards, null);
  if (current?.quote_cards) {
    return current.quote_cards.map(expandQuoteCard);
  }

  for (const legacyKey of LEGACY_QUOTE_KEYS) {
    const legacy = safeRead(legacyKey, null);
    if (Array.isArray(legacy) && legacy.length) {
      return legacy.map(expandQuoteCard);
    }
  }

  return [];
}

export function saveQuoteCards(quoteCards) {
  const fullPayload = {
    version: 2,
    saved_at: new Date().toISOString(),
    save_mode: "full",
    quote_cards: quoteCards.map((item) => compactQuoteCard(item, "full"))
  };
  let result = safeWriteRaw(STORAGE_KEYS.quoteCards, fullPayload);
  if (!result.ok) {
    const litePayload = {
      version: 2,
      saved_at: new Date().toISOString(),
      save_mode: "lite",
      quote_cards: quoteCards.map((item) => compactQuoteCard(item, "lite"))
    };
    result = safeWriteRaw(STORAGE_KEYS.quoteCards, litePayload);
  }
  if (result.ok) {
    for (const legacyKey of LEGACY_QUOTE_KEYS) {
      safeRemove(legacyKey);
    }
    return result;
  }
  return result;
}

export function loadUserDefaults() {
  return safeRead(STORAGE_KEYS.userDefaults, null);
}

export function saveUserDefaults(payload) {
  safeWriteRaw(STORAGE_KEYS.userDefaults, payload);
}

export function loadRecentSkuPreview() {
  return safeRead(STORAGE_KEYS.recentSkuPreview, []);
}

export function saveRecentSkuPreview(rows) {
  safeWriteRaw(STORAGE_KEYS.recentSkuPreview, rows);
}

export function loadRecentResults() {
  return safeRead(STORAGE_KEYS.recentResults, []);
}

export function saveRecentResults(rows) {
  safeWriteRaw(STORAGE_KEYS.recentResults, rows);
}

export function clearAllLocalData() {
  for (const key of [...Object.values(STORAGE_KEYS), ...LEGACY_QUOTE_KEYS]) {
    safeRemove(key);
  }
}
