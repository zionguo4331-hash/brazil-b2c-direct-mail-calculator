import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateBrazilB2CDirectMailCost } from "../lib/calculateBrazilB2CDirectMailCost.js";
import { calculatorInputSchema, calculatorOutputSchema } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const publicDir = path.join(rootDir, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function withCorsHeaders(headers = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "Content-Type",
    ...headers
  };
}

function jsonResponse(status, body) {
  return {
    status,
    headers: withCorsHeaders({ "content-type": "application/json; charset=utf-8" }),
    body: JSON.stringify(body, null, 2)
  };
}

function textResponse(status, body, contentType) {
  return {
    status,
    headers: withCorsHeaders({ "content-type": contentType }),
    body
  };
}

function buildValidationError(details, message = "Invalid input") {
  return {
    ok: false,
    error: {
      code: "VALIDATION_ERROR",
      message,
      details
    }
  };
}

function validateApiPayload(payload) {
  const details = [];
  const requiredNumbers = [
    "retail_price_brl",
    "product_cogs_cny",
    "actual_weight_kg",
    "length_cm",
    "width_cm",
    "height_cm",
    "cny_to_usd",
    "brl_to_usd",
    "air_freight_usd_per_kg",
    "insurance_usd",
    "packaging_cost_usd",
    "fx_spread_rate",
    "marketing_cpa_usd",
    "volumetric_divisor"
  ];

  for (const key of requiredNumbers) {
    const value = payload[key];
    if (!Number.isFinite(value)) {
      details.push({ field: key, issue: "must be a finite number" });
    }
  }

  if (!["pix", "credit_card", "custom"].includes(payload.payment_method)) {
    details.push({ field: "payment_method", issue: "must be pix, credit_card, or custom" });
  }

  if (payload.scenario && payload.scenario !== "b2c_direct_mail") {
    details.push({ field: "scenario", issue: "must be b2c_direct_mail" });
  }

  return details;
}

function mapApiPayloadToCoreInput(payload) {
  return {
    fulfillment_mode:
      payload.fulfillment_mode ??
      (payload.shipping_mode === "sea" ? "china_direct_mail_sea" : "china_direct_mail_air"),
    sales_channel: payload.sales_channel ?? "d2c_independent_site",
    product_cogs_cny: payload.product_cogs_cny,
    cny_to_usd: payload.cny_to_usd,
    brl_to_usd: payload.brl_to_usd,
    actual_weight_kg: payload.actual_weight_kg,
    length_cm: payload.length_cm,
    width_cm: payload.width_cm,
    height_cm: payload.height_cm,
    volumetric_divisor: payload.volumetric_divisor,
    air_freight_usd_per_kg: payload.air_freight_usd_per_kg,
    sea_freight_usd_per_cbm: payload.sea_freight_usd_per_cbm ?? 0,
    sea_freight_density_divisor: payload.sea_freight_density_divisor ?? 1000,
    insurance_usd: payload.insurance_usd,
    packaging_cost_usd: payload.packaging_cost_usd,
    marketing_cpa_usd: payload.marketing_cpa_usd,
    retail_price_brl: payload.retail_price_brl,
    payment_method: payload.payment_method,
    pix_fee_rate: payload.pix_fee_rate,
    credit_card_fee_rate: payload.credit_card_fee_rate,
    payment_fee_enabled: payload.payment_fee_enabled,
    fx_spread_rate: payload.fx_spread_rate,
    target_net_margin: payload.target_margin ?? payload.target_net_margin ?? 0.3,
    target_margin_scenarios: payload.target_margin_scenarios ?? [0.3, 0.4, 0.5],
    inventory_landed_cost_per_unit_usd: payload.inventory_landed_cost_per_unit_usd,
    local_warehouse_enabled: payload.local_warehouse_enabled,
    storage_fee_mode: payload.storage_fee_mode,
    storage_fee_usd_per_unit_month: payload.storage_fee_usd_per_unit_month,
    storage_fee_usd_per_cbm_month: payload.storage_fee_usd_per_cbm_month,
    avg_storage_days: payload.avg_storage_days,
    inbound_fee_usd_per_unit: payload.inbound_fee_usd_per_unit,
    total_inbound_fee_usd: payload.total_inbound_fee_usd,
    total_units_in_batch: payload.total_units_in_batch,
    pick_pack_base_fee_usd: payload.pick_pack_base_fee_usd,
    pick_fee_usd_per_item: payload.pick_fee_usd_per_item,
    pick_fee_usd_per_additional_item: payload.pick_fee_usd_per_additional_item,
    items_per_order: payload.items_per_order,
    local_packaging_cost_usd: payload.local_packaging_cost_usd,
    last_mile_delivery_usd: payload.last_mile_delivery_usd,
    return_rate: payload.return_rate,
    return_handling_fee_usd: payload.return_handling_fee_usd,
    reverse_shipping_usd: payload.reverse_shipping_usd,
    non_resellable_rate: payload.non_resellable_rate,
    warehouse_management_fee_usd: payload.warehouse_management_fee_usd,
    warehouse_management_rate: payload.warehouse_management_rate,
    mercado_livre_classic_commission_rate: payload.mercado_livre_classic_commission_rate,
    mercado_livre_premium_commission_rate: payload.mercado_livre_premium_commission_rate,
    mercado_livre_logistics_fee_usd: payload.mercado_livre_logistics_fee_usd,
    shopee_commission_rate: payload.shopee_commission_rate,
    shopee_transaction_fee_rate: payload.shopee_transaction_fee_rate,
    shopee_campaign_discount_rate: payload.shopee_campaign_discount_rate,
    shopee_free_shipping_cost_usd: payload.shopee_free_shipping_cost_usd,
    marketplace_ads_usd: payload.marketplace_ads_usd,
    influencer_commission_usd: payload.influencer_commission_usd,
    discount_cost_usd: payload.discount_cost_usd,
    return_reserve_usd: payload.return_reserve_usd
  };
}

function buildApiSuccess(coreResult) {
  return {
    ok: true,
    ...coreResult
  };
}

async function readStaticFile(urlPathname) {
  const relativePath = urlPathname === "/" ? "index.html" : urlPathname.replace(/^\/+/, "");
  const filePath = path.join(publicDir, relativePath);
  const ext = path.extname(filePath);
  const file = await readFile(filePath, "utf8");
  return textResponse(200, file, MIME_TYPES[ext] ?? "application/octet-stream");
}

export async function dispatchHttpRequest({
  method,
  url,
  body = "",
  rootUrl = "http://localhost"
}) {
  const requestUrl = new URL(url, rootUrl);

  if (method === "OPTIONS") {
    return {
      status: 204,
      headers: withCorsHeaders(),
      body: ""
    };
  }

  if (method === "GET" && requestUrl.pathname === "/api/health") {
    return jsonResponse(200, {
      ok: true,
      service: "brazil-cost-calculator",
      version: "1.0.0"
    });
  }

  if (method === "GET" && requestUrl.pathname === "/api/schema/input") {
    return jsonResponse(200, calculatorInputSchema);
  }

  if (method === "GET" && requestUrl.pathname === "/api/schema/output") {
    return jsonResponse(200, calculatorOutputSchema);
  }

  if (method === "POST" && requestUrl.pathname === "/api/brazil-cost-calculator/b2c-direct-mail") {
    let payload;

    try {
      payload = JSON.parse(body || "{}");
    } catch {
      return jsonResponse(400, buildValidationError([], "Invalid JSON body"));
    }

    const details = validateApiPayload(payload);
    if (details.length > 0) {
      return jsonResponse(400, buildValidationError(details));
    }

    try {
      const coreResult = calculateBrazilB2CDirectMailCost(mapApiPayloadToCoreInput(payload));
      return jsonResponse(200, buildApiSuccess(coreResult));
    } catch (error) {
      return jsonResponse(400, buildValidationError([], error.message ?? "Invalid input"));
    }
  }

  if (method === "GET") {
    try {
      return await readStaticFile(requestUrl.pathname);
    } catch (error) {
      if (error.code === "ENOENT") {
        return jsonResponse(404, {
          ok: false,
          error: {
            code: "NOT_FOUND",
            message: "Resource not found",
            details: []
          }
        });
      }

      throw error;
    }
  }

  return jsonResponse(404, {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
      details: []
    }
  });
}

export function createAppServer() {
  return http.createServer(async (req, res) => {
    try {
      const chunks = [];

      for await (const chunk of req) {
        chunks.push(chunk);
      }

      const response = await dispatchHttpRequest({
        method: req.method ?? "GET",
        url: req.url ?? "/",
        body: Buffer.concat(chunks).toString("utf8")
      });

      res.writeHead(response.status, response.headers);
      res.end(response.body);
    } catch (error) {
      const fallback = jsonResponse(500, {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error.message ?? "Unexpected server error",
          details: []
        }
      });
      res.writeHead(fallback.status, fallback.headers);
      res.end(fallback.body);
    }
  });
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectRun) {
  const server = createAppServer();
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || "0.0.0.0";

  server.listen(port, host, () => {
    console.log(`Brazil B2C direct mail calculator listening on http://${host}:${port}`);
  });
}
