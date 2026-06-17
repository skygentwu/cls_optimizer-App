/** 后端记录多为 Record<string, unknown>（部分为中文列名），这里提供安全取值工具。 */

/** 将任意值安全转为 number，非法值回退 0。 */
export function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** 按候选键依次取第一个非空值（兼容中英文列名）。 */
export function pick(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

/** 产品英文键 → 后端中文产品名。 */
export const CN_PRODUCT: Record<'liquid_chlorine' | 'hcl31' | 'naclo10', string> = {
  liquid_chlorine: '液氯',
  hcl31: '31%盐酸',
  naclo10: '10%次氯',
};
