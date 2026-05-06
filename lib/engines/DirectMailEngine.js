function roundValue(value, digits = 4) {
  return Number(value.toFixed(digits));
}

export function calculateDirectMailEngine(input) {
  const product_cogs_usd = input.product_cogs_cny * input.cny_to_usd;
  const volume_weight_kg =
    (input.length_cm * input.width_cm * input.height_cm) / input.volumetric_divisor;
  const volume_cbm = (input.length_cm * input.width_cm * input.height_cm) / 1000000;
  const chargeable_weight_kg = Math.max(input.actual_weight_kg, volume_weight_kg);
  const sea_weight_ton = input.actual_weight_kg / input.sea_freight_density_divisor;
  const chargeable_cbm = Math.max(volume_cbm, sea_weight_ton);

  const shipping_mode =
    input.fulfillment_mode === "china_direct_mail_sea" ? "sea" : "air";
  const freight_usd =
    shipping_mode === "air"
      ? chargeable_weight_kg * input.air_freight_usd_per_kg
      : chargeable_cbm * input.sea_freight_usd_per_cbm;

  const cif_usd = product_cogs_usd + freight_usd + input.insurance_usd;
  const tax_tier = cif_usd <= 50 ? "tier_1_cif_lte_50" : "tier_2_cif_gt_50";
  const tax_ii_usd =
    cif_usd <= 50
      ? cif_usd * input.ii_rate_below_50
      : Math.max(0, cif_usd * input.ii_rate_above_50 - input.ii_deduction_above_50_usd);
  const base_icms_usd = (cif_usd + tax_ii_usd) / (1 - input.icms_rate);
  const tax_icms_usd = base_icms_usd * input.icms_rate;
  const total_tax_usd = tax_ii_usd + tax_icms_usd;
  const direct_mail_landed_cost_usd = cif_usd + total_tax_usd;

  return {
    active: input.is_direct_mail_mode,
    shipping_mode,
    product_cogs_usd: roundValue(product_cogs_usd),
    volume_weight_kg: roundValue(volume_weight_kg),
    volume_cbm: roundValue(volume_cbm),
    actual_weight_kg: roundValue(input.actual_weight_kg),
    chargeable_weight_kg: roundValue(chargeable_weight_kg),
    chargeable_cbm: roundValue(chargeable_cbm),
    freight_usd: roundValue(freight_usd),
    cif_usd: roundValue(cif_usd),
    tax_tier,
    tax_ii_usd: roundValue(tax_ii_usd),
    base_icms_usd: roundValue(base_icms_usd),
    tax_icms_usd: roundValue(tax_icms_usd),
    total_tax_usd: roundValue(total_tax_usd),
    direct_mail_landed_cost_usd: roundValue(direct_mail_landed_cost_usd)
  };
}
