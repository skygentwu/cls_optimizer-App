import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import * as apiClient from '@/api/client';

// Mock API 客户端
vi.mock('@/api/client', async () => {
  const actual = await vi.importActual<typeof apiClient>('@/api/client');
  return {
    ...actual,
    fetchDecisionModes: vi.fn(),
    fetchPrices: vi.fn(),
    recommendDecision: vi.fn(),
    evaluateManualPlan: vi.fn(),
  };
});

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => 'data:image/png;base64,mock',
  }),
}));

describe('DashboardPage', () => {
  const mockModes = [
    { name: '利润最大化', mode: 'profit', scenario: 'default', description: '默认', enabled: true },
  ];

  const mockPrices = {
    records: [
      {
        date: '2026-06-17',
        prices: { liquid_chlorine: 800, hcl31: 600, naclo10: 500, naoh32: 1200 },
        data_flag: 'actual',
        data_source: 'database',
      },
    ],
  };

  const mockRecommendation = {
    decision_name: '利润最大化',
    status: 'OPTIMAL',
    is_optimal: true,
    products: { liquid_chlorine: 50, hcl31: 80, naclo10: 30 },
    total_margin: 200000,
    total_product_qty: 160,
    total_cl2_usage: 120,
    cl2_usage: { liquid_chlorine: 50, hcl31: 80, naclo10: 30 },
    margin_per_cl2: { liquid_chlorine: 1000, hcl31: 800, naclo10: 600 },
    calculation_process: {},
    conclusion: '系统推荐方案收益最优',
    raw: {},
  };

  const mockManualResult = {
    products: { liquid_chlorine: 50, hcl31: 80, naclo10: 30 },
    cl2_target: 120,
    cl2_used: 120,
    cl2_diff: 0,
    cl2_abs_diff: 0,
    is_cl2_balanced: true,
    implied_naoh_daily: 1000,
    max_products: { liquid_chlorine: 60, hcl31: 90, naclo10: 40 },
    capacity_warnings: [],
    total_margin: 180000,
    recommendation_diff: -20000,
    recommendation_percent: -10,
    compare_rows: [],
    raw: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.fetchDecisionModes).mockResolvedValue(mockModes);
    vi.mocked(apiClient.fetchPrices).mockResolvedValue(mockPrices as any);
    vi.mocked(apiClient.recommendDecision).mockResolvedValue(mockRecommendation as any);
    vi.mocked(apiClient.evaluateManualPlan).mockResolvedValue(mockManualResult as any);
  });

  it('渲染加载状态', () => {
    render(<DashboardPage />);
    expect(screen.getByText('经营驾驶舱')).toBeInTheDocument();
  });

  it('加载完成后显示推荐数据', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('系统推荐')).toBeInTheDocument();
    });

    expect(screen.getByText('¥200,000')).toBeInTheDocument();
    expect(screen.getByText('全局最优解')).toBeInTheDocument();
  });

  it('显示氯气平衡状态', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('氯气平衡')).toBeInTheDocument();
    });

    expect(screen.getByText('平衡')).toBeInTheDocument();
  });

  it('显示功能入口', async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('最优推荐')).toBeInTheDocument();
    });

    expect(screen.getByText('决策对比')).toBeInTheDocument();
    expect(screen.getByText('趋势分析')).toBeInTheDocument();
  });

  it('API 错误时显示错误状态', async () => {
    vi.mocked(apiClient.fetchDecisionModes).mockRejectedValue(new Error('Network error'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('首页数据加载失败，请检查网络连接')).toBeInTheDocument();
    });
  });
});
