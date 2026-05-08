import { DEFAULTS } from "./defaults.js";
import { lookupBrazilPostalZone } from "./postal-utils.js";

export const DEFAULT_CONFIRMATION_QUESTIONS = [
  "货代是否书面确认我们的产品可以承运？",
  "是否包含巴西本地尾程派送？",
  "是否包含清关服务？",
  "是否包含进口税？",
  "报价是否仍在有效期内？"
].map((question) => ({
  question,
  answer: "",
  required: true
}));

export const QUOTE_SOURCE_OPTIONS = [
  ["manual", "人工录入"],
  ["rule_extracted", "前端规则识别"],
  ["csv_imported", "CSV / XLSX 导入"],
  ["ai_extracted", "AI / Dify 解析导入"],
  ["json_imported", "JSON 导入"]
];

export const QUOTE_CARD_TEMPLATE = {
  quote_id: "",
  quote_name: "",
  forwarder_name: "",
  brand_or_channel_name: "",
  mode: "air_direct_mail",
  country: "Brazil",
  cargo_type: "general",
  currency: "USD",
  billing_method: "per_kg",
  volumetric_divisor: DEFAULTS.direct_mail.volumetric_divisor,
  min_charge_usd: 0,
  base_fee_usd: 0,
  per_kg_usd: 0,
  per_cbm_usd: 0,
  first_weight_kg: 0,
  first_weight_fee_usd: 0,
  additional_weight_unit_kg: 0,
  additional_weight_fee_usd: 0,
  fuel_surcharge_rate: 0,
  remote_area_surcharge_usd: 0,
  customs_clearance_fee_usd: 0,
  sensitive_goods_surcharge_usd: 0,
  battery_surcharge_usd: 0,
  fixed_per_order_usd: 0,
  storage_fee_usd_per_unit_month: DEFAULTS.local_warehouse.storage_fee_usd_per_unit_month,
  inbound_fee_usd_per_unit: DEFAULTS.local_warehouse.inbound_fee_usd_per_unit,
  pick_pack_base_fee_usd: DEFAULTS.local_warehouse.pick_pack_base_fee_usd,
  pick_fee_usd_per_item: DEFAULTS.local_warehouse.pick_fee_usd_per_item,
  local_packaging_cost_usd: DEFAULTS.local_warehouse.local_packaging_cost_usd,
  last_mile_delivery_usd: DEFAULTS.local_warehouse.last_mile_delivery_usd,
  valid_from: "",
  valid_to: "",
  notes: "",
  status: "draft",
  source: "manual",
  confidence_summary: {
    overall: "medium",
    high_confidence_fields: [],
    low_confidence_fields: [],
    needs_human_check: []
  },
  questions_for_user: [],
  original_file_name: "",
  original_text_excerpt: "",
  imported_at: "",
  confirmed_at: "",
  confirmed_by: "",
  version: 1,
  parent_quote_id: "",
  review_level: "needs_business_check",
  selected_product_code: "",
  available_product_codes: [],
  tax_mode: "system_formula",
  manual_tax_usd: 0,
  tail_cost_strategy: "skip_for_trial",
  manual_tail_cost_usd: 0,
  forwarder_tax_service_fee_rate: 0.07,
  use_forwarder_tax_service_fee: false,
  tail_zone_mode: "cep_lookup",
  main_prc_rates: [],
  handling_fee_tiers: [],
  tail_delivery_matrix: {
    zones: [],
    weight_columns: [],
    entries: []
  },
  postal_zone_map: {
    entries: []
  },
  restriction_notes: [],
  created_at: "",
  updated_at: ""
};

export const QUOTE_CARD_FIELDS = [
  ["quote_name", "报价名称", "text"],
  ["forwarder_name", "货代名称", "text"],
  ["brand_or_channel_name", "适用品牌 / 渠道", "text"],
  ["mode", "模式", "select"],
  ["country", "国家", "text"],
  ["currency", "币种", "text"],
  ["billing_method", "计费方式", "select"],
  ["source", "来源", "select"],
  ["volumetric_divisor", "体积重除数", "number"],
  ["min_charge_usd", "最低收费 USD", "number"],
  ["base_fee_usd", "基础费 USD", "number"],
  ["per_kg_usd", "每公斤 USD", "number"],
  ["per_cbm_usd", "每立方 USD", "number"],
  ["first_weight_kg", "首重 kg", "number"],
  ["first_weight_fee_usd", "首重费 USD", "number"],
  ["additional_weight_unit_kg", "续重单位 kg", "number"],
  ["additional_weight_fee_usd", "续重费 USD", "number"],
  ["fuel_surcharge_rate", "燃油附加费率", "number"],
  ["remote_area_surcharge_usd", "偏远附加费 USD", "number"],
  ["customs_clearance_fee_usd", "清关费 USD", "number"],
  ["sensitive_goods_surcharge_usd", "敏感货附加费 USD", "number"],
  ["battery_surcharge_usd", "电池附加费 USD", "number"],
  ["fixed_per_order_usd", "固定单票 USD", "number"],
  ["storage_fee_usd_per_unit_month", "仓储 USD/件/月", "number"],
  ["inbound_fee_usd_per_unit", "入库 USD/件", "number"],
  ["pick_pack_base_fee_usd", "出库基础费 USD", "number"],
  ["pick_fee_usd_per_item", "拣货费 USD/件", "number"],
  ["local_packaging_cost_usd", "本地包材 USD", "number"],
  ["last_mile_delivery_usd", "尾程快递 USD", "number"],
  ["valid_from", "生效日期", "date"],
  ["valid_to", "失效日期", "date"],
  ["version", "版本号", "number"],
  ["confirmed_by", "确认人", "text"],
  ["original_file_name", "原始文件名", "text"],
  ["status", "状态", "select"],
  ["notes", "备注", "textarea"],
  ["original_text_excerpt", "原始文本摘要", "textarea"]
];

export const QUOTE_MODE_OPTIONS = [
  ["air_direct_mail", "中国直邮空运"],
  ["sea_bulk", "海运备货"],
  ["brazil_local_3pf", "巴西本地 3PF"],
  ["mercado_livre_full", "Mercado Livre Full"],
  ["shopee_3pf", "Shopee 3PF"]
];

export const BILLING_METHOD_OPTIONS = [
  ["per_kg", "按 kg"],
  ["first_weight_additional_weight", "首重 + 续重"],
  ["per_cbm", "按 CBM"],
  ["fixed_per_order", "按单固定收费"],
  ["local_3pf_fee", "本地 3PF 费用"]
];

export const QUOTE_STATUS_OPTIONS = [
  ["draft", "草稿"],
  ["needs_review", "待确认"],
  ["confirmed", "已确认"],
  ["expired", "已过期"],
  ["disabled", "已禁用"]
];

const SUPPORT_ONLY_QUOTE_PATTERNS = [
  /寄件需知/i,
  /托运条款/i,
  /尾程派送报价/i,
  /尾程价格测算/i,
  /商业清关区域划分/i,
  /巴西禁运表/i,
  /异行件展示/i
];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function nowIsoString() {
  return new Date().toISOString();
}

function roundValue(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function createQuoteId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `quote_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function normalizeConfidenceSummary(rawSummary) {
  const summary = rawSummary || {};
  return {
    overall: ["low", "medium", "high"].includes(summary.overall) ? summary.overall : "medium",
    high_confidence_fields: Array.isArray(summary.high_confidence_fields) ? summary.high_confidence_fields : [],
    low_confidence_fields: Array.isArray(summary.low_confidence_fields) ? summary.low_confidence_fields : [],
    needs_human_check: Array.isArray(summary.needs_human_check) ? summary.needs_human_check : []
  };
}

function normalizeQuestionsForUser(rawQuestions, useDefaults = false) {
  const sourceQuestions = Array.isArray(rawQuestions) && rawQuestions.length
    ? rawQuestions
    : useDefaults
      ? DEFAULT_CONFIRMATION_QUESTIONS
      : [];
  return sourceQuestions.map((item) => ({
    question: item.question || "",
    answer: item.answer || "",
    required: item.required !== false
  }));
}

function inferSelectedProductCode(payload = {}, quoteCard = {}) {
  const availableCodes = Array.isArray(quoteCard.available_product_codes) ? quoteCard.available_product_codes : [];
  const candidates = [
    payload.selected_product_code,
    payload.sku,
    payload.product_name,
    quoteCard.selected_product_code
  ]
    .map((item) => String(item || "").trim().toUpperCase())
    .filter(Boolean);

  for (const candidate of candidates) {
    const matched = candidate.match(/BR\d{4}/);
    if (!matched) {
      continue;
    }
    if (!availableCodes.length || availableCodes.includes(matched[0])) {
      return matched[0];
    }
  }

  return availableCodes[0] || "";
}

function deriveReviewLevel(quoteCard, validation) {
  const hasMainRate = (quoteCard.main_prc_rates?.length || 0) > 0 || quoteCard.per_kg_usd > 0 || quoteCard.per_cbm_usd > 0 || quoteCard.fixed_per_order_usd > 0;
  const hasTailMatrix = (quoteCard.tail_delivery_matrix?.entries?.length || 0) > 0 || quoteCard.last_mile_delivery_usd > 0;
  const hasPostalMap = (quoteCard.postal_zone_map?.entries?.length || 0) > 0;

  if (!hasMainRate) {
    return "cannot_use";
  }
  if (!hasTailMatrix) {
    return "needs_logistics_review";
  }
  if (validation.missing_fields.length > 0 || !hasPostalMap) {
    return "needs_business_check";
  }
  return "ready_to_confirm";
}

function hasMainFreight(quoteCard) {
  const hasFirstWeightRule =
    toNumber(quoteCard.first_weight_kg) > 0 &&
    toNumber(quoteCard.first_weight_fee_usd) > 0 &&
    toNumber(quoteCard.additional_weight_unit_kg) > 0 &&
    toNumber(quoteCard.additional_weight_fee_usd) > 0;
  return (
    (quoteCard.main_prc_rates?.length || 0) > 0 ||
    toNumber(quoteCard.per_kg_usd) > 0 ||
    toNumber(quoteCard.per_cbm_usd) > 0 ||
    toNumber(quoteCard.fixed_per_order_usd) > 0 ||
    hasFirstWeightRule
  );
}

function hasProductChoice(quoteCard) {
  if (quoteCard.main_prc_rates?.length) {
    return Boolean(quoteCard.selected_product_code || quoteCard.available_product_codes?.length);
  }
  return true;
}

function hasTailRecognition(quoteCard) {
  return Boolean((quoteCard.tail_delivery_matrix?.entries?.length || 0) > 0 || toNumber(quoteCard.last_mile_delivery_usd) > 0);
}

function hasPostalLookup(quoteCard) {
  return Boolean((quoteCard.postal_zone_map?.entries?.length || 0) > 0 && (quoteCard.tail_delivery_matrix?.entries?.length || 0) > 0);
}

function hasPrcHandlingTiers(quoteCard) {
  if (!isPrcCompositeQuote(quoteCard)) {
    return true;
  }
  return Boolean((quoteCard.handling_fee_tiers?.length || 0) > 0);
}

function isQuoteExpired(quoteCard) {
  return Boolean(quoteCard.valid_to) && quoteCard.valid_to < todayString();
}

function isExtractedQuote(quoteCard) {
  return ["ai_extracted", "rule_extracted", "csv_imported", "json_imported"].includes(quoteCard.source);
}

function isPrcCompositeQuote(quoteCard) {
  return (quoteCard.main_prc_rates?.length || 0) > 0;
}

export function isSupportOnlyQuoteCard(quoteCard) {
  const name = `${quoteCard?.quote_name || ""} ${quoteCard?.forwarder_name || ""}`;
  return SUPPORT_ONLY_QUOTE_PATTERNS.some((pattern) => pattern.test(name));
}

function modeToFulfillmentMode(mode) {
  if (mode === "air_direct_mail") {
    return "china_direct_mail_air";
  }
  if (mode === "sea_bulk") {
    return "china_direct_mail_sea";
  }
  if (mode === "mercado_livre_full") {
    return "mercado_livre_full";
  }
  if (mode === "shopee_3pf") {
    return "shopee_3pf";
  }
  return "brazil_local_3pf";
}

function findPrCMainRate(quoteCard, productCode) {
  return quoteCard.main_prc_rates.find((item) => item.product_code === productCode) || quoteCard.main_prc_rates[0] || null;
}

function findHandlingTier(quoteCard, weightKg) {
  return quoteCard.handling_fee_tiers.find((item) => weightKg >= Number(item.min_weight_kg || 0) && weightKg <= Number(item.max_weight_kg || Number.MAX_SAFE_INTEGER)) || null;
}

function findTailDeliveryEntry(quoteCard, zone, weightKg) {
  return quoteCard.tail_delivery_matrix.entries.find((item) => {
    const minWeight = Number(item.min_weight_kg || 0);
    const maxWeight = Number(item.max_weight_kg || Number.MAX_SAFE_INTEGER);
    return item.zone === zone && weightKg >= minWeight && weightKg <= maxWeight;
  }) || null;
}

function hasBrokenTailWeightBands(quoteCard) {
  return Array.isArray(quoteCard.tail_delivery_matrix?.entries)
    && quoteCard.tail_delivery_matrix.entries.some((entry) =>
      entry
      && entry.zone
      && entry.fee_cny !== undefined
      && (entry.min_weight_kg === undefined || entry.max_weight_kg === undefined)
    );
}

export function getQuoteModeLabel(mode) {
  return Object.fromEntries(QUOTE_MODE_OPTIONS)[mode] ?? mode;
}

export function getQuoteStatusLabel(status) {
  return Object.fromEntries(QUOTE_STATUS_OPTIONS)[status] ?? status;
}

export function getQuoteSourceLabel(source) {
  return Object.fromEntries(QUOTE_SOURCE_OPTIONS)[source] ?? source;
}

export function createEmptyQuoteCard(overrides = {}) {
  const now = nowIsoString();
  return normalizeQuoteCard({
    ...QUOTE_CARD_TEMPLATE,
    quote_id: createQuoteId(),
    created_at: now,
    updated_at: now,
    source: "manual",
    ...overrides
  });
}

function validateRequiredFields(quoteCard) {
  const missingFields = [];

  for (const key of ["quote_name", "forwarder_name", "mode", "country", "currency", "billing_method"]) {
    if (!quoteCard[key]) {
      missingFields.push(key);
    }
  }

  if (quoteCard.mode === "air_direct_mail") {
    if (!toNumber(quoteCard.volumetric_divisor)) {
      missingFields.push("volumetric_divisor");
    }
    if (isPrcCompositeQuote(quoteCard)) {
      return missingFields;
    }
    const hasPerKg = toNumber(quoteCard.per_kg_usd) > 0;
    const hasFirstAdditional =
      toNumber(quoteCard.first_weight_kg) > 0 &&
      toNumber(quoteCard.first_weight_fee_usd) > 0 &&
      toNumber(quoteCard.additional_weight_unit_kg) > 0 &&
      toNumber(quoteCard.additional_weight_fee_usd) > 0;
    if (!hasPerKg && !hasFirstAdditional) {
      missingFields.push("per_kg_usd|first_weight_rule");
    }
  }

  if (quoteCard.mode === "sea_bulk") {
    if (!(toNumber(quoteCard.per_cbm_usd) > 0 || toNumber(quoteCard.fixed_per_order_usd) > 0)) {
      missingFields.push("per_cbm_usd|fixed_per_order_usd");
    }
  }

  if (["brazil_local_3pf", "shopee_3pf", "mercado_livre_full"].includes(quoteCard.mode)) {
    if (
      !(
        toNumber(quoteCard.fixed_per_order_usd) > 0 ||
        toNumber(quoteCard.pick_pack_base_fee_usd) > 0 ||
        toNumber(quoteCard.last_mile_delivery_usd) > 0
      )
    ) {
      missingFields.push("fixed_per_order_usd|pick_pack_base_fee_usd|last_mile_delivery_usd");
    }
  }

  return missingFields;
}

export function validateQuoteCard(rawQuoteCard) {
  const quoteCard = {
    ...QUOTE_CARD_TEMPLATE,
    ...rawQuoteCard
  };

  const missing_fields = validateRequiredFields(quoteCard);
  const risk_fields = [];

  if (!quoteCard.valid_from) {
    risk_fields.push("valid_from");
  }
  if (!quoteCard.valid_to) {
    risk_fields.push("valid_to");
  }

  const is_expired = Boolean(quoteCard.valid_to) && quoteCard.valid_to < todayString();
  let suggested_status = quoteCard.status || "draft";

  if (quoteCard.status === "disabled") {
    suggested_status = "disabled";
  } else if (is_expired) {
    suggested_status = "expired";
  } else if (quoteCard.status === "confirmed" && quoteCard.confirmed_at) {
    suggested_status = "confirmed";
  } else if (missing_fields.length > 0) {
    suggested_status = "needs_review";
  }

  if (quoteCard.status === "confirmed" && missing_fields.length > 0) {
    risk_fields.push("confirmed_demoted");
  }

  if (quoteCard.confidence_summary?.overall === "low") {
    risk_fields.push("low_confidence");
  }

  const extracted = isExtractedQuote(quoteCard);

  return {
    missing_fields,
    risk_fields,
    is_expired,
    can_confirm: missing_fields.length === 0 && !is_expired,
    can_formally_participate: missing_fields.length === 0 && suggested_status === "confirmed",
    suggested_status,
    extracted
  };
}

export function getUserFacingAvailability(quoteCard) {
  const hasMain = hasMainFreight(quoteCard);
  const hasCurrency = Boolean(quoteCard.currency);
  const hasProduct = hasProductChoice(quoteCard);
  const tailRecognized = hasTailRecognition(quoteCard);
  const postalLookupAvailable = hasPostalLookup(quoteCard);
  const prcHandlingRecognized = hasPrcHandlingTiers(quoteCard);
  const taxModeClear = Boolean(quoteCard.tax_mode);
  const expired = isQuoteExpired(quoteCard);

  const blockers = [];
  const reviewRisks = [];
  const infoNotes = [];

  if (isSupportOnlyQuoteCard(quoteCard)) {
    blockers.push("这张数据是辅助表，不是可直接测算的物流报价。");
  }

  if (!hasMain) {
    blockers.push("缺少主运费，暂时无法计算。");
  }
  if (!hasCurrency) {
    blockers.push("缺少币种，暂时无法换算。");
  }
  if (!hasProduct) {
    blockers.push("缺少可用产品代码或报价方案。");
  }
  if (!prcHandlingRecognized) {
    blockers.push("当前 PRC 报价缺少处理费重量段，请重新导入或重新识别报价。");
  }

  if (quoteCard.tail_cost_strategy === "manual_input" && toNumber(quoteCard.manual_tail_cost_usd) <= 0) {
    blockers.push("你选择了手动输入尾程费，但还没有填写金额。");
  }
  if (quoteCard.tax_mode === "manual_tax_input" && toNumber(quoteCard.manual_tax_usd) <= 0) {
    blockers.push("你选择了手动输入税费，但还没有填写金额。");
  }
  if (quoteCard.tail_cost_strategy === "cep_lookup" && !postalLookupAvailable) {
    blockers.push("当前报价没有可用的邮编匹配能力，不能使用 CEP 自动匹配。");
  }

  if (!tailRecognized) {
    reviewRisks.push("尾程费用还不明确，建议先试算，再补充尾程信息。");
  }
  if (!quoteCard.valid_to) {
    reviewRisks.push("报价有效期未识别，正式下单前建议向货代确认。");
  } else if (expired) {
    reviewRisks.push("报价已过期，仅建议用于参考或试算。");
  }
  if (quoteCard.restriction_notes?.length) {
    reviewRisks.push("系统识别到禁运或限制说明，正式发货前建议向货代书面确认。");
  }
  if (!taxModeClear) {
    reviewRisks.push("税费规则还不明确，建议先选择系统默认税费公式。");
  }

  if ((quoteCard.tail_delivery_matrix?.entries?.length || 0) > 0) {
    infoNotes.push("已识别尾程价格表。");
  }
  if ((quoteCard.postal_zone_map?.entries?.length || 0) > 0) {
    infoNotes.push("已识别邮编自动匹配能力。");
  }
  if (["ai_extracted", "rule_extracted"].includes(quoteCard.source)) {
    infoNotes.push("这张报价来自系统识别结果，已经自动整理成可复用报价。");
  }

  let label = "可正式测算";
  let reason = "关键费用已基本齐全，可以用于正式定价测算。";

  if (blockers.length > 0) {
    label = "不可用";
    reason = blockers[0];
  } else if (!tailRecognized || quoteCard.tax_mode === "skip_tax" || quoteCard.tail_cost_strategy === "skip_for_trial" || expired) {
    label = "可试算";
    reason = "当前主报价可用，但部分费用需要估算或暂未计入，适合先做试算。";
  }

  return {
    label,
    reason,
    blockers,
    reviewRisks,
    infoNotes,
    can_formal: label === "可正式测算",
    can_trial: label !== "不可用",
    postalLookupAvailable,
    tailRecognized,
    hasMain,
    hasCurrency,
    hasProduct
  };
}

export function normalizeQuoteCard(rawQuoteCard) {
  const now = nowIsoString();
  const quoteCard = {
    ...QUOTE_CARD_TEMPLATE,
    ...rawQuoteCard
  };

  for (const key of Object.keys(quoteCard)) {
    if (
      key.endsWith("_usd") ||
      key.endsWith("_rate") ||
      key.endsWith("_kg") ||
      key.endsWith("_cbm") ||
      key === "volumetric_divisor" ||
      key === "version"
    ) {
      quoteCard[key] = toNumber(quoteCard[key], key === "version" ? 1 : 0);
    }
  }

  quoteCard.quote_id = quoteCard.quote_id || createQuoteId();
  quoteCard.source = quoteCard.source || "manual";
  quoteCard.version = Math.max(1, toNumber(quoteCard.version, 1));
  quoteCard.confidence_summary = normalizeConfidenceSummary(quoteCard.confidence_summary);
  quoteCard.questions_for_user = normalizeQuestionsForUser(
    quoteCard.questions_for_user,
    ["ai_extracted", "rule_extracted"].includes(quoteCard.source)
  );
  quoteCard.created_at = quoteCard.created_at || now;
  quoteCard.updated_at = now;
  quoteCard.imported_at = quoteCard.imported_at || (quoteCard.source !== "manual" ? now : "");
  quoteCard.confirmed_by = quoteCard.confirmed_by || "";
  quoteCard.confirmed_at = quoteCard.confirmed_at || "";
  if (quoteCard.status === "confirmed" && !quoteCard.confirmed_at) {
    quoteCard.confirmed_at = quoteCard.imported_at || quoteCard.created_at || now;
  }
  quoteCard.parent_quote_id = quoteCard.parent_quote_id || "";
  quoteCard.available_product_codes = Array.isArray(quoteCard.available_product_codes) ? quoteCard.available_product_codes : [];
  quoteCard.main_prc_rates = Array.isArray(quoteCard.main_prc_rates) ? quoteCard.main_prc_rates : [];
  quoteCard.handling_fee_tiers = Array.isArray(quoteCard.handling_fee_tiers) ? quoteCard.handling_fee_tiers : [];
  quoteCard.tail_delivery_matrix = {
    zones: Array.isArray(quoteCard.tail_delivery_matrix?.zones) ? quoteCard.tail_delivery_matrix.zones : [],
    weight_columns: Array.isArray(quoteCard.tail_delivery_matrix?.weight_columns) ? quoteCard.tail_delivery_matrix.weight_columns : [],
    entries: Array.isArray(quoteCard.tail_delivery_matrix?.entries) ? quoteCard.tail_delivery_matrix.entries : []
  };
  quoteCard.postal_zone_map = {
    entries: Array.isArray(quoteCard.postal_zone_map?.entries) ? quoteCard.postal_zone_map.entries : []
  };
  quoteCard.restriction_notes = Array.isArray(quoteCard.restriction_notes) ? quoteCard.restriction_notes : [];

  if (quoteCard.postal_zone_map.entries.length > 10) {
    quoteCard.postal_zone_map.entries = quoteCard.postal_zone_map.entries.map((entry) => ({
      postcode_start: entry.postcode_start,
      postcode_end: entry.postcode_end,
      zone: entry.zone,
      state_code: entry.state_code || ""
    }));
  }

  const validation = validateQuoteCard(quoteCard);
  quoteCard.status = validation.suggested_status;
  quoteCard.validation = validation;
  quoteCard.review_level = deriveReviewLevel(quoteCard, validation);
  quoteCard.can_participate_in_calculation = quoteCard.status !== "disabled";

  return quoteCard;
}

export function buildQuoteCardSummary(quoteCard) {
  if (isPrcCompositeQuote(quoteCard)) {
    return quoteCard.main_prc_rates.map((item) => `${item.product_code}:${item.per_kg_cny} CNY/kg`).join("；") || "PRC 复合报价";
  }
  if (quoteCard.billing_method === "per_kg") {
    return `${quoteCard.base_fee_usd || 0} + ${quoteCard.per_kg_usd || 0}/kg`;
  }
  if (quoteCard.billing_method === "first_weight_additional_weight") {
    return `${quoteCard.first_weight_fee_usd || 0} / ${quoteCard.first_weight_kg || 0}kg 起`;
  }
  if (quoteCard.billing_method === "per_cbm") {
    return `${quoteCard.per_cbm_usd || 0}/CBM`;
  }
  if (quoteCard.billing_method === "fixed_per_order" || quoteCard.billing_method === "local_3pf_fee") {
    return `固定 ${quoteCard.fixed_per_order_usd || 0} USD/单`;
  }
  return "待补充";
}

export function buildNextVersionQuoteCard(quoteCard) {
  return createEmptyQuoteCard({
    ...quoteCard,
    quote_id: "",
    status: "draft",
    version: Math.max(1, toNumber(quoteCard.version, 1)) + 1,
    parent_quote_id: quoteCard.quote_id,
    confirmed_at: "",
    confirmed_by: "",
    imported_at: "",
    notes: quoteCard.notes ? `${quoteCard.notes}\n\n复制为新版本。` : "复制为新版本。"
  });
}

export function findNewerVersion(quoteCards, quoteCard) {
  return quoteCards.find((item) =>
    item.forwarder_name === quoteCard.forwarder_name &&
    item.quote_name === quoteCard.quote_name &&
    item.mode === quoteCard.mode &&
    item.version > quoteCard.version &&
    item.status !== "disabled"
  ) || null;
}

export function normalizeAiImportPayload(rawPayload) {
  const payload = rawPayload || {};
  if (!Array.isArray(payload.quote_cards)) {
    throw new Error("AI 解析结果缺少 quote_cards 数组。");
  }

  const now = nowIsoString();
  const globalWarnings = Array.isArray(payload.global_warnings) ? payload.global_warnings : [];
  const commonQuestions = normalizeQuestionsForUser(payload.questions_for_user, true);

  const quote_cards = payload.quote_cards.map((item) =>
    normalizeQuoteCard({
      ...item,
      source: item.source || "ai_extracted",
      status: "needs_review",
      imported_at: item.imported_at || now,
      quote_id: item.quote_id || createQuoteId(),
      confidence_summary: normalizeConfidenceSummary(item.confidence_summary),
      questions_for_user: normalizeQuestionsForUser(
        item.questions_for_user && item.questions_for_user.length ? item.questions_for_user : commonQuestions,
        true
      )
    })
  );

  return {
    quote_cards,
    global_warnings: globalWarnings,
    questions_for_user: commonQuestions,
    safe_to_import: payload.safe_to_import !== false
  };
}

export function evaluateQuoteConfirmation(quoteCard, answers) {
  const normalized = normalizeQuoteCard({
    ...quoteCard,
    questions_for_user: normalizeQuestionsForUser(
      answers || quoteCard.questions_for_user,
      ["ai_extracted", "rule_extracted"].includes(quoteCard.source)
    )
  });
  const availability = getUserFacingAvailability(normalized);
  const unansweredRequired = [];
  const blockingIssues = [];
  blockingIssues.push(...availability.blockers);

  return {
    quoteCard: normalized,
    unansweredRequired,
    blockingIssues,
    can_confirm: availability.can_formal,
    can_trial: availability.can_trial,
    has_low_confidence: normalized.confidence_summary.overall === "low" || normalized.confidence_summary.low_confidence_fields.length > 0,
    availability
  };
}

export function confirmQuoteCard(quoteCard, { confirmedBy = "local_user", answers = [] } = {}) {
  const evaluation = evaluateQuoteConfirmation(quoteCard, answers);
  if (!evaluation.can_trial) {
    return normalizeQuoteCard({
      ...evaluation.quoteCard,
      status: evaluation.quoteCard.status === "expired" ? "expired" : "needs_review"
    });
  }

  return normalizeQuoteCard({
    ...evaluation.quoteCard,
    source: evaluation.quoteCard.source,
    status: "confirmed",
    confirmed_at: nowIsoString(),
    confirmed_by: confirmedBy || "local_user"
  });
}

export function getQuoteReviewSummary(quoteCard) {
  const evaluation = evaluateQuoteConfirmation(quoteCard, quoteCard.questions_for_user);
  const availability = getUserFacingAvailability(quoteCard);

  return {
    review_label: availability.label,
    blocking_issues: evaluation.blockingIssues,
    review_count: evaluation.unansweredRequired.length,
    is_extracted: isExtractedQuote(quoteCard),
    reason: availability.reason
  };
}

export function calculateFreightFromQuoteCard(sku, rawQuoteCard, options = {}) {
  const quoteCard = normalizeQuoteCard(rawQuoteCard);
  const warnings = [];
  const volume_weight_kg =
    (toNumber(sku.length_cm) * toNumber(sku.width_cm) * toNumber(sku.height_cm)) /
    Math.max(1, toNumber(quoteCard.volumetric_divisor || DEFAULTS.direct_mail.volumetric_divisor));
  const unit_cbm =
    (toNumber(sku.length_cm) * toNumber(sku.width_cm) * toNumber(sku.height_cm)) / 1000000;
  const chargeable_weight_kg = Math.max(toNumber(sku.actual_weight_kg), volume_weight_kg);

  if (quoteCard.source === "ai_extracted" && quoteCard.status !== "confirmed") {
    warnings.push({
      code: "AI_EXTRACTED_NEEDS_CONFIRMATION",
      severity: "warning",
      message: "AI 解析的报价卡需要人工确认后才能正式使用。"
    });
  }
  if (quoteCard.source === "rule_extracted" && quoteCard.status !== "confirmed") {
    warnings.push({
      code: "RULE_EXTRACTED_NEEDS_CONFIRMATION",
      severity: "warning",
      message: "本地规则识别生成的报价卡需要人工确认。"
    });
  }
  if (["ai_extracted", "rule_extracted"].includes(quoteCard.source) && quoteCard.status !== "confirmed") {
    warnings.push({
      code: "QUOTE_SOURCE_NOT_MANUAL",
      severity: "warning",
      message: "该报价来自规则或 AI 识别，需人工复核。"
    });
  }
  if (quoteCard.confidence_summary.overall === "low" || quoteCard.confidence_summary.low_confidence_fields.length > 0) {
    warnings.push({
      code: "QUOTE_AI_LOW_CONFIDENCE",
      severity: "warning",
      message: "AI 解析置信度偏低，建议重点复核关键价格字段。"
    });
  }
  if (quoteCard.status === "needs_review" || quoteCard.status === "draft") {
    warnings.push({
      code: "QUOTE_NEEDS_REVIEW",
      severity: "warning",
      message: "报价卡尚未确认，当前结果仅供试算参考。"
    });
  }
  if (quoteCard.status === "expired") {
    warnings.push({
      code: "QUOTE_EXPIRED",
      severity: "warning",
      message: "报价卡已过期，请尽快向货代复核最新价格。"
    });
  }
  if (quoteCard.validation.missing_fields.length > 0) {
    warnings.push({
      code: "QUOTE_KEY_FIELD_MISSING",
      severity: "warning",
      message: `报价卡缺少关键字段：${quoteCard.validation.missing_fields.join("、")}。`
    });
  }
  if (hasBrokenTailWeightBands(quoteCard)) {
    warnings.push({
      code: "QUOTE_TAIL_MATRIX_NEEDS_REIMPORT",
      severity: "warning",
      message: "这张报价卡的尾程重量档已损坏，需重新上传 Excel 并重新生成报价卡。"
    });
  }

  let freight_usd = 0;
  let freight_method = `${quoteCard.mode}:${quoteCard.billing_method}`;
  let matched_postal_zone = null;
  let matched_tail_delivery_entry = null;
  let prc_components = null;

  if (quoteCard.main_prc_rates.length > 0) {
    const selectedProductCode = inferSelectedProductCode(sku, quoteCard);
    const mainRate = findPrCMainRate(quoteCard, selectedProductCode);
    const handlingTier = findHandlingTier(quoteCard, chargeable_weight_kg);
    const tailZoneMode = sku.tail_zone_mode || quoteCard.tail_zone_mode || "cep_lookup";
    let zone = sku.manual_tail_zone || "";

    if (tailZoneMode === "cep_lookup" && sku.destination_cep && quoteCard.postal_zone_map.entries.length > 0) {
      const lookup = lookupBrazilPostalZone(sku.destination_cep, quoteCard.postal_zone_map);
      if (lookup.found) {
        matched_postal_zone = lookup;
        zone = lookup.zone;
      } else {
        warnings.push({
          code: lookup.warning || "CEP_NOT_FOUND_IN_ZONE_MAP",
          severity: "warning",
          message: "未找到该 CEP 对应区域，请检查 CEP 或手动选择区域。"
        });
      }
    }

    if (tailZoneMode === "cep_lookup" && !sku.destination_cep) {
      warnings.push({
        code: "CEP_NOT_PROVIDED",
        severity: "info",
        message: "未输入 CEP，当前尾程区域为手动估算。"
      });
    }

    if (zone) {
      matched_tail_delivery_entry = findTailDeliveryEntry(quoteCard, zone, chargeable_weight_kg);
    }

    const mainRateCnyPerKg = Number(mainRate?.per_kg_cny || mainRate?.per_kg || 0);
    const handlingFeeCny = Number(handlingTier?.fee_cny || 0);
    const tailFeeCny = Number(matched_tail_delivery_entry?.fee_cny || 0);
    const cnyToUsd = Number(sku.cny_to_usd || options.cny_to_usd || 0);
    const mainFreightCny = mainRateCnyPerKg * chargeable_weight_kg;

    freight_usd = (mainFreightCny + handlingFeeCny + tailFeeCny) * cnyToUsd;
    freight_method = "prc_package";
    prc_components = {
      product_code: selectedProductCode,
      main_freight_cny: Number(mainFreightCny.toFixed(4)),
      handling_fee_cny: Number(handlingFeeCny.toFixed(4)),
      tail_fee_cny: Number(tailFeeCny.toFixed(4)),
      cny_to_usd: cnyToUsd
    };
  } else if (quoteCard.mode === "air_direct_mail" && quoteCard.billing_method === "per_kg") {
    freight_usd = toNumber(quoteCard.base_fee_usd) + chargeable_weight_kg * toNumber(quoteCard.per_kg_usd);
    if (quoteCard.min_charge_usd > 0) {
      freight_usd = Math.max(quoteCard.min_charge_usd, freight_usd);
    }
    if (quoteCard.fuel_surcharge_rate > 0) {
      freight_usd = freight_usd * (1 + quoteCard.fuel_surcharge_rate);
    }
    freight_usd +=
      quoteCard.remote_area_surcharge_usd +
      quoteCard.customs_clearance_fee_usd +
      quoteCard.sensitive_goods_surcharge_usd +
      quoteCard.battery_surcharge_usd;
  } else if (quoteCard.mode === "air_direct_mail" && quoteCard.billing_method === "first_weight_additional_weight") {
    if (chargeable_weight_kg <= quoteCard.first_weight_kg) {
      freight_usd = quoteCard.first_weight_fee_usd;
    } else {
      const extra_weight = chargeable_weight_kg - quoteCard.first_weight_kg;
      const extra_units = Math.ceil(extra_weight / Math.max(quoteCard.additional_weight_unit_kg, 0.0001));
      freight_usd = quoteCard.first_weight_fee_usd + extra_units * quoteCard.additional_weight_fee_usd;
    }
    if (quoteCard.fuel_surcharge_rate > 0) {
      freight_usd = freight_usd * (1 + quoteCard.fuel_surcharge_rate);
    }
    freight_usd +=
      quoteCard.remote_area_surcharge_usd +
      quoteCard.customs_clearance_fee_usd +
      quoteCard.sensitive_goods_surcharge_usd +
      quoteCard.battery_surcharge_usd;
  } else if (quoteCard.mode === "sea_bulk" && quoteCard.billing_method === "per_cbm") {
    freight_usd = unit_cbm * quoteCard.per_cbm_usd;
    if (quoteCard.min_charge_usd > 0) {
      if (options.estimated_units_in_batch) {
        freight_usd = Math.max(freight_usd, quoteCard.min_charge_usd / options.estimated_units_in_batch);
      } else {
        warnings.push({
          code: "SEA_MIN_CHARGE_NEEDS_BATCH_SIZE",
          severity: "warning",
          message: "海运最低收费需要输入批量件数，当前只能粗估。"
        });
      }
    }
    warnings.push({
      code: "SEA_MODE_IS_BULK_ESTIMATION",
      severity: "info",
      message: "海运适合批量备货摊销，单件测算只能作为估算。"
    });
  } else if (quoteCard.mode === "sea_bulk" && quoteCard.billing_method === "fixed_per_order") {
    freight_usd = quoteCard.fixed_per_order_usd || 0;
    warnings.push({
      code: "SEA_MODE_IS_BULK_ESTIMATION",
      severity: "info",
      message: "海运适合批量备货摊销，单件测算只能作为估算。"
    });
  } else if (
    ["brazil_local_3pf", "mercado_livre_full", "shopee_3pf"].includes(quoteCard.mode) &&
    ["fixed_per_order", "local_3pf_fee"].includes(quoteCard.billing_method)
  ) {
    freight_usd = quoteCard.fixed_per_order_usd || 0;
  } else {
    warnings.push({
      code: "FREIGHT_RATE_NOT_FOUND",
      severity: "warning",
      message: "没有找到可执行的报价规则，请检查报价卡模式和计费方式。"
    });
  }

  return {
    freight_usd: roundValue(freight_usd),
    chargeable_weight_kg: roundValue(chargeable_weight_kg),
    volume_weight_kg: roundValue(volume_weight_kg),
    unit_cbm: roundValue(unit_cbm),
    matched_quote_id: quoteCard.quote_id,
    freight_method,
    warnings,
    needs_review: quoteCard.status !== "confirmed",
    quote_status: quoteCard.status,
    quote_name: quoteCard.quote_name,
    forwarder_name: quoteCard.forwarder_name,
    matched_postal_zone,
    matched_tail_delivery_entry,
    prc_components,
    mapped_local_costs: {
      storage_fee_usd_per_unit_month: quoteCard.storage_fee_usd_per_unit_month,
      inbound_fee_usd_per_unit: quoteCard.inbound_fee_usd_per_unit,
      pick_pack_base_fee_usd:
        quoteCard.pick_pack_base_fee_usd || quoteCard.fixed_per_order_usd || DEFAULTS.local_warehouse.pick_pack_base_fee_usd,
      pick_fee_usd_per_item: quoteCard.pick_fee_usd_per_item,
      local_packaging_cost_usd: quoteCard.local_packaging_cost_usd,
      last_mile_delivery_usd: quoteCard.last_mile_delivery_usd
    }
  };
}

export function applyQuoteCardToPayload(basePayload, quoteCard, freightResult) {
  const normalizedQuoteCard = normalizeQuoteCard(quoteCard);
  const resolvedProductCode = inferSelectedProductCode(basePayload, normalizedQuoteCard);
  const nextPayload = {
    ...basePayload,
    fulfillment_mode: modeToFulfillmentMode(normalizedQuoteCard.mode),
    selected_product_code: resolvedProductCode
  };

  if (normalizedQuoteCard.mode === "air_direct_mail") {
    nextPayload.fulfillment_mode = "china_direct_mail_air";
    nextPayload.air_freight_usd_per_kg =
      freightResult.chargeable_weight_kg > 0 ? freightResult.freight_usd / freightResult.chargeable_weight_kg : 0;
    nextPayload.volumetric_divisor = normalizedQuoteCard.volumetric_divisor || nextPayload.volumetric_divisor;
  }

  if (normalizedQuoteCard.mode === "sea_bulk") {
    const chargeableCbm = Math.max(
      (toNumber(basePayload.length_cm) * toNumber(basePayload.width_cm) * toNumber(basePayload.height_cm)) / 1000000,
      toNumber(basePayload.actual_weight_kg) /
        Math.max(1, toNumber(basePayload.sea_freight_density_divisor || DEFAULTS.direct_mail.sea_freight_density_divisor))
    ) || 0;
    nextPayload.fulfillment_mode = "china_direct_mail_sea";
    nextPayload.sea_freight_usd_per_cbm = chargeableCbm > 0 ? freightResult.freight_usd / chargeableCbm : 0;
  }

  if (["brazil_local_3pf", "mercado_livre_full", "shopee_3pf"].includes(normalizedQuoteCard.mode)) {
    nextPayload.local_warehouse_enabled = true;
    nextPayload.storage_fee_usd_per_unit_month = freightResult.mapped_local_costs.storage_fee_usd_per_unit_month;
    nextPayload.inbound_fee_usd_per_unit = freightResult.mapped_local_costs.inbound_fee_usd_per_unit;
    nextPayload.pick_pack_base_fee_usd = freightResult.mapped_local_costs.pick_pack_base_fee_usd;
    nextPayload.pick_fee_usd_per_item = freightResult.mapped_local_costs.pick_fee_usd_per_item;
    nextPayload.local_packaging_cost_usd = freightResult.mapped_local_costs.local_packaging_cost_usd;
    nextPayload.last_mile_delivery_usd = freightResult.mapped_local_costs.last_mile_delivery_usd;
  }

  nextPayload.selected_quote_card = {
    quote_id: normalizedQuoteCard.quote_id,
    quote_name: normalizedQuoteCard.quote_name,
    quote_status: normalizedQuoteCard.status,
    forwarder_name: normalizedQuoteCard.forwarder_name,
    freight_method: freightResult.freight_method,
    needs_review: freightResult.needs_review,
    selected_product_code: normalizedQuoteCard.selected_product_code,
    tax_mode: normalizedQuoteCard.tax_mode,
    manual_tax_usd: normalizedQuoteCard.manual_tax_usd,
    tail_cost_strategy: normalizedQuoteCard.tail_cost_strategy,
    manual_tail_cost_usd: normalizedQuoteCard.manual_tail_cost_usd
  };

  nextPayload.tax_mode = normalizedQuoteCard.tax_mode || nextPayload.tax_mode;
  nextPayload.use_forwarder_tax_service_fee = normalizedQuoteCard.use_forwarder_tax_service_fee;
  nextPayload.tail_zone_mode = normalizedQuoteCard.tail_zone_mode || nextPayload.tail_zone_mode;
  if (toNumber(normalizedQuoteCard.manual_tail_cost_usd) > 0) {
    nextPayload.last_mile_delivery_usd = normalizedQuoteCard.manual_tail_cost_usd;
  }

  return nextPayload;
}
