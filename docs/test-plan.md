# 测试计划

## 目标

确认“巴西 SKU 利润与物流报价决策器 MVP”在纯前端静态环境下可用，并且核心业务路径可完成。

## 重点测试项

1. 新增 confirmed 空运报价卡
2. 新增 needs_review 报价卡
3. 单 SKU 使用报价卡计算空运
4. CIF 接近 50 美元红线
5. CIF 超过 50 美元高税档
6. 海运 per_cbm 报价测算
7. Shopee 3PF 测算
8. Mercado Livre Classic vs Premium
9. 批量上传 3 个 SKU
10. 多货代报价对比
11. 报价过期 warning
12. 术语解释是否显示
13. 导出 / 导入报价卡 JSON
14. 导出结果 CSV
15. npm run build 成功

## 手工检查建议

### 报价卡

- 新增报价卡后是否自动保存到 localStorage
- 缺少关键字段时是否自动变成 needs_review
- confirmed 报价卡清空关键字段后是否自动降级
- valid_to 过期后是否标记 expired

### 单 SKU

- 不选报价卡时是否仍能用手动参数计算
- 选 confirmed 报价卡时是否自动带入运费 / 本地仓费
- 选 needs_review / expired 报价卡时是否出现风险提示

### 批量

- 上传 CSV 后是否有预览
- 多报价卡批量运行后是否按 SKU × 报价卡生成结果
- 导出 CSV 后字段是否完整

### 多报价对比

- 是否自动标出 lowest_freight
- 是否自动标出 highest_profit
- 是否自动标出 best_margin
- needs_review / expired_quote 是否被标注

## 构建检查

- 页面是否仍然是纯前端静态应用
- 是否不依赖 localhost
- 是否不依赖后端 API
- 是否可以直接静态托管
