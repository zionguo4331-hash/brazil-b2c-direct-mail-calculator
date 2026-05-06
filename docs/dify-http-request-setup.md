# Dify HTTP Request 配置说明

适用场景：在 Dify 工作流或 Chatflow 中，用 `HTTP Request` 节点调用本项目的巴西成本计算 API。

## 1. 先确认服务地址

如果你的服务部署在一台局域网机器上，假设可访问地址为：

`http://<your-host>:3000`

请先验证健康检查：

```bash
curl "http://<your-host>:3000/api/health"
```

预期返回：

```json
{
  "ok": true,
  "service": "brazil-cost-calculator",
  "version": "1.0.0"
}
```

## 2. Dify 中的 HTTP Request 节点配置

### 请求方式

- Method: `POST`

### 请求 URL

```text
http://<your-host>:3000/api/brazil-cost-calculator/b2c-direct-mail
```

### Headers

```json
{
  "Content-Type": "application/json"
}
```

### Body 类型

- `raw`
- `JSON`

### Body 示例

```json
{
  "scenario": "b2c_direct_mail",
  "product_name": "{{product_name}}",
  "retail_price_brl": {{retail_price_brl}},
  "product_cogs_cny": {{product_cogs_cny}},
  "actual_weight_kg": {{actual_weight_kg}},
  "length_cm": {{length_cm}},
  "width_cm": {{width_cm}},
  "height_cm": {{height_cm}},
  "cny_to_usd": {{cny_to_usd}},
  "brl_to_usd": {{brl_to_usd}},
  "air_freight_usd_per_kg": {{air_freight_usd_per_kg}},
  "insurance_usd": {{insurance_usd}},
  "packaging_cost_usd": {{packaging_cost_usd}},
  "payment_method": "{{payment_method}}",
  "pix_fee_rate": {{pix_fee_rate}},
  "credit_card_fee_rate": {{credit_card_fee_rate}},
  "fx_spread_rate": {{fx_spread_rate}},
  "marketing_cpa_usd": {{marketing_cpa_usd}},
  "target_margin": {{target_margin}},
  "volumetric_divisor": {{volumetric_divisor}}
}
```

## 3. 推荐输入变量

在 Dify 上游节点中准备这些变量：

- `product_name`
- `retail_price_brl`
- `product_cogs_cny`
- `actual_weight_kg`
- `length_cm`
- `width_cm`
- `height_cm`
- `cny_to_usd`
- `brl_to_usd`
- `air_freight_usd_per_kg`
- `insurance_usd`
- `packaging_cost_usd`
- `payment_method`
- `pix_fee_rate`
- `credit_card_fee_rate`
- `fx_spread_rate`
- `marketing_cpa_usd`
- `target_margin`
- `volumetric_divisor`

## 4. 返回结构关键字段

成功时 Dify 可以直接读取这些路径：

- `body.ok`
- `body.result.net_profit_usd`
- `body.result.net_margin_percent`
- `body.result.landed_cost_usd`
- `body.result.total_cost_usd`
- `body.result.tax_tier`
- `body.cfo_summary.profit_status`
- `body.cfo_summary.risk_level`
- `body.warnings`

## 5. 建议在 Dify 中的后续处理

- 若 `body.ok == false`：走错误分支
- 若 `body.cfo_summary.profit_status == "unprofitable"`：提示当前报价亏损
- 若 `body.warnings` 非空：把 warnings 拼接给用户
- 若 `body.result.net_margin_percent >= target threshold`：输出“可售”

## 6. 本地 curl 测试

```bash
curl -X POST "http://localhost:3000/api/brazil-cost-calculator/b2c-direct-mail" \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "b2c_direct_mail",
    "product_name": "Entry Silicone Product",
    "retail_price_brl": 450,
    "product_cogs_cny": 80,
    "actual_weight_kg": 0.8,
    "length_cm": 28.5,
    "width_cm": 18,
    "height_cm": 12.5,
    "cny_to_usd": 0.14,
    "brl_to_usd": 0.20,
    "air_freight_usd_per_kg": 16.25,
    "insurance_usd": 0,
    "packaging_cost_usd": 0.6,
    "payment_method": "pix",
    "pix_fee_rate": 0.02,
    "credit_card_fee_rate": 0.045,
    "fx_spread_rate": 0.025,
    "marketing_cpa_usd": 12,
    "target_margin": 0.3,
    "volumetric_divisor": 6000
  }'
```
