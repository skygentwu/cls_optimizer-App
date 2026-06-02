import { create } from 'zustand';
import type { PricePayload, ProductPayload, DecisionMode, DecisionRecommendationResponse } from '@/types';
import { DEFAULT_PRICES, DEFAULT_PRODUCTS, DEFAULT_NAOH_DAILY } from '@/constants';

interface AppState {
  // 全局计算参数
  naohDaily: number;
  setNaohDaily: (value: number) => void;

  // 当前价格
  prices: PricePayload;
  setPrices: (prices: PricePayload) => void;

  // 当前决策模式
  decisionName: string;
  setDecisionName: (name: string) => void;

  // 决策模式列表
  modes: DecisionMode[];
  setModes: (modes: DecisionMode[]) => void;

  // 系统推荐结果（复用原有类型）
  recommendation: DecisionRecommendationResponse | null;
  setRecommendation: (rec: DecisionRecommendationResponse | null) => void;

  // 手动模拟产量
  manualProducts: ProductPayload;
  setManualProducts: (products: ProductPayload) => void;

  // 手动模拟结果
  manualResult: {
    totalMargin: number;
    cl2Diff: number;
    isBalanced: boolean;
    compareRows: Array<Record<string, unknown>> | null;
  } | null;
  setManualResult: (result: AppState['manualResult']) => void;

  // 全局加载状态
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
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
}));
