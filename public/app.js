import { calculateBrazilB2CDirectMailCost } from "./calculator-core.js";

const form = document.querySelector("#calculator-form");
const errorNode = document.querySelector("#form-error");
const fxStatusNode = document.querySelector("#fx-status");
const profitSummary = document.querySelector("#profit-summary");
const reversePriceSummary = document.querySelector("#reverse-price-summary");
const directMailSummary = document.querySelector("#direct-mail-summary");
const localWarehouseSummary = document.querySelector("#local-warehouse-summary");
const channelSummary = document.querySelector("#channel-summary");
const shopeeSummary = document.querySelector("#shopee-summary");
const warningsNode = document.querySelector("#warnings");
const formulaNotesNode = document.querySelector("#formula-notes");
const refreshRatesButton = document.querySelector("#refresh-rates");

const paymentMethodInput = form.querySelector('select[name="payment_method"]');
const fulfillmentModeInput = form.querySelector('select[name="fulfillment_mode"]');
const salesChannelInput = form.querySelector('select[name="sales_channel"]');
const paymentFeeEnabledInput = form.querySelector('select[name="payment_fee_enabled"]');
const brlToUsdInput = form.querySelector('input[name="brl_to_usd"]');
const cnyToUsdInput = form.querySelector('input[name="cny_to_usd"]');
const creditCardFeeRateInput = form.querySelector('input[name="credit_card_fee_rate"]');
const pixFeeRateInput = form.querySelector('input[name="pix_fee_rate"]');

const FX_CACHE_KEY = "brazil-b2c-direct-fx-cache-v1";
const FX_SOURCE_URL = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=CNY,BRL";

refreshRatesButton.addEventListener("click", async () => {
  await refreshExchangeRates(true);
  form.requestSubmit();
});

paymentMethodInput.addEventListener("change", () => {
  if (paymentMethodInput.value === "credit_card") {
    creditCardFeeRateInput.focus();
  }
  if (paymentMethodInput.value === "pix") {
    pixFeeRateInput.focus();
  }
});

fulfillmentModeInput.addEventListener("change", () => {
  toggleModeFields();
});

salesChannelInput.addEventListener("change", () => {
  if (salesChannelInput.value === "d2c_independent_site") {
    paymentFeeEnabledInput.value = "false";
  }
  toggleModeFields();
});

function toggleModeFields() {
  const isDirect = fulfillmentModeInput.value === "china_direct_mail_air" || fulfillmentModeInput.value === "china_direct_mail_sea";
  const isLocal = !isDirect;
  const isShopee = salesChannelInput.value === "shopee_brazil" || fulfillmentModeInput.value === "shopee_3pf";

  for (const node of document.querySelectorAll("[data-mode='direct']")) {
    node.hidden = !isDirect;
  }

  for (const node of document.querySelectorAll("[data-mode='local']")) {
    node.hidden = !isLocal;
  }

  for (const node of document.querySelectorAll("[data-mode='shopee']")) {
    node.hidden = !isShopee;
  }
}

function toValue(name, value) {
  if (value === "") {
    return undefined;
  }

  if (name === "payment_method" || name === "fulfillment_mode" || name === "sales_channel" || name === "storage_fee_mode") {
    return value;
  }

  if (name === "payment_fee_enabled") {
    return value === "true";
  }

  if (name === "fx_spread_enabled") {
    return value === "true";
  }

  return Number(value);
}

function formatCurrency(value, currency = "USD") {
  if (value === null || value === undefined) {
    return "-";
  }
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function buildPayload() {
  const formData = new FormData(form);
  return Object.fromEntries(
    Array.from(formData.entries()).map(([key, value]) => [key, toValue(key, value)])
  );
}

async function calculate(payload) {
  return calculateBrazilB2CDirectMailCost(payload);
}

function syncUrlQuery(payload) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === "") {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  window.history.replaceState({}, "", url);
}

function applyQueryParamsToForm() {
  const url = new URL(window.location.href);
  for (const [key, value] of url.searchParams.entries()) {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = value;
    }
  }
}

function renderFormulaNotes(formulaNotes) {
  formulaNotesNode.innerHTML = formulaNotes
    .map((item) => `<article class="formula-item"><strong>${item.title}</strong><p>${item.formula}</p></article>`)
    .join("");
}

function renderWarnings(warnings) {
  warningsNode.innerHTML = warnings.length
    ? warnings.map((warning) => `<article class="warning warning-${warning.severity}"><strong>${warning.code}</strong><p>${warning.message}</p></article>`).join("")
    : '<article class="warning warning-ok"><strong>OK</strong><p>当前没有触发预警。</p></article>';
}

function renderResult(output) {
  profitSummary.innerHTML = [
    metric("销售收入", formatCurrency(output.result.gross_revenue_usd, "USD")),
    metric("总成本", formatCurrency(output.result.total_cost_usd, "USD")),
    metric("净利润", formatCurrency(output.result.net_profit_usd, "USD")),
    metric("净利率", formatPercent(output.result.net_margin))
  ].join("");

  reversePriceSummary.innerHTML = [
    metric("当前目标售价", formatCurrency(output.pricing_band.suggested_price_for_current_target_brl, "BRL")),
    metric("Break-even CPA", formatCurrency(output.cpa_capacity.break_even_cpa_usd, "USD")),
    metric("目标净利 CPA 容量", formatCurrency(output.cpa_capacity.target_margin_cpa_usd, "USD"))
  ].concat(
    output.pricing_band.scenarios.map((item) =>
      metric(`${(item.target_net_margin * 100).toFixed(0)}% 净利率`, formatCurrency(item.suggested_retail_price_brl, "BRL"))
    )
  ).join("");

  directMailSummary.innerHTML = [
    metric("是否启用", output.direct_mail_breakdown.active ? "是" : "否"),
    metric("直邮运费", formatCurrency(output.direct_mail_breakdown.freight_usd, "USD")),
    metric("CIF", formatCurrency(output.direct_mail_breakdown.cif_usd, "USD")),
    metric("II", formatCurrency(output.direct_mail_breakdown.tax_ii_usd, "USD")),
    metric("ICMS", formatCurrency(output.direct_mail_breakdown.tax_icms_usd, "USD")),
    metric("直邮落地成本", formatCurrency(output.direct_mail_breakdown.direct_mail_landed_cost_usd, "USD"))
  ].join("");

  localWarehouseSummary.innerHTML = [
    metric("是否启用", output.local_warehouse_breakdown.active ? "是" : "否"),
    metric("库存到仓成本", formatCurrency(output.local_warehouse_breakdown.inventory_landed_cost_per_unit_usd, "USD")),
    metric("仓储分摊", formatCurrency(output.local_warehouse_breakdown.storage_fee_allocated_usd, "USD")),
    metric("入库分摊", formatCurrency(output.local_warehouse_breakdown.inbound_fee_allocated_usd, "USD")),
    metric("出库操作费", formatCurrency(output.local_warehouse_breakdown.fulfillment_handling_fee_usd, "USD")),
    metric("尾程快递", formatCurrency(output.local_warehouse_breakdown.last_mile_delivery_usd, "USD")),
    metric("退货期望成本", formatCurrency(output.local_warehouse_breakdown.expected_return_cost_usd, "USD")),
    metric("本地履约总成本", formatCurrency(output.local_warehouse_breakdown.local_fulfillment_cost_usd, "USD"))
  ].join("");

  channelSummary.innerHTML = [
    metric("销售渠道", output.channel_breakdown.sales_channel),
    metric("渠道总成本", formatCurrency(output.channel_breakdown.channel_fee_usd, "USD")),
    metric("支付手续费", formatCurrency(output.channel_breakdown.payment_fee_usd, "USD")),
    metric("FX 损耗", formatCurrency(output.channel_breakdown.fx_spread_usd, "USD")),
    metric("平台佣金", formatCurrency(output.channel_breakdown.platform_commission_usd, "USD")),
    metric("平台物流费", formatCurrency(output.channel_breakdown.platform_logistics_fee_usd, "USD")),
    metric("Shopee 交易费", formatCurrency(output.channel_breakdown.transaction_fee_usd, "USD")),
    metric("Marketplace Ads", formatCurrency(output.channel_breakdown.marketplace_ads_usd, "USD"))
  ].join("");

  shopeeSummary.innerHTML = [
    metric("Shopee 佣金", formatCurrency(output.shopee_3pf_breakdown.shopee_commission_usd, "USD")),
    metric("Shopee 交易费", formatCurrency(output.shopee_3pf_breakdown.shopee_transaction_fee_usd, "USD")),
    metric("Shopee 服务费", formatCurrency(output.shopee_3pf_breakdown.shopee_service_fee_usd, "USD")),
    metric("活动折扣", formatCurrency(output.shopee_3pf_breakdown.shopee_campaign_discount_usd, "USD")),
    metric("优惠券成本", formatCurrency(output.shopee_3pf_breakdown.shopee_coupon_cost_usd, "USD")),
    metric("免邮补贴", formatCurrency(output.shopee_3pf_breakdown.shopee_free_shipping_subsidy_usd, "USD")),
    metric("站内广告", formatCurrency(output.shopee_3pf_breakdown.shopee_ads_usd, "USD")),
    metric("Shopee 渠道总成本", formatCurrency(output.shopee_3pf_breakdown.shopee_channel_cost_usd, "USD")),
    metric("仓储分摊", formatCurrency(output.shopee_3pf_breakdown.storage_fee_allocated_usd, "USD")),
    metric("入库分摊", formatCurrency(output.shopee_3pf_breakdown.inbound_fee_allocated_usd, "USD")),
    metric("出库操作费", formatCurrency(output.shopee_3pf_breakdown.fulfillment_handling_fee_usd, "USD")),
    metric("尾程快递", formatCurrency(output.shopee_3pf_breakdown.last_mile_delivery_usd, "USD")),
    metric("退货期望成本", formatCurrency(output.shopee_3pf_breakdown.expected_return_cost_usd, "USD")),
    metric("本地 3PF 总成本", formatCurrency(output.shopee_3pf_breakdown.local_3pf_cost_usd, "USD"))
  ].join("");

  renderWarnings(output.warnings);
  renderFormulaNotes(output.formula_notes);
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadRateCache() {
  try {
    const raw = localStorage.getItem(FX_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveRateCache(payload) {
  localStorage.setItem(FX_CACHE_KEY, JSON.stringify(payload));
}

function applyRatesToForm(cache) {
  cnyToUsdInput.value = cache.cny_to_usd.toFixed(4);
  brlToUsdInput.value = cache.brl_to_usd.toFixed(4);
}

function setFxStatus(message) {
  fxStatusNode.textContent = `汇率状态：${message}`;
}

async function refreshExchangeRates(force = false) {
  const cached = loadRateCache();
  const today = getTodayKey();

  if (!force && cached && cached.date === today) {
    applyRatesToForm(cached);
    setFxStatus(`已使用 ${cached.date} 缓存，来源 Frankfurter`);
    return cached;
  }

  try {
    setFxStatus("正在刷新...");
    const response = await fetch(FX_SOURCE_URL);
    if (!response.ok) {
      throw new Error("汇率接口返回失败");
    }

    const data = await response.json();
    const nextCache = {
      date: today,
      source: "Frankfurter",
      cny_to_usd: Number((1 / data.rates.CNY).toFixed(4)),
      brl_to_usd: Number((1 / data.rates.BRL).toFixed(4))
    };
    saveRateCache(nextCache);
    applyRatesToForm(nextCache);
    setFxStatus(`已更新到 ${today}，来源 Frankfurter`);
    return nextCache;
  } catch (error) {
    if (cached) {
      applyRatesToForm(cached);
      setFxStatus(`刷新失败，已回退到 ${cached.date} 缓存`);
      return cached;
    }
    setFxStatus("刷新失败，请手动输入");
    throw error;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorNode.hidden = true;

  try {
    const payload = buildPayload();
    syncUrlQuery(payload);
    const result = await calculate(payload);
    renderResult(result);
  } catch (error) {
    errorNode.hidden = false;
    errorNode.textContent = error.message;
  }
});

applyQueryParamsToForm();
toggleModeFields();

try {
  await refreshExchangeRates(false);
} catch {
  setFxStatus("自动刷新失败，请手动输入或稍后重试");
}

form.requestSubmit();
