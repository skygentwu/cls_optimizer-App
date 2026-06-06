import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PRICES,
  DEFAULT_PRODUCTS,
  PRODUCT_LABELS,
  PRODUCT_KEYS,
} from './products';

/**
 * product constants 测试集
 * 作用：确保产品常量的结构和数据一致性
 * 这些常量与后端模型和前端 UI 强关联，变更时需同步检查
 */
describe('product constants', () => {
  it('DEFAULT_PRICES 包含全部 4 个产品', () => {
    expect(DEFAULT_PRICES).toHaveProperty('liquid_chlorine');
    expect(DEFAULT_PRICES).toHaveProperty('hcl31');
    expect(DEFAULT_PRICES).toHaveProperty('naclo10');
    expect(DEFAULT_PRICES).toHaveProperty('naoh32');
  });

  it('DEFAULT_PRODUCTS 只包含 3 个氯产品（不含 naoh32）', () => {
    expect(DEFAULT_PRODUCTS).toHaveProperty('liquid_chlorine');
    expect(DEFAULT_PRODUCTS).toHaveProperty('hcl31');
    expect(DEFAULT_PRODUCTS).toHaveProperty('naclo10');
    expect(DEFAULT_PRODUCTS).not.toHaveProperty('naoh32');
  });

  it('PRODUCT_LABELS 为中文标签', () => {
    expect(PRODUCT_LABELS.liquid_chlorine).toBe('液氯');
    expect(PRODUCT_LABELS.hcl31).toBe('31%盐酸');
    expect(PRODUCT_LABELS.naclo10).toBe('10%次氯酸钠');
    expect(PRODUCT_LABELS.naoh32).toBe('32%液碱');
  });

  it('PRODUCT_KEYS 与 DEFAULT_PRODUCTS 的键完全一致', () => {
    // 确保 PRODUCT_KEYS 不会因为后续新增产品而遗漏
    expect(PRODUCT_KEYS).toEqual(Object.keys(DEFAULT_PRODUCTS));
  });
});
