import type { PricePayload, ProductPayload } from "../types";

export const DEFAULT_PRICES: PricePayload = {
  liquid_chlorine: 225.4,
  hcl31: 159,
  naclo10: 409.6,
  naoh32: 600
};

export const DEFAULT_PRODUCTS: ProductPayload = {
  liquid_chlorine: 0,
  hcl31: 0,
  naclo10: 0
};

export const PRODUCT_LABELS: Record<keyof PricePayload, string> = {
  liquid_chlorine: "液氯",
  hcl31: "31%盐酸",
  naclo10: "10%次氯酸钠",
  naoh32: "32%液碱"
};

export const PRODUCT_KEYS: Array<keyof ProductPayload> = ["liquid_chlorine", "hcl31", "naclo10"];
