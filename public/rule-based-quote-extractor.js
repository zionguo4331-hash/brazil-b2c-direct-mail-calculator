import { createEmptyQuoteCard } from "./quote-cards.js";

function detectProductCodes(text) {
  return Array.from(new Set((text.match(/BR\d{4}/g) || [])));
}

function parsePostalZoneRows(rows) {
  const entries = [];
  for (const row of rows) {
    const text = row.text;
    const matches = text.match(/\d{5}-?\d{3}|\d{8}/g) || [];
    if (matches.length >= 2) {
      const zoneMatch = text.match(/\b[A-Z]{2}-(?:CAP|INT\d?)\b/i);
      entries.push({
        postcode_start: Number(matches[0].replace(/\D/g, "")),
        postcode_end: Number(matches[1].replace(/\D/g, "")),
        zone: zoneMatch ? zoneMatch[0].toUpperCase() : "UNKNOWN",
        city: "",
        state: "",
        state_code: zoneMatch ? zoneMatch[0].slice(0, 2).toUpperCase() : "",
        region: ""
      });
    }
  }
  return entries.sort((left, right) => left.postcode_start - right.postcode_start);
}

function parseTailDeliveryRows(rows, currency, rates, warnings) {
  const entries = [];
  const zones = new Set();
  for (const row of rows) {
    const text = row.text;
    const zoneMatch = text.match(/\b[A-Z]{2}-(?:CAP|INT\d?)\b/i);
    const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*[-~至]\s*(\d+(?:\.\d+)?)/);
    const numbers = text.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
    if (zoneMatch && rangeMatch && numbers.length >= 3) {
      const fee = numbers[numbers.length - 1];
      const zone = zoneMatch[0].toUpperCase();
      zones.add(zone);
      entries.push({
        zone,
        min_weight_kg: Number(rangeMatch[1]),
        max_weight_kg: Number(rangeMatch[2]),
        fee_cny: currency === "USD" ? Number((fee / Math.max(rates.cny_to_usd || 1, 0.0001)).toFixed(4)) : fee
      });
    }
  }
  return { zones: Array.from(zones), entries };
}

function parseMainPrcRates(rows) {
  const rates = [];
  for (const row of rows) {
    const text = row.text;
    const productCode = text.match(/BR\d{4}/)?.[0];
    const numbers = text.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
    if (productCode && numbers.length) {
      const perKg = numbers[numbers.length - 1];
      rates.push({
        product_code: productCode,
        per_kg_cny: perKg
      });
    }
  }
  return rates;
}

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
  const workbookText = selectedSheets.map((sheet) => sheet.rows.map((row) => row.text).join("\n")).join("\n");
  const quote_cards = [];
  const extracted_fields = [];
  const missing_fields = [];
  const warnings = [...(workbookData.warnings || [])];
  const rates = {
    cny_to_usd: Number(options.cny_to_usd || 0),
    brl_to_usd: Number(options.brl_to_usd || 0)
  };

  const productCodes = detectProductCodes(workbookText);
  const postalEntries = parsePostalZoneRows(selectedSheets.flatMap((sheet) => sheet.rows));
  const tailDelivery = parseTailDeliveryRows(selectedSheets.flatMap((sheet) => sheet.rows), "CNY", rates, warnings);
  const mainPrcRates = parseMainPrcRates(selectedSheets.flatMap((sheet) => sheet.rows));

  if (/PRC|商业清关|邮编|CEP|尾程|BR1001|BR1002|BR1006/i.test(workbookText) && (mainPrcRates.length || postalEntries.length || tailDelivery.entries.length)) {
    const packageCard = createEmptyQuoteCard({
      quote_name: `${workbookData.fileName} - PRC 报价包草稿`,
      forwarder_name: workbookData.fileName.replace(/\.xlsx$/i, ""),
      mode: "air_direct_mail",
      country: "Brazil",
      currency: "CNY",
      billing_method: "per_kg",
      source: "rule_extracted",
      status: "needs_review",
      imported_at: workbookData.generatedAt,
      original_file_name: workbookData.fileName,
      original_text_excerpt: workbookText.slice(0, 1200),
      available_product_codes: productCodes,
      selected_product_code: productCodes[0] || "",
      main_prc_rates: mainPrcRates,
      tail_delivery_matrix: {
        zones: tailDelivery.zones,
        weight_columns: [],
        entries: tailDelivery.entries
      },
      postal_zone_map: {
        entries: postalEntries
      },
      restriction_notes: /Device|Sexy|Sexual|Adult product|Battery/i.test(workbookText)
        ? ["系统检测到禁运/限制词，需业务确认货代是否书面允许承运。"]
        : [],
      notes: "由前端 Excel 预处理器识别为 PRC 复合报价包草稿，需人工确认。"
    });

    if (mainPrcRates.length) {
      extracted_fields.push("main_prc_rates");
    }
    if (tailDelivery.entries.length) {
      extracted_fields.push("tail_delivery_matrix");
    }
    if (postalEntries.length) {
      extracted_fields.push("postal_zone_map");
    }
    if (!mainPrcRates.length) {
      missing_fields.push("main_prc_rates");
    }
    if (!tailDelivery.entries.length) {
      missing_fields.push("tail_delivery_matrix");
      warnings.push({
        code: "PRC_TAIL_MATRIX_MISSING",
        severity: "warning",
        message: "已识别 PRC 主报价，但尾程矩阵缺失，请复核。"
      });
    }
    if (!postalEntries.length) {
      missing_fields.push("postal_zone_map");
      warnings.push({
        code: "PRC_POSTAL_ZONE_MAP_MISSING",
        severity: "warning",
        message: "已识别 PRC 主报价，但邮编区域表缺失，请复核。"
      });
    }
    quote_cards.push(packageCard);
  }

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

    if (!quote_cards.some((item) => item.quote_name === quoteCard.quote_name)) {
      quote_cards.push(quoteCard);
    }
  }

  return {
    quote_cards,
    extracted_fields: Array.from(new Set(extracted_fields)),
    missing_fields: Array.from(new Set(missing_fields)),
    warnings,
    confidence: quote_cards.length && missing_fields.length < extracted_fields.length ? "medium" : "low"
  };
}
