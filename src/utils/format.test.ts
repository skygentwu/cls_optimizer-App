import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatCurrency,
  formatTons,
  formatPercent,
  formatDate,
  formatDateTime,
} from './format';

describe('formatNumber', () => {
  it('formats integer with 2 decimals', () => {
    expect(formatNumber(1234)).toBe('1,234.00');
  });

  it('formats float with rounding', () => {
    expect(formatNumber(1234.567, 2)).toBe('1,234.57');
  });

  it('returns dash for null/undefined/NaN', () => {
    expect(formatNumber(null)).toBe('-');
    expect(formatNumber(undefined)).toBe('-');
    expect(formatNumber(NaN)).toBe('-');
  });

  it('formats negative number', () => {
    expect(formatNumber(-500.5, 1)).toBe('-500.5');
  });
});

describe('formatCurrency', () => {
  it('prefixes yen and uses 0 decimals', () => {
    expect(formatCurrency(15000)).toBe('¥15,000');
  });

  it('rounds decimals', () => {
    expect(formatCurrency(15000.6)).toBe('¥15,001');
  });

  it('returns dash for invalid', () => {
    expect(formatCurrency(null)).toBe('-');
  });
});

describe('formatTons', () => {
  it('suffixes 吨 with 1 decimal', () => {
    expect(formatTons(88.25)).toBe('88.3 吨');
  });

  it('returns dash for invalid', () => {
    expect(formatTons(undefined)).toBe('-');
  });
});

describe('formatPercent', () => {
  it('multiplies by 100 and adds %', () => {
    expect(formatPercent(0.1234)).toBe('12.3%');
  });

  it('uses custom digits', () => {
    expect(formatPercent(0.1234, 2)).toBe('12.34%');
  });

  it('returns dash for invalid', () => {
    expect(formatPercent(null)).toBe('-');
  });
});

describe('formatDate', () => {
  it('formats ISO string to zh-CN date', () => {
    expect(formatDate('2026-06-06')).toBe('2026/06/06');
  });

  it('accepts Date object', () => {
    expect(formatDate(new Date('2026-06-06'))).toBe('2026/06/06');
  });

  it('returns dash for empty or invalid', () => {
    expect(formatDate('')).toBe('-');
    expect(formatDate(null)).toBe('-');
    expect(formatDate('not-a-date')).toBe('-');
  });
});

describe('formatDateTime', () => {
  it('formats ISO string with time', () => {
    const result = formatDateTime('2026-06-06T10:30:00');
    expect(result).toContain('2026/06/06');
    expect(result).toContain('10:30');
  });

  it('returns dash for empty', () => {
    expect(formatDateTime(null)).toBe('-');
  });
});
