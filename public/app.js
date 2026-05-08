import { calculateBrazilB2CDirectMailCost } from "./calculator-core.js";
import { lookupBrazilPostalZone, normalizeBrazilCep } from "./postal-utils.js";
import {
  QUOTE_CARD_FIELDS,
  QUOTE_MODE_OPTIONS,
  QUOTE_SOURCE_OPTIONS,
  BILLING_METHOD_OPTIONS,
  QUOTE_STATUS_OPTIONS,
  applyQuoteCardToPayload,
  buildQuoteCardSummary,
  buildNextVersionQuoteCard,
  calculateFreightFromQuoteCard,
  confirmQuoteCard,
  createEmptyQuoteCard,
  evaluateQuoteConfirmation,
  findNewerVersion,
  getQuoteModeLabel,
  getUserFacingAvailability,
  isSupportOnlyQuoteCard,
  getQuoteReviewSummary,
  getQuoteSourceLabel,
  getQuoteStatusLabel,
  normalizeAiImportPayload,
  normalizeQuoteCard
} from "./quote-cards.js";
import { buildWorkbookAiText, parseXlsxFile } from "./xlsx-preprocessor.js";
import { ruleBasedQuoteExtractor } from "./rule-based-quote-extractor.js";
import {
  clearAllLocalData,
  loadQuoteCards,
  loadRecentResults,
  loadRecentSkuPreview,
  loadUserDefaults,
  saveQuoteCards,
  saveRecentResults,
  saveRecentSkuPreview,
  saveUserDefaults
} from "./storage.js";
import {
  downloadCsv,
  downloadTextFile,
  parseCsv,
  quoteCardCsvTemplateRows,
  skuCsvTemplateRows
} from "./csv-utils.js";

const form = document.querySelector("#calculator-form");
const quoteForm = document.querySelector("#quote-card-form");
const errorNode = document.querySelector("#form-error");
const fxStatusNode = document.querySelector("#fx-status");
const displayModeToggle = document.querySelector("#display-mode-toggle");
const quoteSelect = document.querySelector("#selected-quote-id");
const profitSummary = document.querySelector("#profit-summary");
const quoteSummary = document.querySelector("#quote-summary");
const prcSummary = document.querySelector("#prc-summary");
const reversePriceSummary = document.querySelector("#reverse-price-summary");
const directMailSummary = document.querySelector("#direct-mail-summary");
const localWarehouseSummary = document.querySelector("#local-warehouse-summary");
const channelSummary = document.querySelector("#channel-summary");
const shopeeSummary = document.querySelector("#shopee-summary");
const warningsNode = document.querySelector("#warnings");
const formulaNotesNode = document.querySelector("#formula-notes");
const glossaryListNode = document.querySelector("#glossary-list");
const refreshRatesButton = document.querySelector("#refresh-rates");
const storageNoticeNode = document.querySelector("#storage-notice");
const singleConclusionNode = document.querySelector("#single-conclusion");
const warehouseCepButton = document.querySelector("#use-warehouse-cep");
const resultCurrencyNote = document.querySelector("#result-currency-note");
const resultCurrencyButtons = Array.from(document.querySelectorAll("[data-result-currency]"));

const batchPreviewNode = document.querySelector("#batch-preview");
const batchResultsNode = document.querySelector("#batch-results");
const batchQuoteSelect = document.querySelector("#batch-quote-select");
const compareQuoteSelect = document.querySelector("#compare-quote-select");
const compareResultsNode = document.querySelector("#compare-results");
const compareSourceInput = document.querySelector("#compare-source");
const quoteCardListNode = document.querySelector("#quote-card-list");
const filterModeInput = document.querySelector("#filter-quote-mode");
const filterForwarderInput = document.querySelector("#filter-quote-forwarder");
const filterStatusInput = document.querySelector("#filter-quote-status");
const aiImportPreviewNode = document.querySelector("#ai-import-preview");
const aiImportJsonInput = document.querySelector("#ai-import-json");
const aiConfirmSelect = document.querySelector("#ai-confirm-quote-select");
const aiConfirmPanel = document.querySelector("#ai-confirm-panel");
const aiConfirmedByInput = document.querySelector("#ai-confirmed-by");
const excelPreprocessFileInput = document.querySelector("#excel-preprocess-file");
const excelPreprocessSummaryNode = document.querySelector("#excel-preprocess-summary");
const excelSheetSelectorNode = document.querySelector("#excel-sheet-selector");
const excelRulePreviewNode = document.querySelector("#excel-rule-preview");
const excelAiReadableTextInput = document.querySelector("#excel-ai-readable-text");
const toastRegion = document.querySelector("#toast-region");

const skuCsvFileInput = document.querySelector("#sku-csv-file");
const importQuoteCardsFileInput = document.querySelector("#import-quote-cards-file");
const importAiQuoteCardsFileInput = document.querySelector("#import-ai-quote-cards-file");
const aiImportFileInput = document.querySelector("#ai-import-file");

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
const RESULT_CURRENCY_OPTIONS = {
  CNY: { label: "人民币" },
  USD: { label: "美元" },
  BRL: { label: "雷亚尔" }
};

const SIMPLE_QUOTE_FIELDS = new Set([
  "quote_name",
  "forwarder_name",
  "brand_or_channel_name",
  "mode",
  "country",
  "currency",
  "billing_method",
  "per_kg_usd",
  "per_cbm_usd",
  "fixed_per_order_usd",
  "valid_from",
  "valid_to",
  "status",
  "notes"
]);

const GLOSSARY_ITEMS = [
  ["SKU", "单个产品款式、规格或货号，用来区分不同商品。"],
  ["CIF", "商品成本 + 国际运费 + 保险，是巴西进口计税的基础。"],
  ["II", "巴西进口关税，CIF 超过 50 美元后税负会明显提升。"],
  ["ICMS", "巴西州税，采用价内税方式计算。"],
  ["FX", "换汇损耗，BRL 换 USD / CNY 时可能出现的汇率点差。"],
  ["CBM", "立方米，海运常用体积单位。"],
  ["RT", "计费吨，通常取重量吨和体积吨中的较大值。"],
  ["CPA", "广告获客成本，也就是出一单平均花了多少广告费。"],
  ["3PF", "第三方履约，本地仓帮你存货、出库和发货。"],
  ["D2C", "独立站直接卖给消费者。"],
  ["Landed Cost", "完税到岸成本，商品到巴西后真正落地前的总成本。"],
  ["Chargeable Weight", "计费重量，通常取实重和体积重的较大值。"],
  ["Volumetric Weight", "体积重，包裹体积折算出来的重量。"],
  ["Volumetric Divisor", "体积重除数，如 6000 或 5000。"],
  ["Quote Card", "报价卡，把不同货代报价整理成系统统一可计算结构。"],
  ["Quote Library 报价库", "保存已确认、待确认、过期和禁用报价卡的地方。后续测算直接选择报价库里的报价卡。"],
  ["AI Extracted AI解析", "表示报价卡来自 AI / Dify 对原始报价文件的解析。AI解析结果默认需要人工确认。"],
  ["Confirmed Quote 已确认报价", "已经通过关键字段校验和人工业务确认，可以用于正式测算。"],
  ["Needs Review 待确认报价", "字段不完整或需要人工确认，只能用于试算。"],
  ["Expired Quote 过期报价", "超过有效期，不建议用于正式定价。"]
];

const state = {
  displayMode: "simple",
  resultCurrency: "CNY",
  quoteCards: [],
  editingQuoteId: "",
  batchRows: [],
  batchResults: loadRecentResults(),
  lastSingleResult: null,
  lastCompareResults: [],
  lastSingleQuoteMeta: null,
  aiImportDraft: null,
  workbookDraft: null,
  selectedWorkbookSheets: []
};

function showToast(type, message) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastRegion.appendChild(toast);
  window.setTimeout(() => {
    toast.remove();
  }, 2800);
}

function setButtonLoading(button, loadingText) {
  if (!button) {
    return () => {};
  }
  const original = button.textContent;
  button.disabled = true;
  button.textContent = loadingText;
  return () => {
    button.disabled = false;
    button.textContent = original;
  };
}

function formatCurrency(value, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

function getResultCurrencyLabel() {
  return RESULT_CURRENCY_OPTIONS[state.resultCurrency]?.label || "人民币";
}

function getRateSnapshot() {
  return {
    cny_to_usd: Number(cnyToUsdInput.value || 0),
    brl_to_usd: Number(brlToUsdInput.value || 0)
  };
}

function convertUsdToResultCurrency(valueUsd, currency = state.resultCurrency) {
  const amount = Number(valueUsd || 0);
  const rates = getRateSnapshot();
  if (currency === "CNY") {
    return rates.cny_to_usd > 0 ? amount / rates.cny_to_usd : amount;
  }
  if (currency === "BRL") {
    return rates.brl_to_usd > 0 ? amount / rates.brl_to_usd : amount;
  }
  return amount;
}

function convertBrlToResultCurrency(valueBrl, currency = state.resultCurrency) {
  const amount = Number(valueBrl || 0);
  const rates = getRateSnapshot();
  if (currency === "BRL") {
    return amount;
  }
  const amountUsd = amount * Number(rates.brl_to_usd || 0);
  if (currency === "CNY") {
    return rates.cny_to_usd > 0 ? amountUsd / rates.cny_to_usd : amountUsd;
  }
  return amountUsd;
}

function formatResultCurrencyFromUsd(valueUsd) {
  return formatCurrency(convertUsdToResultCurrency(valueUsd), state.resultCurrency);
}

function formatResultCurrencyFromBrl(valueBrl) {
  return formatCurrency(convertBrlToResultCurrency(valueBrl), state.resultCurrency);
}

function moneyMetricFromUsd(label, valueUsd) {
  return metric(`${label}（${getResultCurrencyLabel()}）`, formatResultCurrencyFromUsd(valueUsd));
}

function moneyMetricFromBrl(label, valueBrl) {
  return metric(`${label}（${getResultCurrencyLabel()}）`, formatResultCurrencyFromBrl(valueBrl));
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(2)}%`;
}

function roundValue(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function pill(label, className = "") {
  return `<span class="pill ${className}">${label}</span>`;
}

function optionHtml(value, label, selected = false) {
  return `<option value="${value}" ${selected ? "selected" : ""}>${label}</option>`;
}

function toValue(name, value) {
  if (value === "" || value === "NaN" || value === "undefined" || value === "null") {
    return undefined;
  }

  if (
    [
      "payment_method",
      "fulfillment_mode",
      "sales_channel",
      "storage_fee_mode",
      "selected_quote_id",
      "product_name",
      "sku",
      "destination_cep",
      "selected_product_code",
      "manual_tail_zone",
      "tail_zone_mode",
      "tail_cost_strategy",
      "tax_mode"
    ].includes(name)
  ) {
    return value;
  }

  if (["payment_fee_enabled", "fx_spread_enabled", "use_forwarder_tax_service_fee"].includes(name)) {
    return value === "true";
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function buildPayload() {
  const formData = new FormData(form);
  return Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, toValue(key, value)]));
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
      field.value = value === "NaN" || value === "undefined" || value === "null" ? "" : value;
    }
  }
}

function loadUserDefaultsIntoForm() {
  const defaults = loadUserDefaults();
  if (!defaults) {
    return;
  }
  if (defaults.result_display_currency && RESULT_CURRENCY_OPTIONS[defaults.result_display_currency]) {
    state.resultCurrency = defaults.result_display_currency;
  }
  for (const [key, value] of Object.entries(defaults)) {
    const field = form.elements.namedItem(key);
    if (field && (field.value === "" || !new URL(window.location.href).searchParams.has(key))) {
      field.value = String(value);
    }
  }
}

function persistUserDefaults(payload = buildPayload()) {
  saveUserDefaults({
    ...payload,
    result_display_currency: state.resultCurrency
  });
}

function renderFormulaNotes(formulaNotes) {
  formulaNotesNode.innerHTML = formulaNotes
    .map((item) => `<article class="formula-item"><strong>${item.title}</strong><p>${item.formula}</p></article>`)
    .join("");
}

function renderGlossary() {
  glossaryListNode.innerHTML = GLOSSARY_ITEMS
    .map(([term, description]) => `<article class="formula-item"><strong>${term}</strong><p>${description}</p></article>`)
    .join("");
}

function renderStorageNotice() {
  storageNoticeNode.innerHTML = `
    <article class="warning warning-warning">
      <strong>本机保存提醒</strong>
      <p>当前数据只保存在你的浏览器本机里。清理缓存、换电脑或换浏览器后，报价库和批量结果都可能丢失，请定期导出报价库 JSON 备份。</p>
    </article>
  `;
}

function quoteLibraryEmptyWarning() {
  return {
    code: "QUOTE_LIBRARY_EMPTY",
    severity: "warning",
    message: "当前报价库为空，请先手动新增报价卡，或导入 AI 解析结果 quote_cards.json。"
  };
}

function mergeWarnings(primaryWarnings = [], secondaryWarnings = []) {
  const merged = [];
  const seen = new Set();

  for (const warning of [...primaryWarnings, ...secondaryWarnings]) {
    const key = `${warning.code}:${warning.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(warning);
    }
  }

  return merged;
}

function renderWarnings(warnings) {
  warningsNode.innerHTML = warnings.length
    ? warnings.map((warning) => `<article class="warning warning-${warning.severity || "warning"}"><strong>${warning.code}</strong><p>${warning.message}</p></article>`).join("")
    : '<article class="warning warning-ok"><strong>OK</strong><p>当前没有触发风险提示。</p></article>';
}

function updateDisplayMode() {
  document.body.classList.toggle("simple-mode", state.displayMode === "simple");
  displayModeToggle.textContent = `当前：${state.displayMode === "simple" ? "简易模式" : "专业模式"}`;
  renderQuoteCardForm();
  renderResultCurrencyToolbar();
}

function toggleModeFields() {
  const isDirect = ["china_direct_mail_air", "china_direct_mail_sea"].includes(fulfillmentModeInput.value);
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
  cnyToUsdInput.value = Number(cache.cny_to_usd).toFixed(4);
  brlToUsdInput.value = Number(cache.brl_to_usd).toFixed(4);
}

function setFxStatus(message) {
  fxStatusNode.textContent = `汇率状态：${message}。系统每天首次打开会自动刷新一次，你也可以手动刷新。`;
}

async function refreshExchangeRates(force = false) {
  const cached = loadRateCache();
  const today = getTodayKey();

  if (!force && cached && cached.date === today) {
    applyRatesToForm(cached);
    setFxStatus(`今天已使用 ${cached.date} 汇率缓存，来源 ${cached.source || "Frankfurter"}`);
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
    setFxStatus(`今天已更新到 ${today}，来源 Frankfurter`);
    return nextCache;
  } catch (error) {
    if (cached) {
      applyRatesToForm(cached);
      setFxStatus(`刷新失败，已回退到 ${cached.date} 汇率缓存`);
      return cached;
    }
    setFxStatus("刷新失败，请手动输入");
    throw error;
  }
}

function renderResultCurrencyToolbar() {
  if (resultCurrencyNote) {
    resultCurrencyNote.textContent = `当前按${getResultCurrencyLabel()}展示结果。你可以随时切换查看人民币、美元或雷亚尔。`;
  }
  resultCurrencyButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.resultCurrency === state.resultCurrency);
  });
}

function renderTabs() {
  document.querySelectorAll("[data-tab-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-tab-target");
      document.querySelectorAll(".tab-button").forEach((item) => item.classList.remove("is-active"));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("is-active"));
      button.classList.add("is-active");
      document.getElementById(target).classList.add("is-active");
    });
  });
}

function findQuoteCard(quoteId) {
  return state.quoteCards.find((item) => item.quote_id === quoteId) || null;
}

function buildQuoteOptionLabel(quoteCard) {
  const availability = getUserFacingAvailability(quoteCard);
  const typeLabel = quoteCard.main_prc_rates?.length ? "PRC 报价包" : getQuoteModeLabel(quoteCard.mode);
  return `${quoteCard.quote_name} v${quoteCard.version || 1} | ${quoteCard.forwarder_name} | ${typeLabel} | ${availability.label}`;
}

function renderQuoteSelectors() {
  const currentSingleValue = quoteSelect.value;
  const currentBatchValues = currentSelectedValues(batchQuoteSelect);
  const currentCompareValues = currentSelectedValues(compareQuoteSelect);
  const selectableQuotes = state.quoteCards.filter((item) => item.status === "confirmed" && !isSupportOnlyQuoteCard(item));
  const options = [
    '<option value="">不使用报价卡，继续手动录入运费参数</option>',
    ...selectableQuotes
      .map((item) => `<option value="${item.quote_id}">${buildQuoteOptionLabel(item)}</option>`)
  ];
  quoteSelect.innerHTML = options.join("");
  if (currentSingleValue) {
    quoteSelect.value = currentSingleValue;
  }

  const multiOptions = selectableQuotes
    .map((item) => `<option value="${item.quote_id}">${buildQuoteOptionLabel(item)}</option>`)
    .join("");
  batchQuoteSelect.innerHTML = multiOptions;
  compareQuoteSelect.innerHTML = multiOptions;
  for (const option of batchQuoteSelect.options) {
    option.selected = currentBatchValues.includes(option.value);
  }
  for (const option of compareQuoteSelect.options) {
    option.selected = currentCompareValues.includes(option.value);
  }

  const currentAiConfirmValue = aiConfirmSelect.value;
  aiConfirmSelect.innerHTML = [
    '<option value="">请选择一张待确认报价卡</option>',
    ...state.quoteCards
      .filter((item) => ["ai_extracted", "rule_extracted"].includes(item.source) && item.status !== "disabled" && item.status !== "confirmed")
      .map((item) => `<option value="${item.quote_id}">${buildQuoteOptionLabel(item)}</option>`)
  ].join("");
  if (currentAiConfirmValue) {
    aiConfirmSelect.value = currentAiConfirmValue;
  } else if (aiConfirmSelect.options.length === 2) {
    aiConfirmSelect.selectedIndex = 1;
  }
}

function quoteFieldOptions(fieldName) {
  if (fieldName === "mode") {
    return QUOTE_MODE_OPTIONS;
  }
  if (fieldName === "billing_method") {
    return BILLING_METHOD_OPTIONS;
  }
  if (fieldName === "status") {
    return QUOTE_STATUS_OPTIONS;
  }
  if (fieldName === "source") {
    return QUOTE_SOURCE_OPTIONS;
  }
  return [];
}

function currentEditingQuoteCard() {
  return findQuoteCard(state.editingQuoteId) || createEmptyQuoteCard();
}

function renderQuoteCardForm() {
  const quoteCard = currentEditingQuoteCard();
  const fieldsHtml = QUOTE_CARD_FIELDS
    .filter(([name]) => state.displayMode === "professional" || SIMPLE_QUOTE_FIELDS.has(name))
    .map(([name, label, type]) => {
      const value = quoteCard[name] ?? "";
      const fullClass = type === "textarea" || name === "notes" ? "field-full" : "";
      if (type === "select") {
        return `
          <label class="${fullClass}">
            <span>${label}</span>
            <select name="${name}">
              ${quoteFieldOptions(name).map(([optionValue, optionLabel]) => optionHtml(optionValue, optionLabel, value === optionValue)).join("")}
            </select>
          </label>
        `;
      }
      if (type === "textarea") {
        return `
          <label class="${fullClass}">
            <span>${label}</span>
            <textarea name="${name}">${value}</textarea>
          </label>
        `;
      }
      return `
        <label class="${fullClass}">
          <span>${label}</span>
          <input name="${name}" type="${type}" value="${value}" />
        </label>
      `;
    })
    .join("");

  quoteForm.innerHTML = `
    <input type="hidden" name="quote_id" value="${quoteCard.quote_id}" />
    ${fieldsHtml}
    <div class="field-full warning-list">
      <article class="warning ${quoteCard.validation.can_confirm ? "warning-ok" : "warning-warning"}">
        <strong>当前校验状态</strong>
        <p>${quoteCard.validation.can_confirm ? "字段已满足确认要求，可以用于正式测算。" : "仍有关键字段缺失，建议先补齐后再确认。"}</p>
      </article>
      <article class="warning warning-info">
        <strong>报价库属性</strong>
        <p>来源：${getQuoteSourceLabel(quoteCard.source)}；版本：v${quoteCard.version || 1}；父版本：${quoteCard.parent_quote_id || "无"}。</p>
      </article>
    </div>
  `;
}

function quoteCardFromForm() {
  const formData = new FormData(quoteForm);
  const current = currentEditingQuoteCard();
  const next = { ...current };

  for (const [name, value] of formData.entries()) {
    if (value === "") {
      next[name] = "";
      continue;
    }
    const field = QUOTE_CARD_FIELDS.find((item) => item[0] === name);
    if (field?.[2] === "number") {
      next[name] = Number(value);
    } else {
      next[name] = value;
    }
  }

  return normalizeQuoteCard(next);
}

function persistQuoteCard(quoteCard) {
  const normalized = normalizeQuoteCard(quoteCard);
  const currentList = [...state.quoteCards];
  const index = currentList.findIndex((item) => item.quote_id === normalized.quote_id);

  if (index >= 0) {
    currentList[index] = normalized;
  } else {
    currentList.unshift(normalized);
  }

  state.quoteCards = currentList;
  saveQuoteCards(currentList);
  renderQuoteCardList();
  renderQuoteSelectors();
  renderQuoteFilterOptions();
  state.editingQuoteId = normalized.quote_id;
  renderQuoteCardForm();
  renderAiConfirmPanel();
}

function renderQuoteFilterOptions() {
  const forwarders = Array.from(new Set(state.quoteCards.map((item) => item.forwarder_name).filter(Boolean)));
  filterModeInput.innerHTML = [`<option value="">全部模式</option>`, ...QUOTE_MODE_OPTIONS.map(([value, label]) => optionHtml(value, label))].join("");
  filterStatusInput.innerHTML = [`<option value="">全部状态</option>`, ...QUOTE_STATUS_OPTIONS.map(([value, label]) => optionHtml(value, label))].join("");
  filterForwarderInput.innerHTML = [`<option value="">全部货代</option>`, ...forwarders.map((value) => optionHtml(value, value))].join("");
}

function filteredQuoteCards() {
  return state.quoteCards.filter((item) => {
    if (filterModeInput.value && item.mode !== filterModeInput.value) {
      return false;
    }
    if (filterForwarderInput.value && item.forwarder_name !== filterForwarderInput.value) {
      return false;
    }
    if (filterStatusInput.value && item.status !== filterStatusInput.value) {
      return false;
    }
    return true;
  });
}

function renderQuoteCardList() {
  const list = filteredQuoteCards();
  if (!list.length) {
    quoteCardListNode.innerHTML = '<div class="empty-state">当前报价库为空。请先手动新增报价卡，或导入 AI 解析结果 quote_cards.json。</div>';
    return;
  }

  quoteCardListNode.innerHTML = list.map((quoteCard) => {
    const validation = quoteCard.validation;
    const newerVersion = findNewerVersion(state.quoteCards, quoteCard);
    const availability = getUserFacingAvailability(quoteCard);
    const reviewLabel = {
      ready_to_confirm: "可以确认",
      needs_business_check: "还需要确认业务问题",
      needs_logistics_review: "需要物流同事复核",
      cannot_use: "暂不可直接使用"
    }[quoteCard.review_level] || quoteCard.review_level;
    const businessStatus = availability.can_formal ? pill("可正式测算", "tag-good") : availability.can_trial ? pill("可试算", "tag-bad") : pill("不可用", "tag-bad");
    const isExtracted = ["rule_extracted", "ai_extracted"].includes(quoteCard.source);
    const summaryLine = isExtracted
      ? `当前状态：${availability.label}。${availability.reason}${newerVersion ? ` 存在更新版本 v${newerVersion.version}。` : ""}`
      : `缺失字段：${validation.missing_fields.length ? validation.missing_fields.join("、") : "无"}；风险字段：${validation.risk_fields.length ? validation.risk_fields.join("、") : "无"}；${newerVersion ? `存在更新版本 v${newerVersion.version}。` : "当前未发现更新版本。"}`;
    return `
      <article class="quote-row">
        <div class="quote-row-head">
          <strong>${quoteCard.quote_name}</strong>
          ${pill(availability.label, `status-${quoteCard.status}`)}
          ${businessStatus}
        </div>
        <div class="quote-row-meta">
          ${pill(quoteCard.forwarder_name || "未填货代")}
          ${pill(getQuoteModeLabel(quoteCard.mode))}
          ${pill(`来源：${getQuoteSourceLabel(quoteCard.source)}`)}
          ${pill(`版本 v${quoteCard.version || 1}`)}
          ${pill(buildQuoteCardSummary(quoteCard))}
          ${pill(`${quoteCard.valid_from || "未填"} ~ ${quoteCard.valid_to || "未填"}`)}
        </div>
        <p class="summary-text">${summaryLine}</p>
        <div class="quote-row-actions">
          <button type="button" class="ghost-button" data-quote-action="edit" data-quote-id="${quoteCard.quote_id}">编辑</button>
          <button type="button" class="ghost-button" data-quote-action="copy" data-quote-id="${quoteCard.quote_id}">复制</button>
          <button type="button" class="ghost-button" data-quote-action="new-version" data-quote-id="${quoteCard.quote_id}">新版本</button>
          <button type="button" class="ghost-button" data-quote-action="confirm" data-quote-id="${quoteCard.quote_id}">确认报价卡</button>
          <button type="button" class="ghost-button" data-quote-action="disable" data-quote-id="${quoteCard.quote_id}">禁用</button>
          <button type="button" class="ghost-button" data-quote-action="export" data-quote-id="${quoteCard.quote_id}">导出单张 JSON</button>
          <button type="button" class="ghost-button" data-quote-action="delete" data-quote-id="${quoteCard.quote_id}">删除</button>
        </div>
      </article>
    `;
  }).join("");
}

function renderTable(node, rows) {
  if (!rows.length) {
    node.innerHTML = '<div class="empty-state">当前还没有结果。</div>';
    return;
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      for (const key of Object.keys(row)) {
        set.add(key);
      }
      return set;
    }, new Set())
  );

  node.innerHTML = `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows.map((row) => `<tr>${headers.map((header) => `<td>${row[header] ?? ""}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;
}

function buildRecommendationTags(result, combinedWarnings) {
  const tags = [];
  if (result.result.net_profit_usd > 0) {
    tags.push("profitable");
  }
  if (result.result.net_margin >= (result.applied_parameters.target_net_margin || 0)) {
    tags.push("meets_target_margin");
  }
  if (combinedWarnings.some((item) => item.code === "NEGATIVE_PROFIT")) {
    tags.push("negative_profit");
  }
  if (combinedWarnings.some((item) => item.code === "QUOTE_EXPIRED")) {
    tags.push("expired_quote");
  }
  if (combinedWarnings.some((item) => item.code === "QUOTE_NEEDS_REVIEW")) {
    tags.push("needs_review");
  }
  return tags.join("|");
}

function buildCurrentTargetPriceBrl(payload, targetMargin) {
  const output = calculateBrazilB2CDirectMailCost({
    ...payload,
    target_net_margin: targetMargin
  });
  return output.pricing_band.suggested_price_for_current_target_brl;
}

function runSingleCalculation(payload) {
  const selectedQuoteId = payload.selected_quote_id;
  let quoteMeta = null;
  let extraWarnings = [];
  let finalPayload = { ...payload };

  if (!state.quoteCards.length) {
    extraWarnings.push(quoteLibraryEmptyWarning());
  }

  if (selectedQuoteId) {
    const quoteCard = findQuoteCard(selectedQuoteId);
    if (quoteCard) {
      const freightResult = calculateFreightFromQuoteCard(payload, quoteCard, {
        estimated_units_in_batch: payload.items_per_order
      });
      finalPayload = applyQuoteCardToPayload(payload, quoteCard, freightResult);
      quoteMeta = {
        quote_id: quoteCard.quote_id,
        ...freightResult,
        quote_name: quoteCard.quote_name,
        forwarder_name: quoteCard.forwarder_name,
        quote_status: quoteCard.status,
        source: quoteCard.source,
        version: quoteCard.version
      };
      extraWarnings = freightResult.warnings;
      const newerVersion = findNewerVersion(state.quoteCards, quoteCard);
      if (newerVersion) {
        extraWarnings.push({
          code: "QUOTE_VERSION_OLD",
          severity: "warning",
          message: `当前选择的是旧版本报价卡，已存在更新版本 v${newerVersion.version}。`
        });
      }
    }
  }

  if (String(payload.destination_cep || "").replace(/\D/g, "") === "07143000") {
    extraWarnings.push({
      code: "WAREHOUSE_CEP_ESTIMATE",
      severity: "info",
      message: "当前使用的是巴西仓库 CEP 07143-000 进行区域估算。在这份货代表里它会匹配到 SP-INT1，正式定价建议改成收件人真实 CEP。"
    });
  }

  const result = calculateBrazilB2CDirectMailCost(finalPayload);
  const extraBusinessWarnings = [];
  if (result.result.net_margin < (payload.target_net_margin || 0)) {
    extraBusinessWarnings.push({
      code: "BELOW_TARGET_MARGIN",
      severity: "warning",
      message: "当前净利率低于你的目标净利率，建议重新看售价或履约结构。"
    });
  }
  const combinedWarnings = mergeWarnings(result.warnings, mergeWarnings(extraWarnings, extraBusinessWarnings));
  return {
    payload: finalPayload,
    result: {
      ...result,
      applied_parameters: {
        ...result.applied_parameters,
        selected_product_code:
          quoteMeta?.prc_components?.product_code ||
          finalPayload.selected_product_code ||
          finalPayload.selected_quote_card?.selected_product_code ||
          "",
        tax_mode: finalPayload.tax_mode,
        manual_tail_zone: finalPayload.manual_tail_zone,
        prc_main_freight_usd: quoteMeta?.prc_components ? roundValue((quoteMeta.prc_components.main_freight_cny || 0) * (quoteMeta.prc_components.cny_to_usd || 0), 4) : 0,
        prc_handling_fee_usd: quoteMeta?.prc_components ? roundValue((quoteMeta.prc_components.handling_fee_cny || 0) * (quoteMeta.prc_components.cny_to_usd || 0), 4) : 0,
        prc_tail_delivery_fee_usd: quoteMeta?.prc_components ? roundValue((quoteMeta.prc_components.tail_fee_cny || 0) * (quoteMeta.prc_components.cny_to_usd || 0), 4) : 0,
        prc_total_logistics_usd: quoteMeta?.freight_usd || 0
      },
      warnings: combinedWarnings
    },
    quoteMeta
  };
}

function renderResult(output, quoteMeta) {
  renderResultCurrencyToolbar();
  profitSummary.innerHTML = [
    moneyMetricFromUsd("销售收入", output.result.gross_revenue_usd),
    moneyMetricFromUsd("总成本", output.result.total_cost_usd),
    moneyMetricFromUsd("净利润", output.result.net_profit_usd),
    metric("净利率", formatPercent(output.result.net_margin))
  ].join("");

  const targetMargin = output.applied_parameters.target_net_margin;
  singleConclusionNode.textContent =
    output.result.net_profit_usd >= 0
      ? `结论：当前方案赚钱，净利率 ${formatPercent(output.result.net_margin)}。如果你的目标是 ${formatPercent(targetMargin)}，请重点关注风险提示和报价卡状态。`
      : `结论：当前方案亏损，建议优先检查售价、报价卡有效期、尾程成本和平台费。`;

  quoteSummary.innerHTML = quoteMeta
    ? [
      metric("使用报价卡", quoteMeta.quote_name),
      metric("货代", quoteMeta.forwarder_name),
      metric("报价卡状态", getUserFacingAvailability(findQuoteCard(quoteMeta.quote_id) || {}).label || getQuoteStatusLabel(quoteMeta.quote_status)),
      metric("来源", getQuoteSourceLabel(quoteMeta.source)),
      metric("版本", `v${quoteMeta.version || 1}`),
      metric("运费计算方式", quoteMeta.freight_method),
      metric("体积重", `${quoteMeta.volume_weight_kg} kg`),
      metric("计费重", `${quoteMeta.chargeable_weight_kg} kg`),
      metric("人工复核", quoteMeta.needs_review ? "需要" : "不需要")
    ].join("")
    : [
      metric("使用报价卡", "未选择"),
      metric("运费来源", "手动录入参数"),
      metric("人工复核", "按你当前输入判断")
    ].join("");

  reversePriceSummary.innerHTML = [
    moneyMetricFromBrl("当前目标售价", output.pricing_band.suggested_price_for_current_target_brl),
    moneyMetricFromUsd("Break-even CPA", output.cpa_capacity.break_even_cpa_usd),
    moneyMetricFromUsd("目标净利 CPA 容量", output.cpa_capacity.target_margin_cpa_usd)
  ].concat(
    output.pricing_band.scenarios.map((item) =>
      moneyMetricFromBrl(`${(item.target_net_margin * 100).toFixed(0)}% 净利率`, item.suggested_retail_price_brl)
    )
  ).join("");

  directMailSummary.innerHTML = [
    metric("是否启用", output.direct_mail_breakdown.active ? "是" : "否"),
    moneyMetricFromUsd("直邮运费", output.direct_mail_breakdown.freight_usd),
    moneyMetricFromUsd("CIF", output.direct_mail_breakdown.cif_usd),
    moneyMetricFromUsd("II", output.direct_mail_breakdown.tax_ii_usd),
    moneyMetricFromUsd("ICMS", output.direct_mail_breakdown.tax_icms_usd),
    moneyMetricFromUsd("直邮落地成本", output.direct_mail_breakdown.direct_mail_landed_cost_usd)
  ].join("");

  localWarehouseSummary.innerHTML = [
    metric("是否启用", output.local_warehouse_breakdown.active ? "是" : "否"),
    moneyMetricFromUsd("库存到仓成本", output.local_warehouse_breakdown.inventory_landed_cost_per_unit_usd),
    moneyMetricFromUsd("仓储分摊", output.local_warehouse_breakdown.storage_fee_allocated_usd),
    moneyMetricFromUsd("入库分摊", output.local_warehouse_breakdown.inbound_fee_allocated_usd),
    moneyMetricFromUsd("出库操作费", output.local_warehouse_breakdown.fulfillment_handling_fee_usd),
    moneyMetricFromUsd("尾程快递", output.local_warehouse_breakdown.last_mile_delivery_usd),
    moneyMetricFromUsd("退货期望成本", output.local_warehouse_breakdown.expected_return_cost_usd),
    moneyMetricFromUsd("本地履约总成本", output.local_warehouse_breakdown.local_fulfillment_cost_usd)
  ].join("");

  channelSummary.innerHTML = [
    metric("销售渠道", output.channel_breakdown.sales_channel),
    moneyMetricFromUsd("渠道总成本", output.channel_breakdown.channel_fee_usd),
    moneyMetricFromUsd("支付手续费", output.channel_breakdown.payment_fee_usd),
    moneyMetricFromUsd("FX 损耗", output.channel_breakdown.fx_spread_usd),
    moneyMetricFromUsd("平台佣金", output.channel_breakdown.platform_commission_usd),
    moneyMetricFromUsd("平台物流费", output.channel_breakdown.platform_logistics_fee_usd),
    moneyMetricFromUsd("Shopee 交易费", output.channel_breakdown.transaction_fee_usd),
    moneyMetricFromUsd("Marketplace Ads", output.channel_breakdown.marketplace_ads_usd)
  ].join("");

  shopeeSummary.innerHTML = [
    moneyMetricFromUsd("Shopee 佣金", output.shopee_3pf_breakdown.shopee_commission_usd),
    moneyMetricFromUsd("Shopee 交易费", output.shopee_3pf_breakdown.shopee_transaction_fee_usd),
    moneyMetricFromUsd("Shopee 服务费", output.shopee_3pf_breakdown.shopee_service_fee_usd),
    moneyMetricFromUsd("活动折扣", output.shopee_3pf_breakdown.shopee_campaign_discount_usd),
    moneyMetricFromUsd("优惠券成本", output.shopee_3pf_breakdown.shopee_coupon_cost_usd),
    moneyMetricFromUsd("免邮补贴", output.shopee_3pf_breakdown.shopee_free_shipping_subsidy_usd),
    moneyMetricFromUsd("站内广告", output.shopee_3pf_breakdown.shopee_ads_usd),
    moneyMetricFromUsd("Shopee 渠道总成本", output.shopee_3pf_breakdown.shopee_channel_cost_usd),
    moneyMetricFromUsd("本地 3PF 总成本", output.shopee_3pf_breakdown.local_3pf_cost_usd)
  ].join("");

  prcSummary.innerHTML = quoteMeta && quoteMeta.freight_method === "prc_package"
    ? [
      metric("当前报价包", quoteMeta.quote_name),
      metric("产品代码", output.applied_parameters.selected_product_code || "未选择"),
      metric("当前区域", quoteMeta.matched_postal_zone?.zone || output.applied_parameters.manual_tail_zone || "手动估算"),
      metric("税费模式", output.applied_parameters.tax_mode || "system_formula"),
      moneyMetricFromUsd("主运费", output.applied_parameters.prc_main_freight_usd || 0),
      moneyMetricFromUsd("处理费", output.applied_parameters.prc_handling_fee_usd || 0),
      moneyMetricFromUsd("尾程派送费", output.applied_parameters.prc_tail_delivery_fee_usd || 0),
      moneyMetricFromUsd("总物流成本", output.applied_parameters.prc_total_logistics_usd || quoteMeta.freight_usd || 0)
    ].join("")
    : [
      metric("当前报价包", "未使用 PRC 复合报价包"),
      metric("尾程区域", "未匹配")
    ].join("");

  renderWarnings(output.warnings);
  renderFormulaNotes(output.formula_notes);
}

function parseBatchRows(rows) {
  return rows.map((row) => ({
    sku: row.sku || "",
    product_name: row.product_name || "",
    sku_tier: row.sku_tier || "",
    product_cogs_cny: Number(row.product_cogs_cny || 0),
    actual_weight_kg: Number(row.actual_weight_kg || 0),
    length_cm: Number(row.length_cm || 0),
    width_cm: Number(row.width_cm || 0),
    height_cm: Number(row.height_cm || 0),
    retail_price_brl: Number(row.retail_price_brl || 0),
    sales_channel: row.sales_channel || "",
    fulfillment_mode: row.fulfillment_mode || "",
    payment_method: row.payment_method || "",
    marketing_cpa_usd: Number(row.marketing_cpa_usd || 0),
    target_margin: Number(row.target_margin || 0),
    inventory_landed_cost_per_unit_usd: Number(row.inventory_landed_cost_per_unit_usd || 0),
    items_per_order: Number(row.items_per_order || 1)
  }));
}

function currentSelectedValues(select) {
  return Array.from(select.selectedOptions).map((option) => option.value).filter(Boolean);
}

function buildRowPayload(basePayload, row) {
  return {
    ...basePayload,
    ...row,
    target_net_margin: row.target_margin || basePayload.target_net_margin,
    fulfillment_mode: row.fulfillment_mode || basePayload.fulfillment_mode,
    sales_channel: row.sales_channel || basePayload.sales_channel,
    payment_method: row.payment_method || basePayload.payment_method,
    inventory_landed_cost_per_unit_usd:
      row.inventory_landed_cost_per_unit_usd || basePayload.inventory_landed_cost_per_unit_usd,
    items_per_order: row.items_per_order || basePayload.items_per_order
  };
}

function buildBatchOutputRows(sourceRows, selectedQuoteIds, compareMode = false) {
  const basePayload = buildPayload();
  const quoteIds = selectedQuoteIds.length ? selectedQuoteIds : [""];
  const resultRows = [];

  for (const row of sourceRows) {
    for (const quoteId of quoteIds) {
      const payload = buildRowPayload(basePayload, row);
      payload.selected_quote_id = quoteId;
      const run = runSingleCalculation(payload);
      const breakEvenPrice = buildCurrentTargetPriceBrl(run.payload, 0);
      const margin30Price = buildCurrentTargetPriceBrl(run.payload, 0.3);
      const tags = [];
      const warningCodes = run.result.warnings.map((item) => item.code);

      if (compareMode && quoteIds.length > 1) {
        tags.push("MULTIPLE_QUOTES_SELECTED");
        warningCodes.push("MULTIPLE_QUOTES_SELECTED");
      }

      resultRows.push({
        sku: row.sku || payload.sku || "",
        product_name: row.product_name || payload.product_name || "",
        sales_channel: run.payload.sales_channel,
        fulfillment_mode: run.payload.fulfillment_mode,
        quote_name: run.quoteMeta?.quote_name || "未使用报价卡",
        forwarder_name: run.quoteMeta?.forwarder_name || "手动参数",
        quote_status: run.quoteMeta ? getQuoteStatusLabel(run.quoteMeta.quote_status) : "手动参数",
        retail_price_brl: roundValue(run.payload.retail_price_brl, 2),
        freight_usd: run.quoteMeta ? run.quoteMeta.freight_usd : run.result.direct_mail_breakdown.freight_usd,
        cif_usd: run.result.direct_mail_breakdown.cif_usd,
        tax_ii_usd: run.result.direct_mail_breakdown.tax_ii_usd,
        tax_icms_usd: run.result.direct_mail_breakdown.tax_icms_usd,
        landed_cost_usd: run.result.direct_mail_breakdown.direct_mail_landed_cost_usd,
        local_3pf_cost_usd: run.result.local_warehouse_breakdown.local_fulfillment_cost_usd,
        channel_cost_usd: run.result.channel_breakdown.channel_fee_usd,
        total_cost_usd: run.result.result.total_cost_usd,
        net_profit_usd: run.result.result.net_profit_usd,
        net_margin_percent: roundValue(run.result.result.net_margin * 100, 2),
        break_even_price_brl: roundValue(breakEvenPrice || 0, 2),
        price_for_30_margin_brl: roundValue(margin30Price || 0, 2),
        max_cpa_for_30_margin_usd: run.result.cpa_capacity.target_margin_cpa_usd,
        risk_level: run.result.cfo_summary.risk_level,
        warnings: warningCodes.join("|"),
        recommendation_tags: `${buildRecommendationTags(run.result, run.result.warnings)}${tags.length ? `|${tags.join("|")}` : ""}`,
        needs_review: run.quoteMeta?.needs_review ? "yes" : "no"
      });
    }
  }

  return resultRows;
}

function markComparisonHighlights(rows) {
  const grouped = rows.reduce((map, row) => {
    const key = row.sku || row.product_name;
    map[key] ??= [];
    map[key].push(row);
    return map;
  }, {});

  for (const group of Object.values(grouped)) {
    const lowestFreight = Math.min(...group.map((item) => Number(item.freight_usd || 0)));
    const highestProfit = Math.max(...group.map((item) => Number(item.net_profit_usd || 0)));
    const bestMargin = Math.max(...group.map((item) => Number(item.net_margin_percent || 0)));

    for (const row of group) {
      const tags = row.recommendation_tags ? row.recommendation_tags.split("|").filter(Boolean) : [];
      if (Number(row.freight_usd || 0) === lowestFreight) {
        tags.push("lowest_freight");
      }
      if (Number(row.net_profit_usd || 0) === highestProfit) {
        tags.push("highest_profit");
      }
      if (Number(row.net_margin_percent || 0) === bestMargin) {
        tags.push("best_margin");
      }
      if (row.quote_status === "已过期") {
        tags.push("expired_quote");
      }
      if (row.needs_review === "yes") {
        tags.push("needs_review");
      }
      row.recommendation_tags = Array.from(new Set(tags)).join("|");
    }
  }

  return rows;
}

function runBatchCalculation() {
  const quoteIds = currentSelectedValues(batchQuoteSelect);
  const rows = buildBatchOutputRows(state.batchRows, quoteIds);
  state.batchResults = rows;
  saveRecentResults(rows);
  renderTable(batchResultsNode, rows);
  showToast("success", "测算完成。");
}

function runCompareCalculation() {
  const quoteIds = currentSelectedValues(compareQuoteSelect);
  const sourceRows =
    compareSourceInput.value === "batch"
      ? state.batchRows
      : [buildPayload()];
  const rows = markComparisonHighlights(buildBatchOutputRows(sourceRows, quoteIds, true));
  state.lastCompareResults = rows;
  renderTable(compareResultsNode, rows);
  showToast("success", "测算完成。");
}

function renderBatchPreview() {
  renderTable(batchPreviewNode, state.batchRows);
}

function renderAiImportPreview() {
  if (!state.aiImportDraft) {
    aiImportPreviewNode.innerHTML = '<div class="empty-state">还没有 AI 导入预览。你可以上传或粘贴 quote_cards.json 后点击“预览 AI 导入结果”。</div>';
    return;
  }

  const draft = state.aiImportDraft;
  aiImportPreviewNode.innerHTML = `
    <article class="warning ${draft.safe_to_import ? "warning-ok" : "warning-warning"}">
      <strong>AI 导入概览</strong>
      <p>成功识别 ${draft.quote_cards.length} 张报价卡；全局提醒 ${draft.global_warnings.length} 条；${draft.safe_to_import ? "当前结构可导入。" : "建议先检查 JSON 结构或字段含义。"}</p>
    </article>
    ${draft.global_warnings.map((item) => `<article class="warning warning-warning"><strong>全局提醒</strong><p>${typeof item === "string" ? item : JSON.stringify(item)}</p></article>`).join("")}
    ${draft.quote_cards.map((quoteCard) => `
      <article class="warning ${quoteCard.validation.can_confirm ? "warning-ok" : "warning-warning"}">
        <strong>${quoteCard.quote_name || "未命名报价卡"}</strong>
        <p>来源：${getQuoteSourceLabel(quoteCard.source)}；状态：${getQuoteStatusLabel(quoteCard.status)}；高置信字段：${quoteCard.confidence_summary.high_confidence_fields.join("、") || "无"}；低置信字段：${quoteCard.confidence_summary.low_confidence_fields.join("、") || "无"}；需人工确认：${quoteCard.confidence_summary.needs_human_check.join("、") || "无"}；不能确认原因：${quoteCard.validation.missing_fields.join("、") || "无"}。</p>
      </article>
    `).join("")}
  `;
}

function renderAiConfirmPanel() {
  const quoteCard = findQuoteCard(aiConfirmSelect.value);
  if (!quoteCard) {
    aiConfirmPanel.innerHTML = '<div class="empty-state">请选择一张待确认报价卡。系统会先告诉你这张报价是“可正式测算、可试算还是不可用”，你只需要选择尾程费和税费怎么处理。</div>';
    return;
  }

  const evaluation = evaluateQuoteConfirmation(quoteCard, quoteCard.questions_for_user);
  const availability = getUserFacingAvailability(quoteCard);
  const summaryRows = [
    ["报价类型", quoteCard.main_prc_rates.length ? "巴西 PRC 复合报价" : getQuoteModeLabel(quoteCard.mode)],
    ["货代名称", quoteCard.forwarder_name || "未识别"],
    ["国家", quoteCard.country || "未识别"],
    ["币种", quoteCard.currency || "未识别"],
    ["产品代码", quoteCard.selected_product_code || quoteCard.available_product_codes.join(" / ") || "未识别"],
    ["主运费", availability.hasMain ? "已识别" : "未识别"],
    ["处理费", quoteCard.handling_fee_tiers.length || quoteCard.pick_pack_base_fee_usd ? "已识别" : "未识别"],
    ["尾程费用", availability.tailRecognized ? "已识别" : "未完整识别"],
    ["邮编自动匹配", availability.postalLookupAvailable ? "可用" : "不可用"],
    ["税费规则", quoteCard.tax_mode ? "已选择处理方式" : "未明确"],
    ["有效期", quoteCard.valid_to ? quoteCard.valid_to : "未识别"]
  ];
  const riskCards = [
    ...availability.blockers.map((message) => ({ title: "必须处理", message, tone: "critical" })),
    ...availability.reviewRisks.map((message) => ({ title: "建议复核", message, tone: "warning" })),
    ...availability.infoNotes.map((message) => ({ title: "信息提示", message, tone: "info" }))
  ];
  aiConfirmPanel.innerHTML = `
    <article class="warning warning-info">
      <strong>系统识别结果摘要</strong>
      <div class="metric-grid">
        ${summaryRows.map(([label, value]) => metric(label, value)).join("")}
      </div>
    </article>
    <article class="warning ${availability.can_formal ? "warning-ok" : availability.can_trial ? "warning-warning" : "warning-critical"}">
      <strong>当前可用性结论</strong>
      <p><strong>${availability.label}</strong>。${availability.reason}</p>
    </article>
    <article class="warning warning-info">
      <strong>费用处理策略</strong>
      <div class="details-grid">
        <label><span>产品代码</span><select id="business-product-code">${(quoteCard.available_product_codes.length ? quoteCard.available_product_codes : [""]).map((code) => `<option value="${code}" ${quoteCard.selected_product_code === code ? "selected" : ""}>${code || "其它"}</option>`).join("")}</select></label>
        <label><span>税费模式</span><select id="business-tax-mode">
          <option value="system_formula" ${quoteCard.tax_mode === "system_formula" ? "selected" : ""}>使用系统税费公式</option>
          <option value="forwarder_tax_model" ${quoteCard.tax_mode === "forwarder_tax_model" ? "selected" : ""}>使用货代代缴税模型</option>
          <option value="manual_tax_input" ${quoteCard.tax_mode === "manual_tax_input" ? "selected" : ""}>手动输入税费</option>
          <option value="skip_tax" ${quoteCard.tax_mode === "skip_tax" ? "selected" : ""}>暂不计算税费</option>
        </select></label>
        <label ${quoteCard.tax_mode === "manual_tax_input" ? "" : 'hidden'}>
          <span>手动税费 USD</span>
          <input id="business-manual-tax-usd" type="number" min="0" step="0.01" value="${quoteCard.manual_tax_usd || 0}" />
        </label>
        <label><span>代缴税手续费 7%</span><select id="business-tax-fee">
          <option value="true" ${quoteCard.use_forwarder_tax_service_fee ? "selected" : ""}>是</option>
          <option value="false" ${!quoteCard.use_forwarder_tax_service_fee ? "selected" : ""}>否</option>
        </select></label>
        <label><span>尾程费用怎么处理</span><select id="business-tail-cost-strategy">
          <option value="skip_for_trial" ${quoteCard.tail_cost_strategy === "skip_for_trial" ? "selected" : ""}>暂不计入，先试算</option>
          <option value="manual_input" ${quoteCard.tail_cost_strategy === "manual_input" ? "selected" : ""}>手动输入尾程费</option>
          <option value="manual_zone" ${quoteCard.tail_cost_strategy === "manual_zone" ? "selected" : ""}>手动选择区域估算</option>
          ${availability.postalLookupAvailable ? `<option value="cep_lookup" ${quoteCard.tail_cost_strategy === "cep_lookup" ? "selected" : ""}>输入 CEP 自动匹配</option>` : ""}
        </select></label>
        <label ${quoteCard.tail_cost_strategy === "manual_input" ? "" : 'hidden'}>
          <span>手动尾程费 USD</span>
          <input id="business-manual-tail-usd" type="number" min="0" step="0.01" value="${quoteCard.manual_tail_cost_usd || 0}" />
        </label>
      </div>
    </article>
    <div class="warning-list">
      ${riskCards.length
        ? riskCards.map((item) => `<article class="warning warning-${item.tone}"><strong>${item.title}</strong><p>${item.message}</p></article>`).join("")
        : '<article class="warning warning-ok"><strong>当前风险可控</strong><p>这张报价已具备较完整的测算条件。</p></article>'}
    </div>
    <details class="advanced-block advanced-only">
      <summary>识别详情，高级折叠</summary>
      <div class="warning-list">
        <article class="warning warning-info"><strong>主报价识别结果</strong><p>${JSON.stringify(quoteCard.main_prc_rates.slice(0, 10))}</p></article>
        <article class="warning warning-info"><strong>处理费识别结果</strong><p>${JSON.stringify(quoteCard.handling_fee_tiers.slice(0, 10))}</p></article>
        <article class="warning warning-info"><strong>尾程价格表样本</strong><p>${JSON.stringify(quoteCard.tail_delivery_matrix.entries.slice(0, 10))}</p></article>
        <article class="warning warning-info"><strong>邮编匹配样本</strong><p>${JSON.stringify(quoteCard.postal_zone_map.entries.slice(0, 10))}</p></article>
        <article class="warning warning-info"><strong>限制说明</strong><p>${JSON.stringify(quoteCard.restriction_notes)}</p></article>
      </div>
    </details>
    <article class="warning ${evaluation.can_confirm ? "warning-ok" : evaluation.can_trial ? "warning-info" : "warning-warning"}">
      <strong>下一步建议</strong>
      <p>${evaluation.can_confirm ? "可以直接保存为“可正式测算”，然后去做单个产品测算。" : evaluation.can_trial ? "可以先保存为“可试算”，再去做单个产品测算。正式定价前再补齐缺失费用。" : `暂时还不能使用。请先处理：${evaluation.blockingIssues.join("、")}。`}</p>
    </article>
  `;
}

function renderWorkbookPreprocessor() {
  if (!state.workbookDraft) {
    excelPreprocessSummaryNode.innerHTML = '<div class="empty-state">还没有上传 Excel 报价文件。上传后会在浏览器本地解析 Sheet、合并单元格和关键词行。</div>';
    excelSheetSelectorNode.innerHTML = "";
    excelRulePreviewNode.innerHTML = "";
    return;
  }

  const workbook = state.workbookDraft;
  const workbookWarnings = workbook.warnings || [];
  const mergedCellWarnings = workbookWarnings.filter((warning) => warning.code === "EXCEL_HAS_MERGED_CELLS");
  const otherWorkbookWarnings = workbookWarnings.filter((warning) => warning.code !== "EXCEL_HAS_MERGED_CELLS");
  const mergedCellSummary = mergedCellWarnings.length
    ? `
      <article class="warning warning-info">
        <strong>已检测到合并单元格</strong>
        <p>共有 ${mergedCellWarnings.length} 个 Sheet 存在合并单元格，系统已尝试自动处理。你现在不需要逐项检查每个价格字段，后续只需要确认少量业务问题即可。</p>
      </article>
    `
    : "";
  excelPreprocessSummaryNode.innerHTML = `
    <article class="warning warning-info">
      <strong>Excel 预处理结果</strong>
      <p>文件：${workbook.fileName}；Sheet 数：${workbook.sheets.length}；已选 Sheet：${state.selectedWorkbookSheets.length}；说明：AI 或规则识别只在新增/更新报价时使用一次。确认后的报价卡会保存在报价库中，后续测算可以反复使用。</p>
    </article>
    ${mergedCellSummary}
    ${otherWorkbookWarnings.map((warning) => `<article class="warning warning-${warning.severity || "warning"}"><strong>${warning.code}</strong><p>${warning.message}</p></article>`).join("")}
  `;

  excelSheetSelectorNode.innerHTML = workbook.sheets.map((sheet) => `
    <article class="warning warning-info">
      <label class="sheet-option">
        <input type="checkbox" data-sheet-name="${sheet.name}" ${state.selectedWorkbookSheets.includes(sheet.name) ? "checked" : ""} />
        <span>
          <strong>${sheet.name}</strong><br />
          行数 ${sheet.rowCount} / 列数 ${sheet.colCount} / 合并单元格 ${sheet.merges.length ? "是" : "否"} / 关键词行 ${sheet.keywordRows.length}
        </span>
      </label>
    </article>
  `).join("");

  const selectedSheets = workbook.sheets.filter((sheet) => state.selectedWorkbookSheets.includes(sheet.name));
  if (!selectedSheets.length) {
    excelRulePreviewNode.innerHTML = '<div class="empty-state">请先勾选一个或多个 Sheet，再生成 AI 文本和规则识别草稿。</div>';
    excelAiReadableTextInput.value = "";
    return;
  }

  const aiText = buildWorkbookAiText(workbook, state.selectedWorkbookSheets);
  excelAiReadableTextInput.value = aiText;

  const extraction = ruleBasedQuoteExtractor(workbook, {
    selectedSheetNames: state.selectedWorkbookSheets,
    cny_to_usd: Number(cnyToUsdInput.value || 0),
    brl_to_usd: Number(brlToUsdInput.value || 0)
  });
  state.workbookDraft.ruleExtraction = extraction;
  const recognizedPrcQuote = extraction.quote_cards.find((quoteCard) => quoteCard.main_prc_rates?.length);
  const nextStepMessage = extraction.quote_cards.length
    ? "下一步：点击“保存草稿并进入报价确认”，系统会把草稿写入报价库，并自动带你去做业务确认。"
    : "当前还没有可用草稿。你可以继续调整 Sheet，或改用手动新增 / AI 辅助解析。";

  excelRulePreviewNode.innerHTML = `
    <article class="warning ${extraction.quote_cards.length ? "warning-ok" : "warning-warning"}">
      <strong>本地规则识别结果</strong>
      <p>已生成 ${extraction.quote_cards.length} 张报价卡草稿；识别置信度 ${extraction.confidence}。</p>
    </article>
    <article class="warning ${extraction.quote_cards.length ? "warning-info" : "warning-warning"}">
      <strong>推荐下一步</strong>
      <p>${nextStepMessage}</p>
    </article>
    ${recognizedPrcQuote ? `
      <article class="warning warning-ok">
        <strong>系统已识别的核心信息</strong>
        <p>产品代码：${recognizedPrcQuote.available_product_codes.join(" / ") || "未识别"}；主报价：${recognizedPrcQuote.main_prc_rates.map((item) => `${item.product_code}:${item.per_kg_cny} CNY/kg`).join("；") || "未识别"}；尾程区域：${recognizedPrcQuote.tail_delivery_matrix.zones.length} 个；邮编区间：${recognizedPrcQuote.postal_zone_map.entries.length} 条。</p>
      </article>
    ` : ""}
    ${extraction.warnings.map((warning) => `<article class="warning warning-${warning.severity || "warning"}"><strong>${warning.code}</strong><p>${warning.message}</p></article>`).join("")}
    <details class="advanced-block advanced-only">
      <summary>识别详情（已提取字段：${extraction.extracted_fields.join("、") || "无"}；缺失字段：${extraction.missing_fields.join("、") || "无"}）</summary>
      ${extraction.quote_cards.map((quoteCard) => `
        <article class="warning warning-info">
          <strong>${quoteCard.quote_name}</strong>
          <p>货代：${quoteCard.forwarder_name}；报价类型：${getQuoteModeLabel(quoteCard.mode)}；计费方式：${quoteCard.billing_method}；币种：${quoteCard.currency}；报价摘要：${buildQuoteCardSummary(quoteCard)}</p>
        </article>
      `).join("")}
    </details>
    ${extraction.quote_cards.length ? extraction.quote_cards.map((quoteCard) => `
      <article class="warning ${quoteCard.review_level === "cannot_use" ? "warning-critical" : quoteCard.review_level === "ready_to_confirm" ? "warning-ok" : "warning-info"}">
        <strong>${quoteCard.quote_name}</strong>
        <p>${buildQuoteCardSummary(quoteCard)}；系统建议：${({ready_to_confirm: "可以确认", needs_business_check: "还需要确认业务问题", needs_logistics_review: "需要物流同事复核", cannot_use: "暂不可直接使用"})[quoteCard.review_level] || "待确认"}。</p>
      </article>
    `).join("") : ""}
  `;
}

function refreshAllDataViews() {
  renderResultCurrencyToolbar();
  renderQuoteSelectors();
  renderQuoteFilterOptions();
  renderQuoteCardList();
  renderAiImportPreview();
  renderAiConfirmPanel();
  renderWorkbookPreprocessor();
  renderBatchPreview();
  renderTable(batchResultsNode, state.batchResults);
  renderTable(compareResultsNode, state.lastCompareResults);
  const selectedQuote = findQuoteCard(quoteSelect.value);
  const zones = selectedQuote?.tail_delivery_matrix?.zones || [];
  document.querySelector("#manual-tail-zone").innerHTML = [
    '<option value="">自动或未选择</option>',
    ...zones.map((zone) => `<option value="${zone}">${zone}</option>`)
  ].join("");
}

function onSingleSubmit(event) {
  event.preventDefault();
  errorNode.hidden = true;

  try {
    const payload = buildPayload();
    syncUrlQuery(payload);
    persistUserDefaults(payload);
    const run = runSingleCalculation(payload);
    state.lastSingleResult = run.result;
    state.lastSingleQuoteMeta = run.quoteMeta;
    renderResult(run.result, run.quoteMeta);
    if (run.quoteMeta?.matched_postal_zone) {
      showToast("success", `已匹配区域：${run.quoteMeta.matched_postal_zone.zone}，城市：${run.quoteMeta.matched_postal_zone.city || "-"}，州：${run.quoteMeta.matched_postal_zone.state_code || "-"}.`);
    }
    showToast("success", "测算完成。");
  } catch (error) {
    errorNode.hidden = false;
    errorNode.textContent = error.message;
    showToast("error", `测算失败：${error.message}`);
  }
}

function answersFromAiConfirmPanel(quoteCard) {
  return quoteCard.questions_for_user.map((item, index) => {
    const checked = document.querySelector(`input[name="confirm-question-${index}"]:checked`);
    return {
      ...item,
      answer: checked ? checked.value : ""
    };
  });
}

function handleQuoteCardAction(action, quoteId) {
  const quoteCard = findQuoteCard(quoteId);
  if (!quoteCard) {
    return;
  }

  if (action === "edit") {
    state.editingQuoteId = quoteId;
    renderQuoteCardForm();
    return;
  }

  if (action === "copy") {
    const copied = createEmptyQuoteCard({
      ...quoteCard,
      quote_id: "",
      quote_name: `${quoteCard.quote_name}（复制）`,
      status: "draft"
    });
    persistQuoteCard(copied);
    return;
  }

  if (action === "new-version") {
    const nextVersion = buildNextVersionQuoteCard(quoteCard);
    persistQuoteCard(nextVersion);
    return;
  }

  if (action === "confirm") {
    if (["ai_extracted", "rule_extracted"].includes(quoteCard.source)) {
      aiConfirmSelect.value = quoteId;
      renderAiConfirmPanel();
      const confirmPanel = document.querySelector("#ai-confirm-panel");
      if (confirmPanel) {
        confirmPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      showToast("info", "已打开报价确认区。你现在只需要确认业务问题，不需要逐项核对所有价格字段。");
      return;
    }
    persistQuoteCard({
      ...quoteCard,
      status: "confirmed",
      confirmed_by: quoteCard.confirmed_by || "local_user"
    });
    showToast("success", "报价已确认并保存到报价库，可用于测算。");
    return;
  }

  if (action === "export") {
    downloadTextFile(
      `${quoteCard.quote_name || "quote-card"}-v${quoteCard.version || 1}.json`,
      JSON.stringify(quoteCard, null, 2),
      "application/json;charset=utf-8"
    );
    return;
  }

  if (action === "disable") {
    persistQuoteCard({
      ...quoteCard,
      status: "disabled"
    });
    return;
  }

  if (action === "delete") {
    state.quoteCards = state.quoteCards.filter((item) => item.quote_id !== quoteId);
    saveQuoteCards(state.quoteCards);
    if (state.editingQuoteId === quoteId) {
      state.editingQuoteId = "";
    }
    refreshAllDataViews();
    renderQuoteCardForm();
  }
}

function exportQuoteCardsJson() {
  if (!state.quoteCards.length) {
    showToast("error", "当前报价库为空，无法导出。");
    return;
  }
  downloadTextFile(
    `quote-library-${getTodayKey()}.json`,
    JSON.stringify({
      quote_cards: state.quoteCards,
      exported_at: new Date().toISOString()
    }, null, 2),
    "application/json;charset=utf-8"
  );
  showToast("success", "报价库已导出。");
}

function importQuoteCardsJson(file) {
  file.text().then((text) => {
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : parsed.quote_cards;
    if (!Array.isArray(rows)) {
      throw new Error("导入文件不是报价库 JSON。");
    }
    state.quoteCards = rows.map((item) => normalizeQuoteCard(item));
    saveQuoteCards(state.quoteCards);
    refreshAllDataViews();
    showToast("success", `已导入 ${state.quoteCards.length} 条报价数据。`);
  }).catch((error) => {
    showToast("error", `导入失败：${error.message}`);
  });
}

function previewAiImportFromText(text) {
  try {
    state.aiImportDraft = normalizeAiImportPayload(JSON.parse(text));
    renderAiImportPreview();
    showToast("success", `已生成 ${state.aiImportDraft.quote_cards.length} 个 AI 导入预览。`);
  } catch (error) {
    state.aiImportDraft = null;
    aiImportPreviewNode.innerHTML = `<article class="warning warning-critical"><strong>AI 导入失败</strong><p>${error.message}</p></article>`;
    showToast("error", "JSON 格式错误或不是有效的 AI 解析结果。");
  }
}

function saveAiImportedQuotes() {
  if (!state.aiImportDraft?.quote_cards?.length) {
    showToast("warning", "当前没有可保存的 AI 导入预览。");
    return;
  }
  const stopLoading = setButtonLoading(document.querySelector("#save-ai-imported-quotes"), "正在保存...");
  try {
    const merged = [...state.quoteCards];
    for (const quoteCard of state.aiImportDraft.quote_cards) {
      const normalized = normalizeQuoteCard({
        ...quoteCard,
        source: "ai_extracted",
        status: "needs_review"
      });
      const index = merged.findIndex((item) => item.quote_id === normalized.quote_id);
      if (index >= 0) {
        merged[index] = normalized;
      } else {
        merged.unshift(normalized);
      }
    }
    state.quoteCards = merged;
    const saveResult = saveQuoteCards(merged);
    if (!saveResult.ok) {
      showToast("error", `保存失败：${saveResult.error || "本地存储空间不足或数据过大"}。请尝试减少数据量或清空旧数据。`);
      return;
    }
    refreshAllDataViews();
    if (state.aiImportDraft.quote_cards[0]?.quote_id) {
      aiConfirmSelect.value = state.aiImportDraft.quote_cards[0].quote_id;
      renderAiConfirmPanel();
      showToast("success", "草稿已保存。已自动选中第一张，下面请确认业务问题后再正式使用。");
    } else {
      showToast("success", "已保存到报价库。");
    }
    const confirmPanel = document.querySelector("#ai-confirm-panel");
    if (confirmPanel) {
      confirmPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    showToast("error", `保存失败：${error.message || "未知错误"}`);
  } finally {
    stopLoading();
  }
}

function saveRuleExtractedQuotes() {
  const extraction = state.workbookDraft?.ruleExtraction;
  if (!extraction?.quote_cards?.length) {
    showToast("error", "未识别到可用报价，请尝试手动新增报价卡或使用 Dify 辅助解析。");
    return;
  }
  const stopLoading = setButtonLoading(document.querySelector("#save-rule-drafts"), "正在保存...");
  try {
    const merged = [...state.quoteCards];
    for (const quoteCard of extraction.quote_cards) {
      const normalized = normalizeQuoteCard({
        ...quoteCard,
        source: "rule_extracted",
        status: "needs_review"
      });
      const index = merged.findIndex((item) => item.quote_id === normalized.quote_id);
      if (index >= 0) {
        merged[index] = normalized;
      } else {
        merged.unshift(normalized);
      }
    }
    state.quoteCards = merged;
    const saveResult = saveQuoteCards(merged);
    if (!saveResult.ok) {
      showToast("error", `保存失败：${saveResult.error || "本地存储空间不足或数据过大"}。请尝试减少数据量或清空旧数据。`);
      return;
    }
    refreshAllDataViews();

    const firstRuleQuote = merged.find((item) => item.source === "rule_extracted");
    if (firstRuleQuote) {
      aiConfirmSelect.value = firstRuleQuote.quote_id;
      renderAiConfirmPanel();
      showToast("success", `草稿已保存（${extraction.quote_cards.length} 张）。已自动选中第一张，下面请确认业务问题后再正式使用。`);
    } else {
      showToast("success", `已保存 ${extraction.quote_cards.length} 个报价草稿到报价库。`);
    }

    const confirmPanel = document.querySelector("#ai-confirm-panel");
    if (confirmPanel) {
      confirmPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    showToast("error", `保存失败：${error.message || "未知错误"}`);
  } finally {
    stopLoading();
  }
}

function attachEvents() {
  renderTabs();

  displayModeToggle.addEventListener("click", () => {
    state.displayMode = state.displayMode === "simple" ? "professional" : "simple";
    updateDisplayMode();
    persistUserDefaults();
  });

  resultCurrencyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.resultCurrency = button.dataset.resultCurrency || "CNY";
      renderResultCurrencyToolbar();
      persistUserDefaults();
      if (state.lastSingleResult) {
        renderResult(state.lastSingleResult, state.lastSingleQuoteMeta);
      }
      showToast("success", `结果已切换为按${getResultCurrencyLabel()}展示。`);
    });
  });

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

  warehouseCepButton?.addEventListener("click", () => {
    const cepField = form.elements.namedItem("destination_cep");
    const manualZoneField = form.elements.namedItem("manual_tail_zone");
    if (cepField) {
      cepField.value = "07143-000";
    }
    if (manualZoneField) {
      manualZoneField.value = "";
    }
    const currentPayload = buildPayload();
    syncUrlQuery(currentPayload);
    showToast("success", "已带入巴西仓 CEP 07143-000 作为估算值。当前货代表会匹配到 SP-INT1。下一步：运行单 SKU 测算查看尾程估算。");
  });

  fulfillmentModeInput.addEventListener("change", toggleModeFields);
  salesChannelInput.addEventListener("change", () => {
    if (salesChannelInput.value === "d2c_independent_site") {
      paymentFeeEnabledInput.value = "false";
    }
    toggleModeFields();
  });

  form.addEventListener("submit", onSingleSubmit);

  document.querySelector("#new-quote-card").addEventListener("click", () => {
    state.editingQuoteId = "";
    renderQuoteCardForm();
  });

  document.querySelector("#save-quote-card").addEventListener("click", () => {
    const quoteCard = quoteCardFromForm();
    persistQuoteCard(quoteCard);
    showToast("success", "报价卡已保存。");
  });

  document.querySelector("#reset-quote-card").addEventListener("click", () => {
    state.editingQuoteId = "";
    renderQuoteCardForm();
  });

  document.querySelector("#export-current-quote-card").addEventListener("click", () => {
    const quoteCard = currentEditingQuoteCard();
    downloadTextFile(
      `${quoteCard.quote_name || "quote-card"}-v${quoteCard.version || 1}.json`,
      JSON.stringify(quoteCard, null, 2),
      "application/json;charset=utf-8"
    );
  });

  quoteCardListNode.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quote-action]");
    if (!button) {
      return;
    }
    handleQuoteCardAction(button.dataset.quoteAction, button.dataset.quoteId);
  });

  filterModeInput.addEventListener("change", renderQuoteCardList);
  filterForwarderInput.addEventListener("change", renderQuoteCardList);
  filterStatusInput.addEventListener("change", renderQuoteCardList);

  skuCsvFileInput.addEventListener("change", async () => {
    const file = skuCsvFileInput.files?.[0];
    if (!file) {
      return;
    }
    const rows = parseBatchRows(parseCsv(await file.text()));
    state.batchRows = rows;
    saveRecentSkuPreview(rows);
    renderBatchPreview();
  });

  document.querySelector("#load-last-sku-preview").addEventListener("click", () => {
    state.batchRows = loadRecentSkuPreview();
    renderBatchPreview();
  });

  document.querySelector("#run-batch").addEventListener("click", runBatchCalculation);
  document.querySelector("#run-compare").addEventListener("click", runCompareCalculation);

  document.querySelector("#export-batch-results").addEventListener("click", () => {
    downloadCsv(`batch-results-${getTodayKey()}.csv`, state.batchResults);
  });

  document.querySelector("#download-sku-template").addEventListener("click", () => {
    downloadCsv("sku-template.csv", skuCsvTemplateRows());
  });

  document.querySelector("#download-quote-template").addEventListener("click", () => {
    downloadCsv("quote-card-template.csv", quoteCardCsvTemplateRows());
  });

  document.querySelector("#export-quote-cards").addEventListener("click", exportQuoteCardsJson);
  document.querySelector("#import-quote-cards-trigger").addEventListener("click", () => {
    importQuoteCardsFileInput.click();
  });
  document.querySelector("#import-ai-quote-json-trigger").addEventListener("click", () => {
    importAiQuoteCardsFileInput.click();
  });
  importQuoteCardsFileInput.addEventListener("change", () => {
    const file = importQuoteCardsFileInput.files?.[0];
    if (file) {
      importQuoteCardsJson(file);
    }
  });
  importAiQuoteCardsFileInput.addEventListener("change", () => {
    const file = importAiQuoteCardsFileInput.files?.[0];
    if (file) {
      file.text().then(previewAiImportFromText);
    }
  });

  aiImportFileInput.addEventListener("change", () => {
    const file = aiImportFileInput.files?.[0];
    if (file) {
      file.text().then((text) => {
        aiImportJsonInput.value = text;
        previewAiImportFromText(text);
      });
    }
  });

  document.querySelector("#preview-ai-import").addEventListener("click", () => {
    previewAiImportFromText(aiImportJsonInput.value);
  });

  document.querySelector("#save-ai-imported-quotes").addEventListener("click", saveAiImportedQuotes);
  document.querySelector("#load-ai-import-example").addEventListener("click", () => {
    aiImportJsonInput.value = JSON.stringify({
      quote_cards: [
        {
          quote_name: "AI 解析示例空运价",
          forwarder_name: "Example Forwarder",
          mode: "air_direct_mail",
          country: "Brazil",
          currency: "USD",
          billing_method: "per_kg",
          per_kg_usd: 12.5,
          valid_from: "2026-05-01",
          valid_to: "2026-05-31",
          confidence_summary: {
            overall: "medium",
            high_confidence_fields: ["quote_name", "forwarder_name", "per_kg_usd"],
            low_confidence_fields: ["customs_clearance_fee_usd"],
            needs_human_check: ["是否包含尾程派送"]
          }
        }
      ],
      global_warnings: ["示例 JSON 仅用于演示导入流程。"],
      questions_for_user: [],
      safe_to_import: true
    }, null, 2);
    previewAiImportFromText(aiImportJsonInput.value);
  });

  excelPreprocessFileInput.addEventListener("change", async () => {
    const file = excelPreprocessFileInput.files?.[0];
    if (!file) {
      return;
    }
    const stopLoading = setButtonLoading(document.querySelector("#save-rule-drafts"), "正在解析 Excel...");
    try {
      state.workbookDraft = await parseXlsxFile(file);
      state.selectedWorkbookSheets = state.workbookDraft.sheets.map((sheet) => sheet.name);
      refreshAllDataViews();
      const extraction = state.workbookDraft.ruleExtraction;
      const hasPrc = extraction?.quote_cards?.some((item) => item.main_prc_rates?.length);
      if (hasPrc) {
        const hasTail = extraction.quote_cards.some((item) => item.tail_delivery_matrix?.entries?.length);
        const hasPostal = extraction.quote_cards.some((item) => item.postal_zone_map?.entries?.length);
        if (hasTail && hasPostal) {
          showToast("success", "已识别 PRC 主报价、尾程矩阵和邮编区域表。下一步请点击【保存草稿并进入报价确认】。");
        } else {
          showToast("warning", "已识别 PRC 主报价，但尾程矩阵或邮编区域表缺失。你仍可先保存草稿，再由业务或物流同事复核。");
        }
      } else if (extraction?.quote_cards?.length) {
        showToast("success", `已生成 ${extraction.quote_cards.length} 个报价草稿。下一步请点击【保存草稿并进入报价确认】。`);
      } else {
        showToast("warning", "未识别到可用报价，请尝试手动新增报价卡或使用 Dify 辅助解析。");
      }
      showToast("success", `Excel 已读取，识别到 ${state.workbookDraft.sheets.length} 个 Sheet。`);
      if (extraction?.quote_cards?.length) {
        document.querySelector("#excel-rule-preview").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (error) {
      state.workbookDraft = null;
      state.selectedWorkbookSheets = [];
      excelPreprocessSummaryNode.innerHTML = `<article class="warning warning-critical"><strong>Excel 预处理失败</strong><p>${error.message}</p></article>`;
      showToast("error", "Excel 解析失败，请确认文件格式为 .xlsx。");
    } finally {
      stopLoading();
    }
  });

  excelSheetSelectorNode.addEventListener("change", (event) => {
    const input = event.target.closest("[data-sheet-name]");
    if (!input) {
      return;
    }
    const name = input.getAttribute("data-sheet-name");
    if (input.checked) {
      state.selectedWorkbookSheets = Array.from(new Set([...state.selectedWorkbookSheets, name]));
    } else {
      state.selectedWorkbookSheets = state.selectedWorkbookSheets.filter((item) => item !== name);
    }
    renderWorkbookPreprocessor();
  });

  document.querySelector("#copy-ai-readable-text").addEventListener("click", async () => {
    if (!excelAiReadableTextInput.value) {
      showToast("error", "未生成文本，请先选择 Sheet。");
      return;
    }
    await navigator.clipboard.writeText(excelAiReadableTextInput.value);
    showToast("success", "已生成 AI 可读文本，可复制给 Dify 或其他 AI 工具。");
  });

  document.querySelector("#download-ai-readable-text").addEventListener("click", () => {
    downloadTextFile(
      `excel-ai-readable-${getTodayKey()}.txt`,
      excelAiReadableTextInput.value || "",
      "text/plain;charset=utf-8"
    );
    showToast("success", "已生成 AI 可读文本，可复制给 Dify 或其他 AI 工具。");
  });

  document.querySelector("#save-rule-drafts").addEventListener("click", saveRuleExtractedQuotes);

  aiConfirmSelect.addEventListener("change", renderAiConfirmPanel);
  aiConfirmPanel.addEventListener("change", () => {
    const quoteCard = findQuoteCard(aiConfirmSelect.value);
    if (!quoteCard) {
      return;
    }
    const nextQuote = normalizeQuoteCard({
      ...quoteCard,
      selected_product_code: document.querySelector("#business-product-code")?.value || quoteCard.selected_product_code,
      tax_mode: document.querySelector("#business-tax-mode")?.value || quoteCard.tax_mode,
      manual_tax_usd: Number(document.querySelector("#business-manual-tax-usd")?.value || 0),
      tail_cost_strategy: document.querySelector("#business-tail-cost-strategy")?.value || quoteCard.tail_cost_strategy,
      manual_tail_cost_usd: Number(document.querySelector("#business-manual-tail-usd")?.value || 0),
      use_forwarder_tax_service_fee: document.querySelector("#business-tax-fee")?.value === "true",
      tail_zone_mode: document.querySelector("#business-tail-cost-strategy")?.value === "cep_lookup" ? "cep_lookup" : "manual_zone",
      questions_for_user: answersFromAiConfirmPanel(quoteCard)
    });
    state.quoteCards = state.quoteCards.map((item) => item.quote_id === nextQuote.quote_id ? nextQuote : item);
    saveQuoteCards(state.quoteCards);
    renderAiConfirmPanel();
  });

  document.querySelector("#confirm-ai-quote").addEventListener("click", () => {
    const quoteCard = findQuoteCard(aiConfirmSelect.value);
    if (!quoteCard) {
      showToast("error", "请先选择一张待确认报价卡。");
      return;
    }
    const stopLoading = setButtonLoading(document.querySelector("#confirm-ai-quote"), "正在确认...");
    try {
      const answers = answersFromAiConfirmPanel(quoteCard);
      const evaluation = evaluateQuoteConfirmation(quoteCard, answers);
      if (!evaluation.can_trial) {
        const kept = normalizeQuoteCard({
          ...evaluation.quoteCard,
          questions_for_user: answers,
          status: evaluation.quoteCard.status === "expired" ? "expired" : "needs_review"
        });
        state.quoteCards = state.quoteCards.map((item) => item.quote_id === kept.quote_id ? kept : item);
        const saveResult = saveQuoteCards(state.quoteCards);
        if (!saveResult.ok) {
          showToast("error", "保存失败，请重试。");
          return;
        }
        refreshAllDataViews();
        showToast("error", `暂时还不能使用：${evaluation.blockingIssues.join("；") || "请先补齐必要信息"}。`);
        return;
      }
      const confirmed = confirmQuoteCard(quoteCard, {
        confirmedBy: aiConfirmedByInput.value || "local_user",
        answers
      });
      state.quoteCards = state.quoteCards.map((item) => item.quote_id === confirmed.quote_id ? confirmed : item);
      const saveResult = saveQuoteCards(state.quoteCards);
      if (!saveResult.ok) {
        showToast("error", "保存失败，请重试。");
        return;
      }
      refreshAllDataViews();
      if (confirmed.status === "confirmed") {
        showToast("success", "报价已保存为“可正式测算”。下一步：开始单个产品测算。");
      } else {
        showToast("success", "报价已保存为“可试算”。下一步：先做单个产品测算，正式定价前再补齐缺失费用。");
      }
    } catch (error) {
      showToast("error", `确认失败：${error.message || "未知错误"}`);
    } finally {
      stopLoading();
    }
  });

  document.querySelector("#clear-local-data").addEventListener("click", () => {
    const confirmed = window.confirm("确认要清空本机浏览器中的报价库、SKU 预览和最近结果吗？");
    if (!confirmed) {
      return;
    }
    clearAllLocalData();
    state.quoteCards = [];
    state.batchRows = [];
    state.batchResults = [];
    state.lastCompareResults = [];
    state.editingQuoteId = "";
    refreshAllDataViews();
    renderQuoteCardForm();
  });
}

state.quoteCards = loadQuoteCards().map((item) => normalizeQuoteCard(item));
state.batchRows = loadRecentSkuPreview();

applyQueryParamsToForm();
loadUserDefaultsIntoForm();
updateDisplayMode();
toggleModeFields();
renderGlossary();
renderStorageNotice();
renderQuoteCardForm();
refreshAllDataViews();
attachEvents();

try {
  await refreshExchangeRates(false);
} catch {
  setFxStatus("自动刷新失败，请手动输入或稍后重试");
}

form.requestSubmit();
