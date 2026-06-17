/**
 * 后端地址校验工具。
 *
 * 由于请求会自动附带 JWT（Authorization: Bearer），若把后端地址改写为恶意主机，
 * 令牌可能被外带。这里在保存前做基本校验：仅允许空串（自动）或 http/https 的合法 URL，
 * 并对非内网/明文地址给出提醒，降低令牌外泄面。
 */

/** 校验后端地址是否可接受。空串表示”自动”（走代理/默认），视为合法。 */
export function isValidApiBase(url: string): boolean {
  const value = url.trim();
  if (!value) return true; // 自动
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** 是否为受信的本机/内网开发地址（用于是否提示风险）。 */
export function isTrustedDevHost(url: string): boolean {
  const value = url.trim();
  if (!value) return true;
  try {
    const { hostname, protocol } = new URL(value);
    if (protocol === 'https:') return true;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '10.0.2.2' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    );
  } catch {
    return false;
  }
}

/**
 * 测试后端连接是否可达。
 * 通过 /healthz 端点探测，3 秒超时。
 */
export async function testConnection(baseUrl: string): Promise<boolean> {
  try {
    const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/healthz` : '/healthz';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}
