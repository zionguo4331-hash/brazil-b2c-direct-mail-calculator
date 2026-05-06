import test from "node:test";
import assert from "node:assert/strict";
import { dispatchHttpRequest } from "../src/server.js";

function buildApiPayload(overrides = {}) {
  return {
    scenario: "b2c_direct_mail",
    product_name: "Entry Silicone Product",
    fulfillment_mode: "china_direct_mail_air",
    sales_channel: "d2c_independent_site",
    retail_price_brl: 450,
    product_cogs_cny: 80,
    actual_weight_kg: 0.8,
    length_cm: 28.5,
    width_cm: 18,
    height_cm: 12.5,
    cny_to_usd: 0.14,
    brl_to_usd: 0.2,
    air_freight_usd_per_kg: 16.25,
    insurance_usd: 0,
    packaging_cost_usd: 0.6,
    payment_method: "pix",
    pix_fee_rate: 0.02,
    credit_card_fee_rate: 0.045,
    fx_spread_rate: 0.025,
    marketing_cpa_usd: 12,
    target_margin: 0.3,
    volumetric_divisor: 6000,
    ...overrides
  };
}

test("GET /api/health returns service health", async () => {
  const response = await dispatchHttpRequest({ method: "GET", url: "/api/health" });
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {
    ok: true,
    service: "brazil-cost-calculator",
    version: "1.0.0"
  });
});

test("POST API returns modular result shape", async () => {
  const response = await dispatchHttpRequest({
    method: "POST",
    url: "/api/brazil-cost-calculator/b2c-direct-mail",
    body: JSON.stringify(buildApiPayload())
  });

  const body = JSON.parse(response.body);
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.ok(body.result.net_profit_usd > 0);
  assert.ok(body.direct_mail_breakdown.cif_usd > 0);
  assert.equal(body.channel_breakdown.sales_channel, "d2c_independent_site");
});

test("POST API validates bad input", async () => {
  const response = await dispatchHttpRequest({
    method: "POST",
    url: "/api/brazil-cost-calculator/b2c-direct-mail",
    body: JSON.stringify({ scenario: "b2c_direct_mail", retail_price_brl: "bad" })
  });

  const body = JSON.parse(response.body);
  assert.equal(response.status, 400);
  assert.equal(body.ok, false);
  assert.equal(body.error.code, "VALIDATION_ERROR");
});
