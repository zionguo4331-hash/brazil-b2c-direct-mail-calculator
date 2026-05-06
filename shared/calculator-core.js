const DEFAULT_PAYMENT_FEE_RATES = {
  credit_card: 0.0399,
  pix: 0.0099,
  custom: 0
};

const DEFAULT_WARNING_THRESHOLDS = {
  cif_redline_ratio: 0.95,
  volumetric_ratio_high: 1.5,
  marketing_ratio_high: 0.3
};

const DEFAULT_SEA_FREIGHT_DENSITY_DIVISOR = 1000;
const DEFAULT_TARGET_MARGIN_SCENARIOS = [0.3, 0.4, 0.5];

function roundCurrency(value) {
  return Number(value.toFixed(4));
}

function assertFinitePositive(name, value, allowZero = false) {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }

  if (allowZero ? value < 0 : value <= 0) {
    throw new Error(`${name} must be ${allowZero ? "greater than or equal to" : "greater than"} 0`);
  }
}

export function normalizeCalculatorInput(input) {
  const normalized = {
    ...input,
    shipping_mode: input.shipping_mode ?? "air",
    insurance_usd: input.insurance_usd ?? 0,
    packaging_cost_usd: input.packaging_cost_usd ?? 0,
    marketing_cpa_usd: input.marketing_cpa_usd ?? 0,
    fx_spread_rate: input.fx_spread_rate ?? 0,
    icms_rate: input.icms_rate ?? 0.17,
    ii_rate_below_50: input.ii_rate_below_50 ?? 0.2,
    ii_rate_above_50: input.ii_rate_above_50 ?? 0.6,
    ii_deduction_above_50_usd: input.ii_deduction_above_50_usd ?? 20,
    target_net_margin: input.target_net_margin ?? 0.15,
    target_margin_scenarios: input.target_margin_scenarios ?? DEFAULT_TARGET_MARGIN_SCENARIOS,
    sea_freight_usd_per_cbm: input.sea_freight_usd_per_cbm ?? 0,
    sea_freight_density_divisor: input.sea_freight_density_divisor ?? DEFAULT_SEA_FREIGHT_DENSITY_DIVISOR,
    warning_thresholds: {
      ...DEFAULT_WARNING_THRESHOLDS,
      ...(input.warning_thresholds ?? {})
    }
  };

  normalized.usd_to_brl = input.usd_to_brl ?? 1 / normalized.brl_to_usd;
  normalized.payment_fee_rate =
    input.payment_fee_rate ?? DEFAULT_PAYMENT_FEE_RATES[normalized.payment_method];

  validateCalculatorInput(normalized);
  return normalized;
}

export function validateCalculatorInput(input) {
  assertFinitePositive("product_cogs_cny", input.product_cogs_cny);
  assertFinitePositive("cny_to_usd", input.cny_to_usd);
  assertFinitePositive("brl_to_usd", input.brl_to_usd);
  assertFinitePositive("usd_to_brl", input.usd_to_brl);
  assertFinitePositive("actual_weight_kg", input.actual_weight_kg);
  assertFinitePositive("length_cm", input.length_cm);
  assertFinitePositive("width_cm", input.width_cm);
  assertFinitePositive("height_cm", input.height_cm);
  assertFinitePositive("volumetric_divisor", input.volumetric_divisor);
  assertFinitePositive("retail_price_brl", input.retail_price_brl);
  assertFinitePositive("air_freight_usd_per_kg", input.air_freight_usd_per_kg, true);
  assertFinitePositive("sea_freight_usd_per_cbm", input.sea_freight_usd_per_cbm, true);
  assertFinitePositive("sea_freight_density_divisor", input.sea_freight_density_divisor);
  assertFinitePositive("insurance_usd", input.insurance_usd, true);
  assertFinitePositive("packaging_cost_usd", input.packaging_cost_usd, true);
  assertFinitePositive("marketing_cpa_usd", input.marketing_cpa_usd, true);

  if (!["air", "sea"].includes(input.shipping_mode)) {
    throw new Error("shipping_mode must be one of air or sea");
  }

  if (!["credit_card", "pix", "custom"].includes(input.payment_method)) {
    throw new Error("payment_method must be one of credit_card, pix, custom");
  }

  for (const [name, value] of Object.entries({
    payment_fee_rate: input.payment_fee_rate,
    fx_spread_rate: input.fx_spread_rate,
    icms_rate: input.icms_rate,
    ii_rate_below_50: input.ii_rate_below_50,
    ii_rate_above_50: input.ii_rate_above_50,
    target_net_margin: input.target_net_margin
  })) {
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new Error(`${name} must be a finite ratio between 0 and 1`);
    }
  }

  if (!Array.isArray(input.target_margin_scenarios) || input.target_margin_scenarios.length === 0) {
    throw new Error("target_margin_scenarios must be a non-empty array");
  }

  for (const value of input.target_margin_scenarios) {
    if (!Number.isFinite(value) || value < 0 || value >= 0.95) {
      throw new Error("target_margin_scenarios values must be finite ratios between 0 and 0.95");
    }
  }

  if (!Number.isFinite(input.ii_deduction_above_50_usd) || input.ii_deduction_above_50_usd < 0) {
    throw new Error("ii_deduction_above_50_usd must be greater than or equal to 0");
  }

  const thresholds = input.warning_thresholds;
  if (!thresholds || typeof thresholds !== "object") {
    throw new Error("warning_thresholds must be an object");
  }
}

export function calculateBrazilB2CDirectMailCost(rawInput) {
  const input = normalizeCalculatorInput(rawInput);

  const product_cogs_usd = input.product_cogs_cny * input.cny_to_usd;
  const volume_weight_kg =
    (input.length_cm * input.width_cm * input.height_cm) / input.volumetric_divisor;
  const volume_cbm = (input.length_cm * input.width_cm * input.height_cm) / 1000000;
  const chargeable_weight_kg = Math.max(input.actual_weight_kg, volume_weight_kg);
  const sea_weight_ton = input.actual_weight_kg / input.sea_freight_density_divisor;
  const chargeable_cbm = Math.max(volume_cbm, sea_weight_ton);
  const freight_usd =
    input.shipping_mode === "air"
      ? chargeable_weight_kg * input.air_freight_usd_per_kg
      : chargeable_cbm * input.sea_freight_usd_per_cbm;
  const cif_usd = product_cogs_usd + freight_usd + input.insurance_usd;

  const tax_ii =
    cif_usd <= 50
      ? cif_usd * input.ii_rate_below_50
      : Math.max(0, cif_usd * input.ii_rate_above_50 - input.ii_deduction_above_50_usd);

  const base_icms = (cif_usd + tax_ii) / (1 - input.icms_rate);
  const tax_icms = base_icms * input.icms_rate;
  const landed_cost = cif_usd + tax_ii + tax_icms;

  const gross_revenue_usd = input.retail_price_brl * input.brl_to_usd;
  const payment_fee = gross_revenue_usd * input.payment_fee_rate;
  const fx_spread = (gross_revenue_usd - payment_fee) * input.fx_spread_rate;
  const total_cost =
    landed_cost +
    input.packaging_cost_usd +
    payment_fee +
    fx_spread +
    input.marketing_cpa_usd;
  const net_profit = gross_revenue_usd - total_cost;
  const net_margin = gross_revenue_usd === 0 ? 0 : net_profit / gross_revenue_usd;

  const variable_cost_rate =
    input.payment_fee_rate + (1 - input.payment_fee_rate) * input.fx_spread_rate;
  const suggested_retail_price_brl = calculateSuggestedRetailPriceBrl({
    landed_cost,
    packaging_cost_usd: input.packaging_cost_usd,
    marketing_cpa_usd: input.marketing_cpa_usd,
    brl_to_usd: input.brl_to_usd,
    variable_cost_rate,
    target_net_margin: input.target_net_margin
  });
  const reverse_price_scenarios = input.target_margin_scenarios.map((targetMargin) => ({
    target_net_margin: roundCurrency(targetMargin),
    suggested_retail_price_brl: calculateSuggestedRetailPriceBrl({
      landed_cost,
      packaging_cost_usd: input.packaging_cost_usd,
      marketing_cpa_usd: input.marketing_cpa_usd,
      brl_to_usd: input.brl_to_usd,
      variable_cost_rate,
      target_net_margin: targetMargin
    })
  }));

  const warnings = buildWarnings({
    input,
    cif_usd,
    gross_revenue_usd,
    chargeable_weight_kg,
    volume_weight_kg,
    volume_cbm,
    chargeable_cbm,
    total_cost,
    net_profit
  });

  return {
    inputs: {
      shipping_mode: input.shipping_mode,
      payment_method: input.payment_method,
      target_net_margin: roundCurrency(input.target_net_margin)
    },
    exchange_rates: {
      cny_to_usd: roundCurrency(input.cny_to_usd),
      brl_to_usd: roundCurrency(input.brl_to_usd),
      usd_to_brl: roundCurrency(input.usd_to_brl)
    },
    weights: {
      actual_weight_kg: roundCurrency(input.actual_weight_kg),
      volume_weight_kg: roundCurrency(volume_weight_kg),
      chargeable_weight_kg: roundCurrency(chargeable_weight_kg),
      volume_cbm: roundCurrency(volume_cbm),
      chargeable_cbm: roundCurrency(chargeable_cbm),
      volumetric_divisor: roundCurrency(input.volumetric_divisor),
      sea_freight_density_divisor: roundCurrency(input.sea_freight_density_divisor),
      is_volumetric_weight_applied: volume_weight_kg > input.actual_weight_kg,
      is_volume_cbm_applied: volume_cbm >= sea_weight_ton
    },
    logistics: {
      shipping_mode: input.shipping_mode,
      freight_usd: roundCurrency(freight_usd),
      air_freight_usd_per_kg: roundCurrency(input.air_freight_usd_per_kg),
      sea_freight_usd_per_cbm: roundCurrency(input.sea_freight_usd_per_cbm)
    },
    taxes: {
      cif_usd: roundCurrency(cif_usd),
      tax_ii_usd: roundCurrency(tax_ii),
      icms_rate: roundCurrency(input.icms_rate),
      base_icms_usd: roundCurrency(base_icms),
      tax_icms_usd: roundCurrency(tax_icms)
    },
    costs: {
      product_cogs_usd: roundCurrency(product_cogs_usd),
      freight_usd: roundCurrency(freight_usd),
      insurance_usd: roundCurrency(input.insurance_usd),
      landed_cost_usd: roundCurrency(landed_cost),
      packaging_cost_usd: roundCurrency(input.packaging_cost_usd),
      marketing_cpa_usd: roundCurrency(input.marketing_cpa_usd),
      payment_fee_usd: roundCurrency(payment_fee),
      fx_spread_usd: roundCurrency(fx_spread),
      total_cost_usd: roundCurrency(total_cost)
    },
    profitability: {
      retail_price_brl: roundCurrency(input.retail_price_brl),
      gross_revenue_usd: roundCurrency(gross_revenue_usd),
      net_profit_usd: roundCurrency(net_profit),
      net_margin: roundCurrency(net_margin),
      suggested_retail_price_brl:
        suggested_retail_price_brl === null ? null : roundCurrency(suggested_retail_price_brl)
    },
    reverse_price_scenarios: reverse_price_scenarios.map((item) => ({
      target_net_margin: item.target_net_margin,
      suggested_retail_price_brl:
        item.suggested_retail_price_brl === null ? null : roundCurrency(item.suggested_retail_price_brl)
    })),
    formula_notes: buildFormulaNotes(),
    warnings
  };
}

function calculateSuggestedRetailPriceBrl({
  landed_cost,
  packaging_cost_usd,
  marketing_cpa_usd,
  brl_to_usd,
  variable_cost_rate,
  target_net_margin
}) {
  const reversePriceDenominator = 1 - variable_cost_rate - target_net_margin;

  if (reversePriceDenominator <= 0) {
    return null;
  }

  return (
    (landed_cost + packaging_cost_usd + marketing_cpa_usd) /
    reversePriceDenominator /
    brl_to_usd
  );
}

function buildWarnings({
  input,
  cif_usd,
  gross_revenue_usd,
  chargeable_weight_kg,
  volume_weight_kg,
  volume_cbm,
  chargeable_cbm,
  total_cost,
  net_profit
}) {
  const warnings = [];
  const { cif_redline_ratio, volumetric_ratio_high, marketing_ratio_high } = input.warning_thresholds;

  if (cif_usd >= 50 * cif_redline_ratio && cif_usd <= 50) {
    warnings.push({
      code: "CIF_NEAR_50_USD",
      severity: "warning",
      message: `CIF is close to the USD 50 threshold at ${roundCurrency(cif_usd)} USD.`
    });
  }

  if (net_profit < 0) {
    warnings.push({
      code: "NEGATIVE_PROFIT",
      severity: "critical",
      message: `Net profit is negative at ${roundCurrency(net_profit)} USD.`
    });
  }

  if (
    input.shipping_mode === "air" &&
    input.actual_weight_kg > 0 &&
    chargeable_weight_kg / input.actual_weight_kg >= volumetric_ratio_high
  ) {
    warnings.push({
      code: "HIGH_VOLUMETRIC_WEIGHT",
      severity: "warning",
      message: `Chargeable air weight is ${roundCurrency(chargeable_weight_kg / input.actual_weight_kg)}x actual weight due to volumetric weight.`
    });
  }

  if (gross_revenue_usd > 0 && input.marketing_cpa_usd / gross_revenue_usd >= marketing_ratio_high) {
    warnings.push({
      code: "HIGH_MARKETING_RATIO",
      severity: "warning",
      message: `Marketing CPA accounts for ${roundCurrency((input.marketing_cpa_usd / gross_revenue_usd) * 100)}% of gross revenue.`
    });
  }

  if (gross_revenue_usd > 0 && total_cost > gross_revenue_usd * 0.9) {
    warnings.push({
      code: "THIN_MARGIN",
      severity: "info",
      message: "Total cost is consuming more than 90% of gross revenue."
    });
  }

  if (input.shipping_mode === "air" && volume_weight_kg > input.actual_weight_kg) {
    warnings.push({
      code: "VOLUMETRIC_WEIGHT_APPLIED",
      severity: "info",
      message: "Volumetric air weight exceeds actual weight, so freight uses volumetric weight."
    });
  }

  if (input.shipping_mode === "sea" && chargeable_cbm > volume_cbm) {
    warnings.push({
      code: "SEA_WEIGHT_TON_APPLIED",
      severity: "info",
      message: "Sea freight used weight ton instead of pure cubic volume."
    });
  }

  return warnings;
}

function buildFormulaNotes() {
  return [
    {
      title: "空运逻辑",
      formula: "体积重(kg) = 长(cm) * 宽(cm) * 高(cm) / 抛重系数；计费重 = max(实重, 体积重)；空运费(USD) = 计费重 * 空运单价(USD/kg)。"
    },
    {
      title: "海运逻辑",
      formula: "体积(CBM) = 长(cm) * 宽(cm) * 高(cm) / 1,000,000；重量吨(RT) = 实重(kg) / 海运RT换算kg；海运计费体积 = max(CBM, RT)；海运费(USD) = 海运计费体积 * 海运单价(USD/CBM)。"
    },
    {
      title: "CIF 与税费",
      formula: "CIF = 货值USD + 运费USD + 保险USD；若 CIF <= 50，则 II = CIF * 20%；若 CIF > 50，则 II = max(0, CIF * 60% - 20)；ICMS 计税基数 = (CIF + II) / (1 - 17%)；ICMS = 计税基数 * 17%。"
    },
    {
      title: "落地与利润",
      formula: "落地成本 = CIF + II + ICMS；销售收入USD = 巴西售价BRL * BRL兑USD；总成本 = 落地成本 + 包材 + 支付手续费 + FX损耗 + 广告CPA；净利润 = 销售收入 - 总成本；净利率 = 净利润 / 销售收入。"
    },
    {
      title: "建议售价反推",
      formula: "最低售价BRL = (落地成本 + 包材 + 广告CPA) / (1 - 支付费率 - (1 - 支付费率) * FX损耗率 - 目标净利率) / BRL兑USD。系统会按当前目标净利率，以及 30% / 40% / 50% 场景分别反推。"
    }
  ];
}
