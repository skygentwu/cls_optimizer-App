/**
 * 格式化数字为千分位字符串
 */
export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * 格式化金额为元
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return `¥${formatNumber(value, 0)}`;
}

/**
 * 格式化产量为吨
 */
export function formatTons(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return `${formatNumber(value, 1)} 吨`;
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  return `${(value * 100).toFixed(digits)}%`;
}

/**
 * 格式化日期
 */
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
