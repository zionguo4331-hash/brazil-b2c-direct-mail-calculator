// Generated from lib/calculateBrazilB2CDirectMailCost.js
import { DEFAULTS } from "./defaults.js";
import { calculateDirectMailEngine } from "./engines/DirectMailEngine.js";
import { calculateLocalWarehouseEngine } from "./engines/LocalWarehouseEngine.js";
import { calculateChannelCostEngine } from "./engines/ChannelCostEngine.js";

function roundValue(value, digits = 4) {
  return Number(value.toFixed(digits));
}

function assertFiniteNumber(name, value) {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }
}

function assertPositive(name, value, allowZero = false) {
  assertFiniteNumber(name, value);
  if (allowZero ? value < 0 : value <= 0) {
    throw new Error(`${name} must be ${allowZero ? "greater than or equal to" : "greater than"} 0`);
  }
}

function buildFormulaNotes() {
  return [
    {
      title: "DirectMailEngine",
      formula: "中国直邮模式计算 CIF、II、ICMS、Landed Cost，以及空运/海运头程运费。"
    },
    {
      title: "LocalWarehouseEngine",
      formula: "本地仓模式计算库存到仓成本、仓储分摊、入库分摊、出库操作费、本地尾程、退货期望成本和仓库管理费。"
    },
    {
      title: "ChannelCostEngine",
      formula: "独立站计算支付手续费和 FX 损耗；Mercado Livre 和 Shopee 计算平台佣金、交易费、物流费和广告费。"
    },
    {
      title: "Shopee 3PF",
      formula: "Shopee 3PF 模式下，渠道成本 = Shopee 佣金 + 交易费 + 服务费 + 活动折扣 + 优惠券成本 + 免邮补贴 + 站内广告；本地履约成本 = 仓储 + 入库 + 出库操作 + 尾程 + 退货期望成本。"
    },
    {
      title: "总成本",
      formula: "直邮模式：总成本 = 直邮落地成本 + 包材 + 渠道费用 + 广告CPA + 达人佣金 + 折扣成本 + 退货准备金；本地仓模式：总成本 = 单件库存到仓成本 + 本地履约成本 + 渠道费用 + 广告CPA + 达人佣金 + 折扣成本 + 退货准备金。"
    }
  ];
}

function buildWarnings(input, directMail, localWarehouse, channel, gross_revenue_usd, net_profit_usd) {
  const warnings = [];

  if (
    input.is_local_warehouse_mode &&
    (!input.inventory_landed_cost_per_unit_usd || input.inventory_landed_cost_per_unit_usd <= 0)
  ) {
    warnings.push({
      code: input.fulfillment_mode === "shopee_3pf" ? "SHOPEE_3PF_INVENTORY_COST_MISSING" : "LOCAL_WAREHOUSE_COST_MISSING",
      severity: "critical",
      message: "本地仓模式缺少 inventory_landed_cost_per_unit_usd。"
    });
  }

  if (input.is_local_warehouse_mode && gross_revenue_usd > 0 && input.last_mile_delivery_usd / gross_revenue_usd > 0.12) {
    warnings.push({
      code: "LOCAL_DELIVERY_COST_HIGH",
      severity: "warning",
      message: "本地尾程快递成本占销售收入超过 12%。"
    });
  }

  if (gross_revenue_usd > 0 && channel.platform_commission_usd / gross_revenue_usd > 0.15) {
    warnings.push({
      code: "PLATFORM_COMMISSION_PRESSURE",
      severity: "warning",
      message: "平台佣金占销售收入超过 15%。"
    });
  }

  if (input.avg_storage_days > 60) {
    warnings.push({
      code: "STORAGE_DAYS_TOO_LONG",
      severity: "warning",
      message: "平均库存天数超过 60 天。"
    });
  }

  if (
    input.sales_channel !== "d2c_independent_site" &&
    channel.payment_fee_enabled &&
    (channel.payment_fee_usd > 0 || channel.fx_spread_usd > 0)
  ) {
    warnings.push({
      code: "MARKETPLACE_PAYMENT_DUPLICATION_RISK",
      severity: "warning",
      message: "平台渠道启用了独立站支付费，可能重复计算支付成本。"
    });
  }

  if (input.sales_channel === "shopee_brazil" && gross_revenue_usd > 0 && channel.shopee_channel_cost_usd / gross_revenue_usd > 0.25) {
    warnings.push({
      code: "SHOPEE_CHANNEL_COST_PRESSURE",
      severity: "warning",
      message: "Shopee 渠道成本占销售收入超过 25%。"
    });
  }

  if (input.is_direct_mail_mode && directMail.cif_usd >= 50 * DEFAULTS.warnings.cif_redline_ratio && directMail.cif_usd <= 50) {
    warnings.push({
      code: "CIF_NEAR_50_USD",
      severity: "warning",
      message: `CIF 接近 50 美元红线，当前为 ${directMail.cif_usd} USD。`
    });
  }

  if (input.is_direct_mail_mode && directMail.chargeable_weight_kg / Math.max(input.actual_weight_kg, 0.0001) >= DEFAULTS.warnings.volumetric_ratio_high && directMail.shipping_mode === "air") {
    warnings.push({
      code: "HIGH_VOLUMETRIC_WEIGHT",
      severity: "warning",
      message: "空运体积重明显高于实重。"
    });
  }

  if (gross_revenue_usd > 0 && input.marketing_cpa_usd / gross_revenue_usd >= DEFAULTS.warnings.marketing_ratio_high) {
    warnings.push({
      code: "HIGH_MARKETING_RATIO",
      severity: "warning",
      message: "广告 CPA 占销售收入过高。"
    });
  }

  if (net_profit_usd < 0) {
    warnings.push({
      code: "NEGATIVE_PROFIT",
      severity: "critical",
      message: `净利润为负，当前为 ${roundValue(net_profit_usd)} USD。`
    });
  }

  return warnings;
}

function calculateSuggestedRetailPriceBrl({
  fixed_cost_usd,
  variable_cost_rate,
  brl_to_usd,
  target_net_margin
}) {
  const denominator = 1 - variable_cost_rate - target_net_margin;
  if (denominator <= 0 || brl_to_usd <= 0) {
    return null;
  }
  return fixed_cost_usd / denominator / brl_to_usd;
}

function mergeDefaults(input) {
  return {
    credit_card_fee_rate: input.credit_card_fee_rate ?? DEFAULTS.payment.credit_card_fee_rate,
    pix_fee_rate: input.pix_fee_rate ?? DEFAULTS.payment.pix_fee_rate,
    fx_spread_rate: input.fx_spread_rate ?? DEFAULTS.payment.fx_spread_rate,
    ii_rate_below_50: input.ii_rate_below_50 ?? DEFAULTS.direct_mail.ii_rate_below_50,
    ii_rate_above_50: input.ii_rate_above_50 ?? DEFAULTS.direct_mail.ii_rate_above_50,
    ii_deduction_above_50_usd:
      input.ii_deduction_above_50_usd ?? DEFAULTS.direct_mail.ii_deduction_above_50_usd,
    icms_rate: input.icms_rate ?? DEFAULTS.direct_mail.icms_rate,
    volumetric_divisor: input.volumetric_divisor ?? DEFAULTS.direct_mail.volumetric_divisor,
    sea_freight_density_divisor:
      input.sea_freight_density_divisor ?? DEFAULTS.direct_mail.sea_freight_density_divisor,
    storage_fee_mode: input.storage_fee_mode ?? DEFAULTS.local_warehouse.storage_fee_mode,
    storage_fee_usd_per_unit_month:
      input.storage_fee_usd_per_unit_month ?? DEFAULTS.local_warehouse.storage_fee_usd_per_unit_month,
    storage_fee_usd_per_cbm_month:
      input.storage_fee_usd_per_cbm_month ?? DEFAULTS.local_warehouse.storage_fee_usd_per_cbm_month,
    avg_storage_days: input.avg_storage_days ?? DEFAULTS.local_warehouse.avg_storage_days,
    inbound_fee_usd_per_unit:
      input.inbound_fee_usd_per_unit ?? DEFAULTS.local_warehouse.inbound_fee_usd_per_unit,
    total_inbound_fee_usd: input.total_inbound_fee_usd ?? 0,
    total_units_in_batch: input.total_units_in_batch ?? 0,
    pick_pack_base_fee_usd:
      input.pick_pack_base_fee_usd ?? DEFAULTS.local_warehouse.pick_pack_base_fee_usd,
    pick_fee_usd_per_item:
      input.pick_fee_usd_per_item ?? DEFAULTS.local_warehouse.pick_fee_usd_per_item,
    pick_fee_usd_per_additional_item:
      input.pick_fee_usd_per_additional_item ?? DEFAULTS.local_warehouse.pick_fee_usd_per_additional_item,
    items_per_order: input.items_per_order ?? DEFAULTS.local_warehouse.items_per_order,
    local_packaging_cost_usd:
      input.local_packaging_cost_usd ?? DEFAULTS.local_warehouse.local_packaging_cost_usd,
    last_mile_delivery_usd:
      input.last_mile_delivery_usd ?? DEFAULTS.local_warehouse.last_mile_delivery_usd,
    return_rate: input.return_rate ?? DEFAULTS.local_warehouse.return_rate,
    return_handling_fee_usd:
      input.return_handling_fee_usd ?? DEFAULTS.local_warehouse.return_handling_fee_usd,
    reverse_shipping_usd:
      input.reverse_shipping_usd ?? DEFAULTS.local_warehouse.reverse_shipping_usd,
    non_resellable_rate:
      input.non_resellable_rate ?? DEFAULTS.local_warehouse.non_resellable_rate,
    warehouse_management_fee_usd:
      input.warehouse_management_fee_usd ?? DEFAULTS.local_warehouse.warehouse_management_fee_usd,
    warehouse_management_rate:
      input.warehouse_management_rate ?? DEFAULTS.local_warehouse.warehouse_management_rate,
    mercado_livre_classic_commission_rate:
      input.mercado_livre_classic_commission_rate ?? DEFAULTS.marketplaces.mercado_livre_classic_commission_rate,
    mercado_livre_premium_commission_rate:
      input.mercado_livre_premium_commission_rate ?? DEFAULTS.marketplaces.mercado_livre_premium_commission_rate,
    mercado_livre_logistics_fee_usd:
      input.mercado_livre_logistics_fee_usd ?? DEFAULTS.marketplaces.mercado_livre_logistics_fee_usd,
    shopee_commission_rate:
      input.shopee_commission_rate ?? DEFAULTS.shopee_3pf.shopee_commission_rate,
    shopee_transaction_fee_rate:
      input.shopee_transaction_fee_rate ?? DEFAULTS.shopee_3pf.shopee_transaction_fee_rate,
    shopee_service_fee_rate:
      input.shopee_service_fee_rate ?? DEFAULTS.shopee_3pf.shopee_service_fee_rate,
    shopee_campaign_discount_rate:
      input.shopee_campaign_discount_rate ?? DEFAULTS.shopee_3pf.shopee_campaign_discount_rate,
    shopee_coupon_cost_usd:
      input.shopee_coupon_cost_usd ?? DEFAULTS.shopee_3pf.shopee_coupon_cost_usd,
    shopee_free_shipping_subsidy_usd:
      input.shopee_free_shipping_subsidy_usd ?? DEFAULTS.shopee_3pf.shopee_free_shipping_subsidy_usd,
    shopee_ads_usd:
      input.shopee_ads_usd ?? DEFAULTS.shopee_3pf.shopee_ads_usd,
    marketplace_ads_usd: input.marketplace_ads_usd ?? DEFAULTS.marketplaces.marketplace_ads_usd,
    target_margin_scenarios:
      input.target_margin_scenarios ?? DEFAULTS.pricing.target_margin_scenarios,
    marketing_cpa_usd: input.marketing_cpa_usd ?? 0,
    influencer_commission_usd: input.influencer_commission_usd ?? 0,
    discount_cost_usd: input.discount_cost_usd ?? 0,
    return_reserve_usd: input.return_reserve_usd ?? 0,
    packaging_cost_usd: input.packaging_cost_usd ?? 0,
    insurance_usd: input.insurance_usd ?? 0,
    payment_fee_enabled: input.payment_fee_enabled ?? false,
    fx_spread_enabled: input.fx_spread_enabled ?? false,
    local_warehouse_enabled: input.local_warehouse_enabled ?? false,
    inventory_landed_cost_per_unit_usd: input.inventory_landed_cost_per_unit_usd ?? 0,
    air_freight_usd_per_kg: input.air_freight_usd_per_kg ?? 0,
    sea_freight_usd_per_cbm: input.sea_freight_usd_per_cbm ?? 0
  };
}

export function normalizeBrazilB2CDirectMailCostInput(rawInput) {
  const defaults = mergeDefaults(rawInput);
  const normalized = {
    ...rawInput,
    ...defaults,
    fulfillment_mode:
      rawInput.fulfillment_mode ??
      (rawInput.shipping_mode === "sea" ? "china_direct_mail_sea" : "china_direct_mail_air"),
    sales_channel: rawInput.sales_channel ?? "d2c_independent_site",
    target_net_margin: rawInput.target_net_margin ?? rawInput.target_margin ?? 0.3,
    payment_method: rawInput.payment_method ?? "credit_card",
    brl_to_usd: rawInput.brl_to_usd,
    cny_to_usd: rawInput.cny_to_usd,
    usd_to_brl: rawInput.usd_to_brl ?? 1 / rawInput.brl_to_usd
  };

  normalized.is_direct_mail_mode =
    normalized.fulfillment_mode === "china_direct_mail_air" ||
    normalized.fulfillment_mode === "china_direct_mail_sea";
  normalized.is_local_warehouse_mode =
    normalized.fulfillment_mode === "brazil_local_3pf" ||
    normalized.fulfillment_mode === "mercado_livre_full" ||
    normalized.fulfillment_mode === "shopee_3pf";

  return normalized;
}

export function validateBrazilB2CDirectMailCostInput(input) {
  const requiredPositive = [
    "product_cogs_cny",
    "cny_to_usd",
    "brl_to_usd",
    "actual_weight_kg",
    "length_cm",
    "width_cm",
    "height_cm",
    "retail_price_brl",
    "volumetric_divisor"
  ];

  for (const key of requiredPositive) {
    assertPositive(key, input[key]);
  }

  for (const key of [
    "air_freight_usd_per_kg",
    "sea_freight_usd_per_cbm",
    "insurance_usd",
    "packaging_cost_usd",
    "marketing_cpa_usd",
    "inventory_landed_cost_per_unit_usd",
    "inbound_fee_usd_per_unit",
    "last_mile_delivery_usd"
  ]) {
    assertPositive(key, input[key], true);
  }

  if (
    ![
      "china_direct_mail_air",
      "china_direct_mail_sea",
      "brazil_local_3pf",
      "mercado_livre_full",
      "shopee_3pf"
    ].includes(input.fulfillment_mode)
  ) {
    throw new Error("invalid fulfillment_mode");
  }

  if (
    ![
      "d2c_independent_site",
      "mercado_livre_classic",
      "mercado_livre_premium",
      "shopee_brazil"
    ].includes(input.sales_channel)
  ) {
    throw new Error("invalid sales_channel");
  }

  if (!["credit_card", "pix", "custom"].includes(input.payment_method)) {
    throw new Error("invalid payment_method");
  }
}

export function calculateBrazilB2CDirectMailCost(rawInput) {
  const input = normalizeBrazilB2CDirectMailCostInput(rawInput);
  validateBrazilB2CDirectMailCostInput(input);

  const gross_revenue_usd = input.retail_price_brl * input.brl_to_usd;
  const direct_mail_breakdown = calculateDirectMailEngine(input);
  const local_warehouse_breakdown = calculateLocalWarehouseEngine(input, gross_revenue_usd);
  const channel_breakdown = calculateChannelCostEngine(input, gross_revenue_usd);

  const genericDiscountCostUsd = input.fulfillment_mode === "shopee_3pf" ? 0 : input.discount_cost_usd;
  const fixed_cost_for_price =
    (input.is_direct_mail_mode
      ? direct_mail_breakdown.direct_mail_landed_cost_usd + input.packaging_cost_usd
      : input.inventory_landed_cost_per_unit_usd + local_warehouse_breakdown.local_fulfillment_cost_usd) +
    input.marketing_cpa_usd +
    input.influencer_commission_usd +
    genericDiscountCostUsd +
    input.return_reserve_usd;

  const variable_cost_rate = gross_revenue_usd > 0
    ? channel_breakdown.channel_fee_usd / gross_revenue_usd
    : 0;

  const total_cost_usd =
    (input.is_direct_mail_mode
      ? directMailCostBase(input, direct_mail_breakdown)
      : input.inventory_landed_cost_per_unit_usd + local_warehouse_breakdown.local_fulfillment_cost_usd) +
    channel_breakdown.channel_fee_usd +
    input.marketing_cpa_usd +
    input.influencer_commission_usd +
    genericDiscountCostUsd +
    input.return_reserve_usd;

  const net_profit_usd = gross_revenue_usd - total_cost_usd;
  const net_margin = gross_revenue_usd === 0 ? 0 : net_profit_usd / gross_revenue_usd;
  const warnings = buildWarnings(
    input,
    direct_mail_breakdown,
    local_warehouse_breakdown,
    channel_breakdown,
    gross_revenue_usd,
    net_profit_usd
  );

  const pricing_band = {
    current_target_margin: roundValue(input.target_net_margin),
    suggested_price_for_current_target_brl: calculateSuggestedRetailPriceBrl({
      fixed_cost_usd: fixed_cost_for_price,
      variable_cost_rate,
      brl_to_usd: input.brl_to_usd,
      target_net_margin: input.target_net_margin
    }),
    scenarios: input.target_margin_scenarios.map((target_net_margin) => ({
      target_net_margin: roundValue(target_net_margin),
      suggested_retail_price_brl: calculateSuggestedRetailPriceBrl({
        fixed_cost_usd: fixed_cost_for_price,
        variable_cost_rate,
        brl_to_usd: input.brl_to_usd,
        target_net_margin
      })
    }))
  };

  const cpa_capacity = {
    break_even_cpa_usd: roundValue(Math.max(0, gross_revenue_usd - (total_cost_usd - input.marketing_cpa_usd))),
    target_margin_cpa_usd: roundValue(
      Math.max(
        0,
        gross_revenue_usd * (1 - input.target_net_margin) -
        (total_cost_usd - input.marketing_cpa_usd)
      )
    )
  };

  const cfo_summary = {
    profit_status: net_profit_usd >= 0 ? "profitable" : "unprofitable",
    risk_level: warnings.some((item) => item.severity === "critical")
      ? "high"
      : warnings.some((item) => item.severity === "warning")
        ? "medium"
        : "low",
    recommendation:
      net_profit_usd >= 0
        ? "当前模型可售，建议继续优化渠道费和履约成本。"
        : "当前模型亏损，建议优先调整售价、履约模式或渠道佣金结构。"
  };

  const shopee_3pf_breakdown = {
    shopee_commission_usd: roundValue(channel_breakdown.platform_commission_usd),
    shopee_transaction_fee_usd: roundValue(channel_breakdown.transaction_fee_usd),
    shopee_service_fee_usd: roundValue(channel_breakdown.shopee_service_fee_usd),
    shopee_campaign_discount_usd: roundValue(channel_breakdown.shopee_campaign_discount_usd),
    shopee_coupon_cost_usd: roundValue(channel_breakdown.shopee_coupon_cost_usd),
    shopee_free_shipping_subsidy_usd: roundValue(channel_breakdown.shopee_free_shipping_subsidy_usd),
    shopee_ads_usd: roundValue(channel_breakdown.shopee_ads_usd),
    shopee_channel_cost_usd: roundValue(channel_breakdown.shopee_channel_cost_usd),
    storage_fee_allocated_usd: roundValue(local_warehouse_breakdown.storage_fee_allocated_usd),
    inbound_fee_allocated_usd: roundValue(local_warehouse_breakdown.inbound_fee_allocated_usd),
    fulfillment_handling_fee_usd: roundValue(local_warehouse_breakdown.fulfillment_handling_fee_usd),
    last_mile_delivery_usd: roundValue(local_warehouse_breakdown.last_mile_delivery_usd),
    expected_return_cost_usd: roundValue(local_warehouse_breakdown.expected_return_cost_usd),
    local_3pf_cost_usd: roundValue(local_warehouse_breakdown.local_fulfillment_cost_usd)
  };

  return {
    result: {
      gross_revenue_usd: roundValue(gross_revenue_usd),
      total_cost_usd: roundValue(total_cost_usd),
      net_profit_usd: roundValue(net_profit_usd),
      net_margin: roundValue(net_margin)
    },
    direct_mail_breakdown,
    local_warehouse_breakdown,
    channel_breakdown,
    shopee_3pf_breakdown,
    pricing_band: {
      current_target_margin: pricing_band.current_target_margin,
      suggested_price_for_current_target_brl:
        pricing_band.suggested_price_for_current_target_brl === null
          ? null
          : roundValue(pricing_band.suggested_price_for_current_target_brl),
      scenarios: pricing_band.scenarios.map((item) => ({
        target_net_margin: item.target_net_margin,
        suggested_retail_price_brl:
          item.suggested_retail_price_brl === null ? null : roundValue(item.suggested_retail_price_brl)
      }))
    },
    cpa_capacity,
    warnings,
    cfo_summary,
    applied_parameters: {
      fulfillment_mode: input.fulfillment_mode,
      sales_channel: input.sales_channel,
      payment_method: input.payment_method,
      payment_fee_enabled: input.payment_fee_enabled,
      local_warehouse_enabled: input.local_warehouse_enabled,
      target_net_margin: roundValue(input.target_net_margin)
    },
    formula_notes: buildFormulaNotes()
  };
}

function directMailCostBase(input, direct_mail_breakdown) {
  return direct_mail_breakdown.direct_mail_landed_cost_usd + input.packaging_cost_usd;
}
