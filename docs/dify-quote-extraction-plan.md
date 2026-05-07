# Dify 报价解析助手规划

## 定位

未来 Dify 的角色是“可选 AI 报价解析助手”，而不是主系统。

利润计算的最终结果，仍然应由前端确定性公式完成。

GitHub 前端工具本身才是主系统：

- 可以上传 Excel
- 可以本地预处理
- 可以生成 AI 可读文本
- 可以做本地规则识别
- 可以生成人工确认前的报价草稿
- 可以保存到报价库
- 可以完成后续所有测算

## 建议流程

1. 用户把报价文本、聊天记录、邮件内容或截图摘要交给 Dify
2. 更推荐先用 GitHub Excel 预处理器生成 AI 可读文本
3. 再把这段 AI 可读文本交给 Dify
4. Dify 把信息整理为 `quote_cards.json`
5. GitHub 前端计算器导入 `quote_cards.json`
6. 前端计算器做字段校验和 schema normalization
7. 系统自动标记为 `needs_review`
8. 用户人工确认
9. 确认后保存进本地报价库
10. 之后所有 SKU 测算直接复用报价库

## 为什么这样设计

因为报价信息本身可能存在：

- 有效期不明确
- 附加费不完整
- 适用品类不明确
- 运输模式混淆
- 单票价与批量价混淆

如果 AI 直接决定最终报价和利润，风险太高。因此：

- Dify 负责解析
- GitHub 前端计算器负责校验、确认、保存和计算
- Dify 不参与最终财务计算

## 为什么不建议直接依赖 Dify 读取复杂 xlsx

因为复杂 Excel 常见问题包括：

- 合并单元格
- 备注区和正文混排
- 多个 Sheet 混用
- 行列含义依赖上下文

所以更稳的路径是：

1. GitHub 前端先做 Excel 预处理
2. 把结构化文本交给 Dify
3. Dify 只做语义补充

## Dify 输出建议

Dify 输出应尽量只给结构化草稿，例如：

```json
{
  "quote_cards": [
    {
      "quote_name": "五月 Shopee 3PF 草稿",
      "forwarder_name": "ABC Forwarder",
      "mode": "shopee_3pf",
      "country": "Brazil",
      "currency": "USD",
      "billing_method": "local_3pf_fee",
      "fixed_per_order_usd": 4.2,
      "last_mile_delivery_usd": 3.8,
      "status": "needs_review",
      "source": "ai_extracted",
      "confidence_summary": {
        "overall": "medium",
        "high_confidence_fields": ["quote_name", "forwarder_name"],
        "low_confidence_fields": ["customs_clearance_fee_usd"],
        "needs_human_check": ["是否包含尾程派送"]
      },
      "notes": "由 Dify 从报价文本提取，待人工确认"
    }
  ],
  "global_warnings": [],
  "questions_for_user": [],
  "safe_to_import": true
}
```

## 风控原则

- Dify 只能产出草稿
- 草稿默认 `needs_review`
- GitHub 计算器导入后才会进入报价库
- 必须人工确认后才能正式参与定价
- 最终利润、税费、净利率仍由前端公式计算
