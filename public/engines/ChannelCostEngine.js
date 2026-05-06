function roundValue(value, digits = 4) {
  return Number(value.toFixed(digits));
}

export function calculateChannelCostEngine(input, gross_revenue_usd) {
  const isIndependent = input.sales_channel === "d2c_independent_site";
  const payment_fee_enabled = isIndependent || input.payment_fee_enabled;
  const fx_spread_enabled = isIndependent || input.fx_spread_enabled;
  const payment_fee_rate =
    input.payment_method === "pix" ? input.pix_fee_rate : input.credit_card_fee_rate;
  const payment_fee_usd = payment_fee_enabled ? gross_revenue_usd * payment_fee_rate : 0;
  const fx_spread_usd = fx_spread_enabled
    ? (gross_revenue_usd - payment_fee_usd) * input.fx_spread_rate
    : 0;

  let platform_commission_usd = 0;
  let platform_logistics_fee_usd = 0;
  let transaction_fee_usd = 0;
  let shopee_service_fee_usd = 0;
  let shopee_campaign_discount_usd = 0;
  let shopee_coupon_cost_usd = 0;
  let shopee_free_shipping_subsidy_usd = 0;
  let shopee_ads_usd = 0;
  let shopee_channel_cost_usd = 0;
  let marketplace_ads_usd = 0;

  if (input.sales_channel === "mercado_livre_classic") {
    platform_commission_usd =
      gross_revenue_usd * input.mercado_livre_classic_commission_rate;
    platform_logistics_fee_usd = input.mercado_livre_logistics_fee_usd;
    marketplace_ads_usd = input.marketplace_ads_usd;
  }

  if (input.sales_channel === "mercado_livre_premium") {
    platform_commission_usd =
      gross_revenue_usd * input.mercado_livre_premium_commission_rate;
    platform_logistics_fee_usd = input.mercado_livre_logistics_fee_usd;
    marketplace_ads_usd = input.marketplace_ads_usd;
  }

  if (input.sales_channel === "shopee_brazil") {
    platform_commission_usd = gross_revenue_usd * input.shopee_commission_rate;
    transaction_fee_usd = gross_revenue_usd * input.shopee_transaction_fee_rate;
    shopee_service_fee_usd = gross_revenue_usd * input.shopee_service_fee_rate;
    shopee_campaign_discount_usd =
      gross_revenue_usd * input.shopee_campaign_discount_rate;
    shopee_coupon_cost_usd = input.shopee_coupon_cost_usd;
    shopee_free_shipping_subsidy_usd = input.shopee_free_shipping_subsidy_usd;
    shopee_ads_usd = input.shopee_ads_usd;
    marketplace_ads_usd = input.marketplace_ads_usd;
    shopee_channel_cost_usd =
      platform_commission_usd +
      transaction_fee_usd +
      shopee_service_fee_usd +
      shopee_campaign_discount_usd +
      shopee_coupon_cost_usd +
      shopee_free_shipping_subsidy_usd +
      shopee_ads_usd;
  }

  const channel_fee_usd =
    input.sales_channel === "d2c_independent_site"
      ? payment_fee_usd + fx_spread_usd
      : platform_commission_usd +
        platform_logistics_fee_usd +
        transaction_fee_usd +
        shopee_service_fee_usd +
        shopee_campaign_discount_usd +
        shopee_coupon_cost_usd +
        shopee_free_shipping_subsidy_usd +
        shopee_ads_usd +
        marketplace_ads_usd +
        payment_fee_usd +
        fx_spread_usd;

  return {
    sales_channel: input.sales_channel,
    payment_fee_enabled,
    fx_spread_enabled,
    payment_fee_rate: roundValue(payment_fee_rate),
    payment_fee_usd: roundValue(payment_fee_usd),
    fx_spread_usd: roundValue(fx_spread_usd),
    platform_commission_usd: roundValue(platform_commission_usd),
    platform_logistics_fee_usd: roundValue(platform_logistics_fee_usd),
    transaction_fee_usd: roundValue(transaction_fee_usd),
    shopee_service_fee_usd: roundValue(shopee_service_fee_usd),
    shopee_campaign_discount_usd: roundValue(shopee_campaign_discount_usd),
    shopee_coupon_cost_usd: roundValue(shopee_coupon_cost_usd),
    shopee_free_shipping_subsidy_usd: roundValue(shopee_free_shipping_subsidy_usd),
    shopee_ads_usd: roundValue(shopee_ads_usd),
    shopee_channel_cost_usd: roundValue(shopee_channel_cost_usd),
    marketplace_ads_usd: roundValue(marketplace_ads_usd),
    channel_fee_usd: roundValue(channel_fee_usd)
  };
}
