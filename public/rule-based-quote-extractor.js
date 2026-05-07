import { createEmptyQuoteCard } from "./quote-cards.js";

function detectCurrency(text) {
  if (/USD|US\$/i.test(text)) {
    return "USD";
  }
  if (/RMB|CNY/i.test(text)) {
    return "CNY";
  }
  if (/BRL|R\$/i.test(text)) {
    return "BRL";
  }
  return "";
}

function detectMode(text) {
  if (/Shopee|虾皮/i.test(text)) {
    return "shopee_3pf";
  }
  if (/Mercado Livre|ML|美客多|Full/i.test(text)) {
    return "mercado_livre_full";
  }
  if (/3PF|本地仓|仓储|尾程|派送/i.test(text)) {
    return "brazil_local_3pf";
  }
  if (/海运|sea|LCL|拼箱|整柜|CBM|RT/i.test(text)) {
    return "sea_bulk";
  }
  if (/空运|air|小包|packet|专线|快递/i.test(text)) {
    return "air_direct_mail";
  }
  return "air_direct_mail";
}

function detectBillingMethod(text) {
  if (/首重|续重/i.test(text)) {
    return "first_weight_additional_weight";
  }
  if (/CBM|每方|立方|RT/i.test(text)) {
    return "per_cbm";
  }
  if (/每票|每单|fixed/i.test(text)) {
    return "fixed_per_order";
  }
  if (/仓储|入库|出库|拣货|尾程/i.test(text)) {
    return "local_3pf_fee";
  }
  if (/KG|kg|每公斤/i.test(text)) {
    return "per_kg";
  }
  return "per_kg";
}

function extractFirstNumber(text) {
  const match = text.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function maybeUsdValue(value, currency, rates, warnings) {
  if (value === null || value === undefined) {
    return null;
  }
  if (!currency || currency === "USD") {
    return value;
  }
  if (currency === "CNY" && rates.cny_to_usd) {
    warnings.push({
      code: "NON_USD_QUOTE_CURRENCY",
      severity: "warning",
      message: "报价原币种不是 USD，已按当前汇率换算，需人工确认。"
    });
    return Number((value * rates.cny_to_usd).toFixed(4));
  }
  if (currency === "BRL" && rates.brl_to_usd) {
    warnings.push({
      code: "NON_USD_QUOTE_CURRENCY",
      severity: "warning",
      message: "报价原币种不是 USD，已按当前汇率换算，需人工确认。"
    });
    return Number((value * rates.brl_to_usd).toFixed(4));
  }
  return value;
}

function defaultQuestions() {
  return [
    "这份报价是否发往巴西？",
    "这是空运、海运还是 3PF 报价？",
    "该报价是否包含巴西本地尾程派送？",
    "该报价是否包含清关费？",
    "该报价是否包含进口税？",
    "该报价是否适用于我们的产品类型？",
    "是否有敏感货附加费？",
    "是否有电池附加费？",
    "是否有偏远地区附加费？",
    "报价有效期是否正确？",
    "报价币种是否正确？"
  ].map((question) => ({ question, answer: "", required: true }));
}

function fieldMatch(rowText, patterns) {
  return patterns.some((pattern) => pattern.test(rowText));
}

function setFieldIfNumber(target, field, rowText, currency, rates, warnings) {
  const value = extractFirstNumber(rowText);
  if (value !== null) {
    target[field] = maybeUsdValue(value, currency, rates, warnings);
  }
}

export function ruleBasedQuoteExtractor(workbookData, options = {}) {
  const selectedSheets = workbookData.sheets.filter((sheet) => !options.selectedSheetNames || options.selectedSheetNames.includes(sheet.name));
  const quote_cards = [];
  const extracted_fields = [];
  const missing_fields = [];
  const warnings = [...(workbookData.warnings || [])];
  const rates = {
    cny_to_usd: Number(options.cny_to_usd || 0),
    brl_to_usd: Number(options.brl_to_usd || 0)
  };

  for (const sheet of selectedSheets) {
    const fullText = sheet.rows.map((row) => row.text).join("\n");
    const currency = detectCurrency(fullText) || "USD";
    const mode = detectMode(fullText);
    const billing_method = detectBillingMethod(fullText);
    const quoteCard = createEmptyQuoteCard({
      quote_name: `${workbookData.fileName} - ${sheet.name}`,
      forwarder_name: sheet.name,
      mode,
      country: /巴西|Brazil|Brasil|BR/i.test(fullText) ? "Brazil" : "待确认",
      currency,
      billing_method,
      source: "rule_extracted",
      status: "needs_review",
      original_file_name: workbookData.fileName,
      original_text_excerpt: sheet.rows.slice(0, 8).map((row) => row.text).join("\n"),
      imported_at: workbookData.generatedAt,
      questions_for_user: defaultQuestions(),
      notes: "由前端 Excel 预处理器和本地规则识别生成，需人工确认。"
    });

    for (const row of sheet.rows) {
      const text = row.text;
      if (fieldMatch(text, [/USD\/kg|US\$\/KG|RMB\/kg|CNY\/kg|每公斤|kg/i])) {
        setFieldIfNumber(quoteCard, "per_kg_usd", text, currency, rates, warnings);
        extracted_fields.push("per_kg_usd");
      }
      if (fieldMatch(text, [/CBM|每方|立方|RT/i])) {
        setFieldIfNumber(quoteCard, "per_cbm_usd", text, currency, rates, warnings);
        extracted_fields.push("per_cbm_usd");
      }
      if (fieldMatch(text, [/体积重|材积|抛重|6000|5000/i]) && !quoteCard.volumetric_divisor) {
        const value = extractFirstNumber(text);
        if (value) {
          quoteCard.volumetric_divisor = value;
          extracted_fields.push("volumetric_divisor");
        }
      }
      if (fieldMatch(text, [/最低收费|min charge/i])) {
        setFieldIfNumber(quoteCard, "min_charge_usd", text, currency, rates, warnings);
        extracted_fields.push("min_charge_usd");
      }
      if (fieldMatch(text, [/基础费|base fee/i])) {
        setFieldIfNumber(quoteCard, "base_fee_usd", text, currency, rates, warnings);
        extracted_fields.push("base_fee_usd");
      }
      if (fieldMatch(text, [/首重/i])) {
        const numbers = text.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
        if (numbers[0]) {
          quoteCard.first_weight_kg = numbers[0];
        }
        if (numbers[1]) {
          quoteCard.first_weight_fee_usd = maybeUsdValue(numbers[1], currency, rates, warnings);
        }
        extracted_fields.push("first_weight_rule");
      }
      if (fieldMatch(text, [/续重/i])) {
        const numbers = text.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
        if (numbers[0]) {
          quoteCard.additional_weight_unit_kg = numbers[0];
        }
        if (numbers[1]) {
          quoteCard.additional_weight_fee_usd = maybeUsdValue(numbers[1], currency, rates, warnings);
        }
        extracted_fields.push("additional_weight_rule");
      }
      if (fieldMatch(text, [/燃油/i])) {
        const value = extractFirstNumber(text);
        if (value !== null) {
          quoteCard.fuel_surcharge_rate = value > 1 ? value / 100 : value;
          extracted_fields.push("fuel_surcharge_rate");
        }
      }
      if (fieldMatch(text, [/偏远/i])) {
        setFieldIfNumber(quoteCard, "remote_area_surcharge_usd", text, currency, rates, warnings);
      }
      if (fieldMatch(text, [/清关/i])) {
        setFieldIfNumber(quoteCard, "customs_clearance_fee_usd", text, currency, rates, warnings);
      }
      if (fieldMatch(text, [/敏感货/i])) {
        setFieldIfNumber(quoteCard, "sensitive_goods_surcharge_usd", text, currency, rates, warnings);
      }
      if (fieldMatch(text, [/电池/i])) {
        setFieldIfNumber(quoteCard, "battery_surcharge_usd", text, currency, rates, warnings);
      }
      if (fieldMatch(text, [/每票|每单|fixed/i])) {
        setFieldIfNumber(quoteCard, "fixed_per_order_usd", text, currency, rates, warnings);
      }
      if (fieldMatch(text, [/仓储/i])) {
        setFieldIfNumber(quoteCard, "storage_fee_usd_per_unit_month", text, currency, rates, warnings);
      }
      if (fieldMatch(text, [/入库/i])) {
        setFieldIfNumber(quoteCard, "inbound_fee_usd_per_unit", text, currency, rates, warnings);
      }
      if (fieldMatch(text, [/出库|拣货/i])) {
        setFieldIfNumber(quoteCard, "pick_pack_base_fee_usd", text, currency, rates, warnings);
      }
      if (fieldMatch(text, [/包材/i])) {
        setFieldIfNumber(quoteCard, "local_packaging_cost_usd", text, currency, rates, warnings);
      }
      if (fieldMatch(text, [/尾程|派送/i])) {
        setFieldIfNumber(quoteCard, "last_mile_delivery_usd", text, currency, rates, warnings);
      }
      if (fieldMatch(text, [/有效期|valid|effective/i])) {
        const dates = text.match(/\d{4}[-/]\d{1,2}[-/]\d{1,2}/g) || [];
        if (dates[0]) {
          quoteCard.valid_from = dates[0].replace(/\//g, "-");
        }
        if (dates[1]) {
          quoteCard.valid_to = dates[1].replace(/\//g, "-");
        }
      }
    }

    if (quoteCard.source === "rule_extracted") {
      warnings.push({
        code: "RULE_EXTRACTED_NEEDS_CONFIRMATION",
        severity: "warning",
        message: `Sheet ${sheet.name} 的规则识别结果需要人工确认。`
      });
      warnings.push({
        code: "QUOTE_SOURCE_NOT_MANUAL",
        severity: "warning",
        message: `Sheet ${sheet.name} 的报价草稿来自规则识别，需人工复核。`
      });
    }

    const requiredFields = ["quote_name", "forwarder_name", "mode", "country", "currency", "billing_method"];
    for (const field of requiredFields) {
      if (!quoteCard[field]) {
        missing_fields.push(field);
      }
    }
    if (quoteCard.country === "待确认") {
      missing_fields.push("country");
    }

    quote_cards.push(quoteCard);
  }

  return {
    quote_cards,
    extracted_fields: Array.from(new Set(extracted_fields)),
    missing_fields: Array.from(new Set(missing_fields)),
    warnings,
    confidence: quote_cards.length && missing_fields.length < extracted_fields.length ? "medium" : "low"
  };
}
