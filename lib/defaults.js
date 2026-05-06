export const DEFAULTS = {
  payment: {
    credit_card_fee_rate: 0.0399,
    pix_fee_rate: 0.0099,
    fx_spread_rate: 0.01
  },
  direct_mail: {
    ii_rate_below_50: 0.2,
    ii_rate_above_50: 0.6,
    ii_deduction_above_50_usd: 20,
    icms_rate: 0.17,
    volumetric_divisor: 6000,
    sea_freight_density_divisor: 1000
  },
  local_warehouse: {
    storage_fee_mode: "per_unit",
    storage_fee_usd_per_unit_month: 0.2,
    storage_fee_usd_per_cbm_month: 20,
    avg_storage_days: 30,
    inbound_fee_usd_per_unit: 0.2,
    pick_pack_base_fee_usd: 3.5,
    pick_fee_usd_per_item: 0.5,
    pick_fee_usd_per_additional_item: 0.5,
    items_per_order: 1,
    local_packaging_cost_usd: 0.4,
    last_mile_delivery_usd: 4.0,
    return_rate: 0.03,
    return_handling_fee_usd: 1.0,
    reverse_shipping_usd: 4.0,
    non_resellable_rate: 0.5,
    warehouse_management_fee_usd: 0,
    warehouse_management_rate: 0
  },
  marketplaces: {
    mercado_livre_classic_commission_rate: 0.125,
    mercado_livre_premium_commission_rate: 0.17,
    mercado_livre_logistics_fee_usd: 4.0,
    shopee_commission_rate: 0.12,
    shopee_transaction_fee_rate: 0.02,
    shopee_service_fee_rate: 0,
    shopee_campaign_discount_rate: 0,
    shopee_coupon_cost_usd: 0,
    shopee_free_shipping_subsidy_usd: 0,
    shopee_ads_usd: 0,
    shopee_free_shipping_cost_usd: 0,
    marketplace_ads_usd: 0
  },
  shopee_3pf: {
    shopee_commission_rate: 0.12,
    shopee_transaction_fee_rate: 0.02,
    shopee_service_fee_rate: 0,
    shopee_campaign_discount_rate: 0,
    shopee_coupon_cost_usd: 0,
    shopee_free_shipping_subsidy_usd: 0,
    shopee_ads_usd: 0,
    storage_fee_usd_per_unit_month: 0.2,
    avg_storage_days: 30,
    inbound_fee_usd_per_unit: 0.2,
    pick_pack_base_fee_usd: 3.5,
    pick_fee_usd_per_item: 0.5,
    items_per_order: 1,
    local_packaging_cost_usd: 0.4,
    last_mile_delivery_usd: 4.0,
    return_rate: 0.03,
    return_handling_fee_usd: 1.0,
    reverse_shipping_usd: 4.0,
    non_resellable_rate: 0.5
  },
  pricing: {
    target_margin_scenarios: [0.3, 0.4, 0.5]
  },
  warnings: {
    cif_redline_ratio: 0.95,
    volumetric_ratio_high: 1.5,
    marketing_ratio_high: 0.3
  }
};
