function escapeCsvCell(value) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }
  return stringValue;
}

export function parseCsv(text) {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      if (row.some((item) => item !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current !== "" || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  const [header, ...body] = rows;
  return body.map((cells) =>
    Object.fromEntries(
      header.map((column, index) => [column.trim(), (cells[index] ?? "").trim()])
    )
  );
}

export function stringifyCsv(rows) {
  if (!rows.length) {
    return "";
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      for (const key of Object.keys(row)) {
        set.add(key);
      }
      return set;
    }, new Set())
  );

  const lines = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => headers.map((key) => escapeCsvCell(row[key])).join(","))
  ];

  return lines.join("\n");
}

export function downloadTextFile(filename, content, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename, rows) {
  downloadTextFile(filename, stringifyCsv(rows), "text/csv;charset=utf-8");
}

export function skuCsvTemplateRows() {
  return [
    {
      sku: "SKU-001",
      product_name: "Silicone Mat",
      sku_tier: "A",
      product_cogs_cny: 80,
      actual_weight_kg: 0.8,
      length_cm: 28.5,
      width_cm: 18,
      height_cm: 12.5,
      retail_price_brl: 450,
      sales_channel: "shopee_brazil",
      fulfillment_mode: "shopee_3pf",
      payment_method: "pix",
      marketing_cpa_usd: 12,
      target_margin: 0.3,
      inventory_landed_cost_per_unit_usd: 18,
      items_per_order: 1
    }
  ];
}

export function quoteCardCsvTemplateRows() {
  return [
    {
      quote_name: "五月空运确认价",
      forwarder_name: "ABC Forwarder",
      brand_or_channel_name: "D2C",
      mode: "air_direct_mail",
      country: "Brazil",
      currency: "USD",
      billing_method: "per_kg",
      volumetric_divisor: 6000,
      base_fee_usd: 0,
      per_kg_usd: 12.5,
      min_charge_usd: 0,
      fuel_surcharge_rate: 0.05,
      valid_from: "2026-05-01",
      valid_to: "2026-05-31",
      status: "confirmed"
    }
  ];
}
