function roundValue(value, digits = 4) {
  return Number(value.toFixed(digits));
}

export function calculateLocalWarehouseEngine(input, gross_revenue_usd) {
  const unit_cbm = (input.length_cm * input.width_cm * input.height_cm) / 1000000;

  const storage_fee_allocated_usd =
    input.storage_fee_mode === "per_cbm"
      ? unit_cbm * input.storage_fee_usd_per_cbm_month * input.avg_storage_days / 30
      : input.storage_fee_usd_per_unit_month * input.avg_storage_days / 30;

  const inbound_fee_allocated_usd =
    input.inbound_fee_usd_per_unit > 0
      ? input.inbound_fee_usd_per_unit
      : input.total_units_in_batch > 0
        ? input.total_inbound_fee_usd / input.total_units_in_batch
        : 0;

  const fulfillment_handling_fee_usd =
    input.pick_fee_usd_per_item > 0
      ? input.pick_pack_base_fee_usd +
        input.pick_fee_usd_per_item * input.items_per_order +
        input.local_packaging_cost_usd
      : input.pick_pack_base_fee_usd +
        input.pick_fee_usd_per_additional_item * Math.max(0, input.items_per_order - 1) +
        input.local_packaging_cost_usd;

  const expected_return_cost_usd =
    input.return_rate *
    (
      input.return_handling_fee_usd +
      input.reverse_shipping_usd +
      input.inventory_landed_cost_per_unit_usd * input.non_resellable_rate
    );

  const warehouse_management_fee_final_usd =
    input.warehouse_management_fee_usd +
    gross_revenue_usd * input.warehouse_management_rate;

  const local_fulfillment_cost_usd =
    storage_fee_allocated_usd +
    inbound_fee_allocated_usd +
    fulfillment_handling_fee_usd +
    input.last_mile_delivery_usd +
    expected_return_cost_usd +
    warehouse_management_fee_final_usd;

  return {
    active: input.is_local_warehouse_mode,
    inventory_landed_cost_per_unit_usd: roundValue(input.inventory_landed_cost_per_unit_usd),
    storage_fee_mode: input.storage_fee_mode,
    unit_cbm: roundValue(unit_cbm),
    storage_fee_allocated_usd: roundValue(storage_fee_allocated_usd),
    inbound_fee_allocated_usd: roundValue(inbound_fee_allocated_usd),
    fulfillment_handling_fee_usd: roundValue(fulfillment_handling_fee_usd),
    local_packaging_cost_usd: roundValue(input.local_packaging_cost_usd),
    last_mile_delivery_usd: roundValue(input.last_mile_delivery_usd),
    expected_return_cost_usd: roundValue(expected_return_cost_usd),
    warehouse_management_fee_final_usd: roundValue(warehouse_management_fee_final_usd),
    local_fulfillment_cost_usd: roundValue(local_fulfillment_cost_usd)
  };
}
