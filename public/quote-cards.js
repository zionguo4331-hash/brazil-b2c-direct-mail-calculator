import { DEFAULTS } from "./defaults.js";

export const DEFAULT_CONFIRMATION_QUESTIONS = [
  "这份报价是否发往巴西？",
  "这是空运、海运还是 3PF 报价？",
  "是否包含巴西本地尾程派送？",
  "是否包含清关？",
  "是否包含进口税？",
  "是否适用于我们的产品类型？",
  "是否有敏感货附加费？",
  "是否有电池附加费？",
  "是否有偏远地区附加费？",
  "报价有效期是否正确？",
  "报价币种是否正确？"
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
  } else if (missing_fields.length > 0) {
    suggested_status = "needs_review";
  } else if (quoteCard.status === "confirmed") {
    suggested_status = "confirmed";
  }

  if (quoteCard.status === "confirmed" && missing_fields.length > 0) {
    risk_fields.push("confirmed_demoted");
  }

  if (quoteCard.confidence_summary?.overall === "low") {
    risk_fields.push("low_confidence");
  }

  return {
    missing_fields,
    risk_fields,
    is_expired,
    can_confirm: missing_fields.length === 0 && !is_expired,
    can_formally_participate: missing_fields.length === 0 && suggested_status === "confirmed",
    suggested_status
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
    quoteCard.source === "ai_extracted"
  );
  quoteCard.created_at = quoteCard.created_at || now;
  quoteCard.updated_at = now;
  quoteCard.imported_at = quoteCard.imported_at || (quoteCard.source !== "manual" ? now : "");
  quoteCard.confirmed_by = quoteCard.confirmed_by || "";
  quoteCard.confirmed_at = quoteCard.confirmed_at || "";
  quoteCard.parent_quote_id = quoteCard.parent_quote_id || "";

  const validation = validateQuoteCard(quoteCard);
  if (
    ["ai_extracted", "rule_extracted"].includes(quoteCard.source) &&
    quoteCard.status === "confirmed" &&
    !quoteCard.confirmed_at
  ) {
    quoteCard.status = "needs_review";
  } else {
    quoteCard.status = validation.suggested_status;
  }
  quoteCard.validation = validation;
  quoteCard.can_participate_in_calculation = quoteCard.status !== "disabled";

  return quoteCard;
}

export function buildQuoteCardSummary(quoteCard) {
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
    questions_for_user: normalizeQuestionsForUser(answers || quoteCard.questions_for_user, quoteCard.source === "ai_extracted")
  });
  const unansweredRequired = normalized.questions_for_user.filter((item) => item.required && !["yes", "no"].includes(item.answer));

  return {
    quoteCard: normalized,
    unansweredRequired,
    can_confirm:
      normalized.validation.can_confirm &&
      unansweredRequired.length === 0 &&
      normalized.status !== "expired",
    has_low_confidence: normalized.confidence_summary.overall === "low" || normalized.confidence_summary.low_confidence_fields.length > 0
  };
}

export function confirmQuoteCard(quoteCard, { confirmedBy = "local_user", answers = [] } = {}) {
  const evaluation = evaluateQuoteConfirmation(quoteCard, answers);
  if (!evaluation.can_confirm) {
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

  let freight_usd = 0;
  let freight_method = `${quoteCard.mode}:${quoteCard.billing_method}`;

  if (quoteCard.mode === "air_direct_mail" && quoteCard.billing_method === "per_kg") {
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
  const nextPayload = {
    ...basePayload,
    fulfillment_mode: modeToFulfillmentMode(normalizedQuoteCard.mode)
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
    needs_review: freightResult.needs_review
  };

  return nextPayload;
}
