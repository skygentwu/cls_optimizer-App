import { describe, it, expect, vi } from 'vitest';
import { isValidApiBase, isTrustedDevHost, testConnection } from './apiBase';

describe('isValidApiBase', () => {
  it('空串视为合法（自动模式）', () => {
    expect(isValidApiBase('')).toBe(true);
    expect(isValidApiBase('   ')).toBe(true);
  });

  it('接受 http/https 完整地址', () => {
    expect(isValidApiBase('http://localhost:8080')).toBe(true);
    expect(isValidApiBase('https://api.example.com')).toBe(true);
  });

  it('拒绝非 http(s) 协议与非法 URL', () => {
    expect(isValidApiBase('ftp://x')).toBe(false);
    expect(isValidApiBase('javascript:alert(1)')).toBe(false);
    expect(isValidApiBase('not a url')).toBe(false);
    expect(isValidApiBase('localhost:8080')).toBe(false);
  });
});

describe('isTrustedDevHost', () => {
  it('空串与 https 视为受信', () => {
    expect(isTrustedDevHost('')).toBe(true);
    expect(isTrustedDevHost('https://prod.example.com')).toBe(true);
  });

  it('本机/模拟器/内网明文地址受信', () => {
    expect(isTrustedDevHost('http://localhost:8080')).toBe(true);
    expect(isTrustedDevHost('http://127.0.0.1:8080')).toBe(true);
    expect(isTrustedDevHost('http://10.0.2.2:8080')).toBe(true);
    expect(isTrustedDevHost('http://192.168.1.5:8080')).toBe(true);
  });

  it('外网明文地址不受信', () => {
    expect(isTrustedDevHost('http://evil.example.com')).toBe(false);
    expect(isTrustedDevHost('http://8.8.8.8')).toBe(false);
  });
});

describe('testConnection', () => {
  it('成功连接返回 true', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
    const result = await testConnection('http://localhost:8080');
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/healthz', expect.any(Object));
  });

  it('连接失败返回 false', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const result = await testConnection('http://localhost:8080');
    expect(result).toBe(false);
  });

  it('空地址使用相对路径 /healthz', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
    await testConnection('');
    expect(fetch).toHaveBeenCalledWith('/healthz', expect.any(Object));
  });

  it('去除末尾斜杠', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
    await testConnection('http://localhost:8080/');
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/healthz', expect.any(Object));
  });
});
