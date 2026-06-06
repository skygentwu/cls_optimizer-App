import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PRICES,
  DEFAULT_PRODUCTS,
  PRODUCT_LABELS,
  PRODUCT_KEYS,
} from './products';

describe('product constants', () => {
  it('DEFAULT_PRICES has all products', () => {
    expect(DEFAULT_PRICES).toHaveProperty('liquid_chlorine');
    expect(DEFAULT_PRICES).toHaveProperty('hcl31');
    expect(DEFAULT_PRICES).toHaveProperty('naclo10');
    expect(DEFAULT_PRICES).toHaveProperty('naoh32');
  });

  it('DEFAULT_PRODUCTS has only 3 chlorine products', () => {
    expect(DEFAULT_PRODUCTS).toHaveProperty('liquid_chlorine');
    expect(DEFAULT_PRODUCTS).toHaveProperty('hcl31');
    expect(DEFAULT_PRODUCTS).toHaveProperty('naclo10');
    expect(DEFAULT_PRODUCTS).not.toHaveProperty('naoh32');
  });

  it('PRODUCT_LABELS are in Chinese', () => {
    expect(PRODUCT_LABELS.liquid_chlorine).toBe('液氯');
    expect(PRODUCT_LABELS.hcl31).toBe('31%盐酸');
    expect(PRODUCT_LABELS.naclo10).toBe('10%次氯酸钠');
    expect(PRODUCT_LABELS.naoh32).toBe('32%液碱');
  });

  it('PRODUCT_KEYS matches DEFAULT_PRODUCTS keys', () => {
    expect(PRODUCT_KEYS).toEqual(Object.keys(DEFAULT_PRODUCTS));
  });
});
