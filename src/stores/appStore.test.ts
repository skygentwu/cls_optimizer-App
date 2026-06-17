import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './appStore';

/**
 * appStore 测试集
 * 功能：验证全局业务状态的默认值、状态更新、localStorage 持久化
 */
describe('appStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // 每个测试前重置 store 到初始状态，避免测试间数据互相影响
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

  it('默认值正确', () => {
    const s = useAppStore.getState();
    expect(s.naohDaily).toBe(822);
    expect(s.decisionName).toBe('利润最大化（默认）');
    expect(s.globalLoading).toBe(false);
    expect(s.theme).toBe('light');
  });

  it('setNaohDaily 更新烧碱日产量', () => {
    useAppStore.getState().setNaohDaily(1000);
    expect(useAppStore.getState().naohDaily).toBe(1000);
  });

  it('setApiBaseUrl 同时持久化到 localStorage', () => {
    useAppStore.getState().setApiBaseUrl('http://192.168.1.1:8000');
    expect(useAppStore.getState().apiBaseUrl).toBe('http://192.168.1.1:8000');
    expect(localStorage.getItem('cls_api_base')).toBe('http://192.168.1.1:8000');
  });

  it('setTheme 更新主题并写入 localStorage、设置 html data-theme', () => {
    useAppStore.getState().setTheme('dark');
    expect(useAppStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('cls_theme')).toBe('dark');
    // 验证 document.documentElement.setAttribute 被调用（在 setupTests.ts 中被 mock）
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
  });

  it('toggleTheme 从 light 切换到 dark', () => {
    useAppStore.setState({ theme: 'light' });
    useAppStore.getState().toggleTheme();
    expect(useAppStore.getState().theme).toBe('dark');
  });

  it('toggleTheme 从 dark 切换到 light', () => {
    useAppStore.setState({ theme: 'dark' });
    useAppStore.getState().toggleTheme();
    expect(useAppStore.getState().theme).toBe('light');
  });

  it('setGlobalLoading 切换全局加载状态', () => {
    useAppStore.getState().setGlobalLoading(true);
    expect(useAppStore.getState().globalLoading).toBe(true);
  });

  it('setRecommendation 存储系统推荐结果', () => {
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

  it('setPrices 更新价格', () => {
    useAppStore.getState().setPrices({ liquid_chlorine: 300, hcl31: 200, naclo10: 500, naoh32: 700 });
    expect(useAppStore.getState().prices.liquid_chlorine).toBe(300);
  });

  it('setDecisionName 更新决策模式名称', () => {
    useAppStore.getState().setDecisionName('成本最小化');
    expect(useAppStore.getState().decisionName).toBe('成本最小化');
  });

  it('setModes 更新决策模式列表', () => {
    const modes = [{ name: 'mode1', label: '模式1', description: '', mode: 'profit_max', scenario: 'default', enabled: true }];
    useAppStore.getState().setModes(modes);
    expect(useAppStore.getState().modes).toEqual(modes);
  });

  it('setManualProducts 更新手动模拟产量', () => {
    useAppStore.getState().setManualProducts({ liquid_chlorine: 10, hcl31: 20, naclo10: 30 });
    expect(useAppStore.getState().manualProducts).toEqual({ liquid_chlorine: 10, hcl31: 20, naclo10: 30 });
  });

  it('setManualResult 更新手动模拟结果', () => {
    const result = { totalMargin: 1000, cl2Diff: 0.5, isBalanced: true, compareRows: null };
    useAppStore.getState().setManualResult(result);
    expect(useAppStore.getState().manualResult).toEqual(result);
  });

});
