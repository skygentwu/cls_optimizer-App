/**
 * Vitest 全局测试初始化文件
 * 所有测试运行前会先执行此文件，用于设置统一的测试环境
 */
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

/**
 * Mock @capacitor/core
 * 原因：Capacitor 是原生桥接库，在 Node/jsdom 环境中不存在
 * 默认模拟为 Web 环境，避免调用原生 API 时报错
 */
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,   // 非原生平台（模拟器/真机返回 true）
    getPlatform: () => 'web',         // 当前平台标识为 web
  },
}));

/**
 * Mock window.matchMedia
 * 原因：antd-mobile 的响应式组件依赖 matchMedia 判断屏幕尺寸
 * jsdom 默认没有 matchMedia，不 mock 会导致组件渲染异常
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,                  // 默认不匹配任何媒体查询
    media: query,
    onchange: null,
    addListener: vi.fn(),            // 旧版 API
    removeListener: vi.fn(),
    addEventListener: vi.fn(),       // 新版 API
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * Mock localStorage
 * 原因：Zustand 的 persist 中间件会读写 localStorage
 * jsdom 的 localStorage 是真实的，但为了避免测试间数据污染，使用内存 mock
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {};   // 内存中的键值存储
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },            // 清空所有数据
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

/**
 * Mock document.documentElement.setAttribute
 * 原因：appStore 的 setTheme/toggleTheme 会调用此方法设置 data-theme 属性
 * mock 后可在测试中验证主题切换是否被正确调用
 */
const originalSetAttribute = document.documentElement.setAttribute.bind(document.documentElement);
document.documentElement.setAttribute = vi.fn((name: string, value: string) => {
  // 保留原始行为，同时让 vi.fn() 可以记录调用次数和参数
  originalSetAttribute(name, value);
});
