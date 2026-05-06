export const calculatorInputSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://example.com/schemas/brazil-b2c-direct-mail-input.json",
  title: "BrazilSkuPricingInput",
  type: "object",
  additionalProperties: false,
  required: [
    "product_cogs_cny",
    "cny_to_usd",
    "brl_to_usd",
    "actual_weight_kg",
    "length_cm",
    "width_cm",
    "height_cm",
    "volumetric_divisor",
    "air_freight_usd_per_kg",
    "retail_price_brl",
    "payment_method"
  ],
  properties: {
    fulfillment_mode: {
      type: "string",
      enum: [
        "china_direct_mail_air",
        "china_direct_mail_sea",
        "brazil_local_3pf",
        "mercado_livre_full",
        "shopee_3pf"
      ],
      default: "china_direct_mail_air"
    },
    sales_channel: {
      type: "string",
      enum: [
        "d2c_independent_site",
        "mercado_livre_classic",
        "mercado_livre_premium",
        "shopee_brazil"
      ],
      default: "d2c_independent_site"
    },
    product_cogs_cny: { type: "number", exclusiveMinimum: 0 },
    cny_to_usd: { type: "number", exclusiveMinimum: 0 },
    brl_to_usd: { type: "number", exclusiveMinimum: 0 },
    usd_to_brl: { type: "number", exclusiveMinimum: 0 },
    actual_weight_kg: { type: "number", exclusiveMinimum: 0 },
    length_cm: { type: "number", exclusiveMinimum: 0 },
    width_cm: { type: "number", exclusiveMinimum: 0 },
    height_cm: { type: "number", exclusiveMinimum: 0 },
    volumetric_divisor: { type: "number", exclusiveMinimum: 0 },
    air_freight_usd_per_kg: { type: "number", minimum: 0 },
    sea_freight_usd_per_cbm: { type: "number", minimum: 0, default: 0 },
    sea_freight_density_divisor: { type: "number", exclusiveMinimum: 0, default: 1000 },
    insurance_usd: { type: "number", minimum: 0, default: 0 },
    packaging_cost_usd: { type: "number", minimum: 0, default: 0 },
    marketing_cpa_usd: { type: "number", minimum: 0, default: 0 },
    inventory_landed_cost_per_unit_usd: { type: "number", minimum: 0, default: 0 },
    storage_fee_mode: { type: "string", enum: ["per_unit", "per_cbm"], default: "per_unit" },
    storage_fee_usd_per_unit_month: { type: "number", minimum: 0, default: 0.2 },
    storage_fee_usd_per_cbm_month: { type: "number", minimum: 0, default: 20 },
    avg_storage_days: { type: "number", minimum: 0, default: 30 },
    inbound_fee_usd_per_unit: { type: "number", minimum: 0, default: 0.2 },
    pick_pack_base_fee_usd: { type: "number", minimum: 0, default: 3.5 },
    pick_fee_usd_per_item: { type: "number", minimum: 0, default: 0.5 },
    pick_fee_usd_per_additional_item: { type: "number", minimum: 0, default: 0.5 },
    items_per_order: { type: "number", minimum: 1, default: 1 },
    local_packaging_cost_usd: { type: "number", minimum: 0, default: 0.4 },
    last_mile_delivery_usd: { type: "number", minimum: 0, default: 4 },
    return_rate: { type: "number", minimum: 0, maximum: 1, default: 0.03 },
    return_handling_fee_usd: { type: "number", minimum: 0, default: 1 },
    reverse_shipping_usd: { type: "number", minimum: 0, default: 4 },
    non_resellable_rate: { type: "number", minimum: 0, maximum: 1, default: 0.5 },
    warehouse_management_fee_usd: { type: "number", minimum: 0, default: 0 },
    warehouse_management_rate: { type: "number", minimum: 0, maximum: 1, default: 0 },
    retail_price_brl: { type: "number", exclusiveMinimum: 0 },
    payment_method: {
      type: "string",
      enum: ["credit_card", "pix", "custom"]
    },
    payment_fee_enabled: { type: "boolean", default: false },
    credit_card_fee_rate: { type: "number", minimum: 0, maximum: 1 },
    pix_fee_rate: { type: "number", minimum: 0, maximum: 1 },
    fx_spread_rate: { type: "number", minimum: 0, maximum: 1, default: 0 },
    icms_rate: { type: "number", minimum: 0, maximum: 1, default: 0.17 },
    ii_rate_below_50: { type: "number", minimum: 0, maximum: 1, default: 0.2 },
    ii_rate_above_50: { type: "number", minimum: 0, maximum: 1, default: 0.6 },
    ii_deduction_above_50_usd: { type: "number", minimum: 0, default: 20 },
    target_net_margin: { type: "number", minimum: 0, maximum: 0.95, default: 0.3 }
  }
};

export const calculatorOutputSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://example.com/schemas/brazil-b2c-direct-mail-output.json",
  title: "BrazilSkuPricingOutput",
  type: "object",
  additionalProperties: false,
  required: [
    "result",
    "direct_mail_breakdown",
    "local_warehouse_breakdown",
    "channel_breakdown",
    "shopee_3pf_breakdown",
    "pricing_band",
    "cpa_capacity",
    "warnings",
    "cfo_summary",
    "applied_parameters"
  ],
  properties: {
    result: { type: "object" },
    direct_mail_breakdown: { type: "object" },
    local_warehouse_breakdown: { type: "object" },
    channel_breakdown: { type: "object" },
    shopee_3pf_breakdown: { type: "object" },
    pricing_band: { type: "object" },
    cpa_capacity: { type: "object" },
    cfo_summary: { type: "object" },
    applied_parameters: { type: "object" },
    warnings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["code", "severity", "message"],
        properties: {
          code: { type: "string" },
          severity: { type: "string", enum: ["info", "warning", "critical"] },
          message: { type: "string" }
        }
      }
    }
  }
};
