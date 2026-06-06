import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './appStore';

describe('appStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store to fresh state by mutating each field
    void useAppStore.getState();
    useAppStore.setState({
      naohDaily: 822,
      prices: { liquid_chlorine: 225.4, hcl31: 159, naclo10: 409.6, naoh32: 600 },
      decisionName: '利润最大化（默认）',
      modes: [],
      recommendation: null,
      manualProducts: { liquid_chlorine: 0, hcl31: 0, naclo10: 0 },
      manualResult: null,
      globalLoading: false,
      apiBaseUrl: '',
      theme: 'light',
    });
  });

  it('has correct defaults', () => {
    const s = useAppStore.getState();
    expect(s.naohDaily).toBe(822);
    expect(s.decisionName).toBe('利润最大化（默认）');
    expect(s.globalLoading).toBe(false);
    expect(s.theme).toBe('light');
  });

  it('setNaohDaily updates value', () => {
    useAppStore.getState().setNaohDaily(1000);
    expect(useAppStore.getState().naohDaily).toBe(1000);
  });

  it('setApiBaseUrl persists to localStorage', () => {
    useAppStore.getState().setApiBaseUrl('http://192.168.1.1:8000');
    expect(useAppStore.getState().apiBaseUrl).toBe('http://192.168.1.1:8000');
    expect(localStorage.getItem('cls_api_base')).toBe('http://192.168.1.1:8000');
  });

  it('setTheme updates attribute and localStorage', () => {
    useAppStore.getState().setTheme('dark');
    expect(useAppStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('cls_theme')).toBe('dark');
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
  });

  it('toggleTheme switches light to dark', () => {
    useAppStore.setState({ theme: 'light' });
    useAppStore.getState().toggleTheme();
    expect(useAppStore.getState().theme).toBe('dark');
  });

  it('toggleTheme switches dark to light', () => {
    useAppStore.setState({ theme: 'dark' });
    useAppStore.getState().toggleTheme();
    expect(useAppStore.getState().theme).toBe('light');
  });

  it('setGlobalLoading toggles loading state', () => {
    useAppStore.getState().setGlobalLoading(true);
    expect(useAppStore.getState().globalLoading).toBe(true);
  });

  it('setRecommendation stores result', () => {
    const mockRec = {
      decision_name: 'test',
      products: { liquid_chlorine: 10, hcl31: 20, naclo10: 30 },
      total_margin: 5000,
      status: 'optimal',
      is_optimal: true,
      total_product_qty: 60,
      total_cl2_usage: 50,
      cl2_usage: { liquid_chlorine: 20, hcl31: 15, naclo10: 15 },
      margin_per_cl2: {},
      calculation_process: null,
      conclusion: '',
      raw: {},
    };
    useAppStore.getState().setRecommendation(mockRec);
    expect(useAppStore.getState().recommendation?.total_margin).toBe(5000);
  });
});
