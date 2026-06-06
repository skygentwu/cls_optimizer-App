import { create } from 'zustand';
import { Capacitor } from '@capacitor/core';
import type { PricePayload, ProductPayload, DecisionMode, DecisionRecommendationResponse } from '@/types';
import { DEFAULT_PRICES, DEFAULT_PRODUCTS, DEFAULT_NAOH_DAILY } from '@/constants';

/**
 * 根据运行环境返回默认的后端 API 地址
 * - Capacitor 原生环境（Android 模拟器/真机）：使用 10.0.2.2 环回地址访问宿主机后端
 * - 浏览器开发环境：返回空字符串，走相对路径 /api/xxx，由 Vite devServer proxy 转发到 localhost:8000
 */
function getDefaultApiBase(): string {
  if (Capacitor.isNativePlatform()) {
    return 'http://10.0.2.2:8000';
  }
  return '';
}

/**
 * AppState：全局业务状态接口
 * 包含优化计算参数、价格、决策模式、推荐结果、手动模拟、网络配置、主题等
 */
interface AppState {
  // === 全局计算参数 ===
  naohDaily: number;                           // 烧碱折百日产量（吨）
  setNaohDaily: (value: number) => void;

  // === 当前价格 ===
  prices: PricePayload;                        // 各产品当日价格
  setPrices: (prices: PricePayload) => void;

  // === 当前决策模式 ===
  decisionName: string;                        // 如"利润最大化（默认）"
  setDecisionName: (name: string) => void;

  // === 决策模式列表 ===
  modes: DecisionMode[];                       // 后端返回的所有可选模式
  setModes: (modes: DecisionMode[]) => void;

  // === 系统推荐结果 ===
  recommendation: DecisionRecommendationResponse | null;
  setRecommendation: (rec: DecisionRecommendationResponse | null) => void;

  // === 手动模拟产量 ===
  manualProducts: ProductPayload;              // 用户在"手动模拟"页输入的产量
  setManualProducts: (products: ProductPayload) => void;

  // === 手动模拟结果 ===
  manualResult: {
    totalMargin: number;                       // 手动方案总边际贡献
    cl2Diff: number;                           // 氯气平衡差值
    isBalanced: boolean;                       // 是否达到氯气平衡
    compareRows: Array<Record<string, unknown>> | null;  // 对比表格行数据
  } | null;
  setManualResult: (result: AppState['manualResult']) => void;

  // === 全局加载状态 ===
  globalLoading: boolean;                      // 是否显示全局 loading（某些页面共享）
  setGlobalLoading: (loading: boolean) => void;

  // === API 基础地址 ===
  apiBaseUrl: string;                          // 后端地址，支持内网穿透/localtunnel 切换
  setApiBaseUrl: (url: string) => void;

  // === 深色模式 ===
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

/**
 * useAppStore：全局业务状态管理（Zustand）
 * - apiBaseUrl / theme 从 localStorage 恢复持久化值
 * - 切换主题时同步设置 html 的 data-theme 属性，供 CSS 深色模式选择器使用
 */
export const useAppStore = create<AppState>((set) => ({
  // 从 localStorage 或环境变量读取 API 地址；无配置则按平台返回默认值
  apiBaseUrl: localStorage.getItem('cls_api_base') || import.meta.env.VITE_API_BASE_URL || getDefaultApiBase(),
  setApiBaseUrl: (url: string) => {
    localStorage.setItem('cls_api_base', url);
    set({ apiBaseUrl: url });
  },

  naohDaily: DEFAULT_NAOH_DAILY,
  setNaohDaily: (value) => set({ naohDaily: value }),

  prices: { ...DEFAULT_PRICES },
  setPrices: (prices) => set({ prices }),

  decisionName: '利润最大化（默认）',
  setDecisionName: (name) => set({ decisionName: name }),

  modes: [],
  setModes: (modes) => set({ modes }),

  recommendation: null,
  setRecommendation: (rec) => set({ recommendation: rec }),

  manualProducts: { ...DEFAULT_PRODUCTS },
  setManualProducts: (products) => set({ manualProducts: products }),

  manualResult: null,
  setManualResult: (result) => set({ manualResult: result }),

  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),

  // 从 localStorage 恢复上次保存的主题；默认亮色
  theme: (localStorage.getItem('cls_theme') as 'light' | 'dark') || 'light',
  setTheme: (theme) => {
    localStorage.setItem('cls_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  // 切换主题：使用函数式更新读取当前 state，避免闭包获取到旧值
  toggleTheme: () => set((state) => {
    const next = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('cls_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    return { theme: next };
  }),
}));
