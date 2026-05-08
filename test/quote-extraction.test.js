import test from "node:test";
import assert from "node:assert/strict";
import { ruleBasedQuoteExtractor } from "../public/rule-based-quote-extractor.js";
import { calculateFreightFromQuoteCard, normalizeQuoteCard } from "../public/quote-cards.js";

function buildWorkbookData() {
  return {
    fileName: "诚达运通巴西小包PRC专线报价4.24客户版(1).xlsx",
    generatedAt: "2026-05-08T00:00:00.000Z",
    warnings: [],
    sheets: [
      {
        name: "PRC专线报价",
        rows: [
          {
            rowNumber: 2,
            text: "A=运费（币种：CNY） 生效日期：2026年04月12日",
            cells: [{ columnName: "A", value: "运费（币种：CNY） 生效日期：2026年04月12日" }]
          },
          {
            rowNumber: 4,
            text: "A=巴西PRC专线-普 | B=BR1001 | D=0.050-0.50 | E=80 | F=28.82",
            cells: [
              { columnName: "A", value: "巴西PRC专线-普" },
              { columnName: "B", value: "BR1001" },
              { columnName: "D", value: "0.050-0.50" },
              { columnName: "E", value: "80" },
              { columnName: "F", value: "28.82" }
            ]
          },
          {
            rowNumber: 5,
            text: "D=0.501-1.00 | F=35.57",
            cells: [
              { columnName: "D", value: "0.501-1.00" },
              { columnName: "F", value: "35.57" }
            ]
          },
          {
            rowNumber: 11,
            text: "A=巴西PRC专线-电 | B=BR1002 | D=0.050-0.50 | E=82 | F=28.82",
            cells: [
              { columnName: "A", value: "巴西PRC专线-电" },
              { columnName: "B", value: "BR1002" },
              { columnName: "D", value: "0.050-0.50" },
              { columnName: "E", value: "82" },
              { columnName: "F", value: "28.82" }
            ]
          }
        ]
      },
      {
        name: "尾程派送报价",
        rows: [
          {
            rowNumber: 3,
            text: "D=SP-CAP | E=SP-INT1 | F=SP-INT2",
            cells: [
              { columnName: "D", value: "SP-CAP" },
              { columnName: "E", value: "SP-INT1" },
              { columnName: "F", value: "SP-INT2" }
            ]
          },
          {
            rowNumber: 5,
            text: "B=0.251 | C=0.5 | F=32.81",
            cells: [
              { columnName: "B", value: "0.251" },
              { columnName: "C", value: "0.5" },
              { columnName: "F", value: "32.81" }
            ]
          },
          {
            rowNumber: 6,
            text: "B=0.501 | C=0.75 | F=36.56",
            cells: [
              { columnName: "B", value: "0.501" },
              { columnName: "C", value: "0.75" },
              { columnName: "F", value: "36.56" }
            ]
          },
          {
            rowNumber: 7,
            text: "B=0.751 | C=1 | F=40",
            cells: [
              { columnName: "B", value: "0.751" },
              { columnName: "C", value: "1" },
              { columnName: "F", value: "40" }
            ]
          }
        ]
      },
      {
        name: "商业清关区域划分",
        rows: [
          {
            rowNumber: 3,
            text: "A=São Paulo | B=São Paulo | C=SP | D=Sudeste | E=1254000 | F=1254999 | G=SP-INT2",
            cells: [
              { columnName: "A", value: "São Paulo" },
              { columnName: "B", value: "São Paulo" },
              { columnName: "C", value: "SP" },
              { columnName: "D", value: "Sudeste" },
              { columnName: "E", value: "1254000" },
              { columnName: "F", value: "1254999" },
              { columnName: "G", value: "SP-INT2" }
            ]
          }
        ]
      }
    ]
  };
}

test("PRC workbook support sheets do not become standalone selectable quote cards", () => {
  const extraction = ruleBasedQuoteExtractor(buildWorkbookData(), { cny_to_usd: 0.1468, brl_to_usd: 0.2037 });

  assert.equal(extraction.quote_cards.length, 1);
  const packageCard = extraction.quote_cards[0];
  assert.equal(packageCard.main_prc_rates.length, 2);
  assert.equal(packageCard.tail_delivery_matrix.entries.length, 3);
  assert.equal(packageCard.postal_zone_map.entries.length, 1);
  assert.equal(packageCard.handling_fee_tiers.length, 3);
  assert.equal(packageCard.handling_fee_tiers[0].fee_cny, 28.82);
  assert.equal(packageCard.available_product_codes[0], "BR1001");
  assert.equal(packageCard.selected_product_code, "BR1001");
});

test("PRC package can resolve BR1001 + 01254-999 to SP-INT2 and 0.50kg", () => {
  const extraction = ruleBasedQuoteExtractor(buildWorkbookData(), { cny_to_usd: 0.1468, brl_to_usd: 0.2037 });
  const quoteCard = normalizeQuoteCard({
    ...extraction.quote_cards[0],
    status: "confirmed"
  });

  const freight = calculateFreightFromQuoteCard(
    {
      actual_weight_kg: 0.4,
      length_cm: 20,
      width_cm: 15,
      height_cm: 10,
      cny_to_usd: 0.1468,
      destination_cep: "01254-999",
      selected_product_code: "BR1001"
    },
    quoteCard,
    {}
  );

  assert.equal(freight.matched_postal_zone?.zone, "SP-INT2");
  assert.equal(freight.chargeable_weight_kg, 0.5);
  assert.equal(freight.prc_components?.product_code, "BR1001");
  assert.equal(freight.prc_components?.main_freight_cny, 40);
  assert.equal(freight.prc_components?.handling_fee_cny, 28.82);
  assert.equal(freight.matched_tail_delivery_entry?.fee_cny, 32.81);
});
