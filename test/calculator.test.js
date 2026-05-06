import test from "node:test";
import assert from "node:assert/strict";
import { calculateBrazilB2CDirectMailCost } from "../lib/calculateBrazilB2CDirectMailCost.js";

function buildBaseInput(overrides = {}) {
  return {
    fulfillment_mode: "china_direct_mail_air",
    sales_channel: "d2c_independent_site",
    payment_method: "credit_card",
    payment_fee_enabled: false,
    product_cogs_cny: 100,
    cny_to_usd: 0.14,
    brl_to_usd: 0.2,
    retail_price_brl: 180,
    actual_weight_kg: 0.4,
    length_cm: 20,
    width_cm: 15,
    height_cm: 10,
    volumetric_divisor: 6000,
    air_freight_usd_per_kg: 12,
    sea_freight_usd_per_cbm: 180,
    sea_freight_density_divisor: 1000,
    insurance_usd: 1,
    packaging_cost_usd: 0.5,
    marketing_cpa_usd: 2,
    credit_card_fee_rate: 0.0399,
    pix_fee_rate: 0.0099,
    fx_spread_rate: 0.01,
    target_net_margin: 0.3,
    ...overrides
  };
}

test("独立站 + 中国直邮，仍按原模型计算", () => {
  const result = calculateBrazilB2CDirectMailCost(buildBaseInput());
  assert.equal(result.direct_mail_breakdown.active, true);
  assert.equal(result.local_warehouse_breakdown.active, false);
  assert.ok(result.direct_mail_breakdown.direct_mail_landed_cost_usd > 0);
  assert.ok(result.channel_breakdown.payment_fee_usd > 0);
});

test("独立站 + 巴西 3PF，包含本地仓储、出库、尾程", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      fulfillment_mode: "brazil_local_3pf",
      inventory_landed_cost_per_unit_usd: 18
    })
  );

  assert.equal(result.local_warehouse_breakdown.active, true);
  assert.ok(result.local_warehouse_breakdown.storage_fee_allocated_usd > 0);
  assert.ok(result.local_warehouse_breakdown.fulfillment_handling_fee_usd > 0);
  assert.ok(result.local_warehouse_breakdown.last_mile_delivery_usd > 0);
});

test("Mercado Livre Classic，佣金按 Classic 计算", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      sales_channel: "mercado_livre_classic"
    })
  );

  assert.equal(result.channel_breakdown.sales_channel, "mercado_livre_classic");
  assert.equal(result.channel_breakdown.platform_commission_usd, 4.5);
});

test("Mercado Livre Premium，佣金高于 Classic", () => {
  const classic = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      sales_channel: "mercado_livre_classic"
    })
  );
  const premium = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      sales_channel: "mercado_livre_premium"
    })
  );

  assert.ok(premium.channel_breakdown.platform_commission_usd > classic.channel_breakdown.platform_commission_usd);
});

test("Shopee Brazil，包含佣金和交易服务费", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      sales_channel: "shopee_brazil"
    })
  );

  assert.ok(result.channel_breakdown.platform_commission_usd > 0);
  assert.ok(result.channel_breakdown.transaction_fee_usd > 0);
});

test("sales_channel=shopee_brazil 且 fulfillment_mode=shopee_3pf 时，使用 Shopee 3PF 公式", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      fulfillment_mode: "shopee_3pf",
      sales_channel: "shopee_brazil",
      inventory_landed_cost_per_unit_usd: 18
    })
  );

  assert.ok(result.shopee_3pf_breakdown.shopee_channel_cost_usd > 0);
  assert.ok(result.shopee_3pf_breakdown.local_3pf_cost_usd > 0);
});

test("Shopee 3PF 不应默认计算独立站 payment_fee_usd", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      fulfillment_mode: "shopee_3pf",
      sales_channel: "shopee_brazil",
      inventory_landed_cost_per_unit_usd: 18
    })
  );

  assert.equal(result.channel_breakdown.payment_fee_usd, 0);
});

test("Shopee 3PF 不应默认计算独立站 fx_spread_usd", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      fulfillment_mode: "shopee_3pf",
      sales_channel: "shopee_brazil",
      inventory_landed_cost_per_unit_usd: 18
    })
  );

  assert.equal(result.channel_breakdown.fx_spread_usd, 0);
});

test("Shopee 佣金、交易费、活动折扣、免邮补贴、站内广告都进入总成本", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      fulfillment_mode: "shopee_3pf",
      sales_channel: "shopee_brazil",
      inventory_landed_cost_per_unit_usd: 18,
      shopee_campaign_discount_rate: 0.05,
      shopee_free_shipping_subsidy_usd: 3,
      shopee_ads_usd: 2
    })
  );

  assert.ok(result.shopee_3pf_breakdown.shopee_channel_cost_usd > 0);
  assert.ok(result.result.total_cost_usd > 18);
});

test("仓储、入库、出库、拣货、尾程、退货期望成本都进入 Shopee 3PF 总成本", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      fulfillment_mode: "shopee_3pf",
      sales_channel: "shopee_brazil",
      inventory_landed_cost_per_unit_usd: 18
    })
  );

  assert.ok(result.shopee_3pf_breakdown.storage_fee_allocated_usd > 0);
  assert.ok(result.shopee_3pf_breakdown.inbound_fee_allocated_usd > 0);
  assert.ok(result.shopee_3pf_breakdown.fulfillment_handling_fee_usd > 0);
  assert.ok(result.shopee_3pf_breakdown.last_mile_delivery_usd > 0);
  assert.ok(result.shopee_3pf_breakdown.expected_return_cost_usd > 0);
});

test("inventory_landed_cost_per_unit_usd 缺失时输出 SHOPEE_3PF_INVENTORY_COST_MISSING", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      fulfillment_mode: "shopee_3pf",
      sales_channel: "shopee_brazil",
      inventory_landed_cost_per_unit_usd: 0
    })
  );

  assert.ok(result.warnings.some((item) => item.code === "SHOPEE_3PF_INVENTORY_COST_MISSING"));
});

test("本地仓模式不应重复计算直邮 Landed Cost", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      fulfillment_mode: "brazil_local_3pf",
      inventory_landed_cost_per_unit_usd: 20
    })
  );

  const expectedTotal =
    20 +
    result.local_warehouse_breakdown.local_fulfillment_cost_usd +
    result.channel_breakdown.channel_fee_usd +
    2;
  assert.equal(result.result.total_cost_usd, Number(expectedTotal.toFixed(4)));
});

test("平台渠道不应默认重复计算独立站支付费", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      sales_channel: "mercado_livre_classic"
    })
  );

  assert.equal(result.channel_breakdown.payment_fee_usd, 0);
  assert.equal(result.channel_breakdown.fx_spread_usd, 0);
});

test("本地仓缺少 inventory_landed_cost_per_unit_usd 时给 warning", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      fulfillment_mode: "brazil_local_3pf",
      inventory_landed_cost_per_unit_usd: 0
    })
  );

  assert.ok(result.warnings.some((item) => item.code === "LOCAL_WAREHOUSE_COST_MISSING"));
});

test("avg_storage_days > 60 时给 warning", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      fulfillment_mode: "brazil_local_3pf",
      inventory_landed_cost_per_unit_usd: 20,
      avg_storage_days: 75
    })
  );

  assert.ok(result.warnings.some((item) => item.code === "STORAGE_DAYS_TOO_LONG"));
});

test("shopee_channel_cost_usd / gross_revenue_usd > 0.25 时输出 SHOPEE_CHANNEL_COST_PRESSURE", () => {
  const result = calculateBrazilB2CDirectMailCost(
    buildBaseInput({
      fulfillment_mode: "shopee_3pf",
      sales_channel: "shopee_brazil",
      inventory_landed_cost_per_unit_usd: 18,
      shopee_campaign_discount_rate: 0.12,
      shopee_free_shipping_subsidy_usd: 8,
      shopee_ads_usd: 6
    })
  );

  assert.ok(result.warnings.some((item) => item.code === "SHOPEE_CHANNEL_COST_PRESSURE"));
});
