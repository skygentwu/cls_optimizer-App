import { DEFAULT_PRICES, DEFAULT_PRODUCTS, PRODUCT_LABELS, PRODUCT_KEYS } from "./products";

export { DEFAULT_PRICES, DEFAULT_PRODUCTS, PRODUCT_LABELS, PRODUCT_KEYS };

// 本地存储键名
export const AUTH_TOKEN_KEY = "cls_auth_token";
export const AUTH_USER_KEY = "cls_auth_user";

// 默认烧碱日产量（与现有前端一致）
export const DEFAULT_NAOH_DAILY = 822;

// 产品价格单位
export const PRICE_UNITS: Record<string, string> = {
  liquid_chlorine: "元/吨",
  hcl31: "元/吨",
  naclo10: "元/吨",
  naoh32: "元/吨",
};
