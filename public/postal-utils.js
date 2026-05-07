export function normalizeBrazilCep(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.length !== 8) {
    return { valid: false, normalized: "", reason: "invalid_length" };
  }
  return { valid: true, normalized: digits };
}

function compareCep(target, entry) {
  const start = Number(entry.postcode_start || 0);
  const end = Number(entry.postcode_end || 0);
  if (target < start) {
    return -1;
  }
  if (target > end) {
    return 1;
  }
  return 0;
}

export function sortPostalZoneEntries(entries = []) {
  return [...entries].sort((left, right) => Number(left.postcode_start || 0) - Number(right.postcode_start || 0));
}

export function lookupBrazilPostalZone(cep, postalZoneMap) {
  const normalized = normalizeBrazilCep(cep);
  if (!normalized.valid) {
    return { found: false, warning: "CEP_INVALID" };
  }
  const target = Number(normalized.normalized);
  const entries = sortPostalZoneEntries(postalZoneMap?.entries || []);
  let low = 0;
  let high = entries.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const entry = entries[mid];
    const comparison = compareCep(target, entry);
    if (comparison === 0) {
      return {
        found: true,
        zone: entry.zone,
        city: entry.city || "",
        state: entry.state || "",
        state_code: entry.state_code || "",
        region: entry.region || "",
        normalized_cep: normalized.normalized
      };
    }
    if (comparison < 0) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return { found: false, warning: "CEP_NOT_FOUND_IN_ZONE_MAP", normalized_cep: normalized.normalized };
}
