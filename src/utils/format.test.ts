import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatCurrency,
  formatTons,
  formatPercent,
  formatDate,
  formatDateTime,
} from './format';

/**
 * formatNumber 测试集
 * 功能：将数字格式化为千分位字符串，支持指定小数位
 */
describe('formatNumber', () => {
  it('整数保留两位小数', () => {
    expect(formatNumber(1234)).toBe('1,234.00');
  });

  it('浮点数四舍五入', () => {
    expect(formatNumber(1234.567, 2)).toBe('1,234.57');
  });

  it('非法值返回 "-"', () => {
    expect(formatNumber(null)).toBe('-');
    expect(formatNumber(undefined)).toBe('-');
    expect(formatNumber(NaN)).toBe('-');
  });

  it('负数正常格式化', () => {
    expect(formatNumber(-500.5, 1)).toBe('-500.5');
  });
});

/**
 * formatCurrency 测试集
 * 功能：金额格式化，前缀加 ¥，默认无小数位
 */
describe('formatCurrency', () => {
  it('前缀为 ¥，默认 0 位小数', () => {
    expect(formatCurrency(15000)).toBe('¥15,000');
  });

  it('小数四舍五入到整数', () => {
    expect(formatCurrency(15000.6)).toBe('¥15,001');
  });

  it('非法值返回 "-"', () => {
    expect(formatCurrency(null)).toBe('-');
  });
});

/**
 * formatTons 测试集
 * 功能：产量格式化，后缀加 "吨"，默认 1 位小数
 */
describe('formatTons', () => {
  it('后缀为 "吨"，保留 1 位小数', () => {
    expect(formatTons(88.25)).toBe('88.3 吨');
  });

  it('非法值返回 "-"', () => {
    expect(formatTons(undefined)).toBe('-');
  });
});

/**
 * formatPercent 测试集
 * 功能：百分比格式化，值乘以 100 后加 % 号
 */
describe('formatPercent', () => {
  it('小数自动转百分比', () => {
    expect(formatPercent(0.1234)).toBe('12.3%');
  });

  it('支持自定义小数位', () => {
    expect(formatPercent(0.1234, 2)).toBe('12.34%');
  });

  it('非法值返回 "-"', () => {
    expect(formatPercent(null)).toBe('-');
  });
});

/**
 * formatDate 测试集
 * 功能：日期格式化为 zh-CN 风格（YYYY/MM/DD）
 */
describe('formatDate', () => {
  it('ISO 字符串转中文日期', () => {
    expect(formatDate('2026-06-06')).toBe('2026/06/06');
  });

  it('支持 Date 对象输入', () => {
    expect(formatDate(new Date('2026-06-06'))).toBe('2026/06/06');
  });

  it('空值或非法日期返回 "-"', () => {
    expect(formatDate('')).toBe('-');
    expect(formatDate(null)).toBe('-');
    expect(formatDate('not-a-date')).toBe('-');
  });
});

/**
 * formatDateTime 测试集
 * 功能：日期时间格式化为 zh-CN 风格（YYYY/MM/DD HH:mm）
 */
describe('formatDateTime', () => {
  it('ISO 字符串含时间', () => {
    const result = formatDateTime('2026-06-06T10:30:00');
    expect(result).toContain('2026/06/06');
    expect(result).toContain('10:30');
  });

  it('空值返回 "-"', () => {
    expect(formatDateTime(null)).toBe('-');
  });
});
