import { useEffect } from 'react';
import { NavBar, Card, Tag, Toast, PullToRefresh, Grid } from 'antd-mobile';
import {
  HistogramOutline,
  EyeOutline,
  AudioOutline,
  SetOutline,
  ClockCircleOutline,
  CalendarOutline,
  PayCircleOutline,
  FileOutline,
} from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { fetchDecisionModes, recommendDecision, fetchPrices, evaluateManualPlan } from '@/api/client';
import { PRODUCT_LABELS, DEFAULT_NAOH_DAILY } from '@/constants';
import { formatCurrency, formatTons } from '@/utils/format';
import './dashboard.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const store = useAppStore();

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    store.setGlobalLoading(true);
    try {
      const [modes, priceRes] = await Promise.all([
        fetchDecisionModes(),
        fetchPrices(1),
      ]);

      store.setModes(modes);
      const defaultMode = modes.find((m) => m.enabled) || modes[0];
      if (defaultMode) store.setDecisionName(defaultMode.name);

      const prices = priceRes.records.length > 0 ? priceRes.records[0].prices : store.prices;
      store.setPrices(prices);

      const rec = await recommendDecision(defaultMode?.name ?? '利润最大化（默认）', store.naohDaily || DEFAULT_NAOH_DAILY, prices);
      store.setRecommendation(rec);

      try {
        const manualRes = await evaluateManualPlan(
          store.naohDaily || DEFAULT_NAOH_DAILY,
          prices,
          rec.products ?? { liquid_chlorine: 0, hcl31: 0, naclo10: 0 },
          rec.products,
          rec.total_margin
        );
        store.setManualResult({
          totalMargin: manualRes.total_margin,
          cl2Diff: manualRes.cl2_diff,
          isBalanced: manualRes.is_cl2_balanced,
          compareRows: manualRes.compare_rows,
        });
      } catch {
        // ignore
      }
    } catch {
      Toast.show({ icon: 'fail', content: '数据加载失败' });
    } finally {
      store.setGlobalLoading(false);
    }
  };

  const rec = store.recommendation;
  const manual = store.manualResult;
  const diff = manual ? manual.totalMargin - (rec?.total_margin ?? 0) : 0;

  const quickCards = [
    { title: '决策对比', icon: <HistogramOutline />, color: '#1677ff', path: '/compare' },
    { title: '趋势分析', icon: <EyeOutline />, color: '#52c41a', path: '/trends' },
    { title: '经营建议', icon: <AudioOutline />, color: '#faad14', path: '/insights' },
    { title: '历史回测', icon: <ClockCircleOutline />, color: '#722ed1', path: '/backtest' },
    { title: '预测分析', icon: <CalendarOutline />, color: '#eb2f96', path: '/forecast' },
    { title: '财务分析', icon: <PayCircleOutline />, color: '#13c2c2', path: '/margin' },
    { title: '经营报告', icon: <FileOutline />, color: '#f5222d', path: '/report' },
    { title: '参数配置', icon: <SetOutline />, color: '#666', path: '/profile' },
  ];

  return (
    <div className="dashboard-page">
      <NavBar back={null} style={{ background: '#1677ff', color: '#fff' }}>
        <span style={{ color: '#fff', fontWeight: 600 }}>经营驾驶舱</span>
      </NavBar>

      <PullToRefresh onRefresh={loadDashboardData}>
        <div className="dashboard-content">
          {/* 核心指标 */}
          <Card className="hero-card" style={{ margin: '12px' }}>
            <div className="hero-label">今日决策收益对比</div>
            <div className="hero-diff">
              <span className={diff >= 0 ? 'diff-positive' : 'diff-negative'}>
                {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
              </span>
              <span className="diff-unit">/天</span>
            </div>
            <div className="hero-sub">
              {diff > 0 ? '按系统推荐可提升收益' : diff < 0 ? '当前人工方案收益更优' : '系统与人工方案持平'}
            </div>
            {rec?.status && (
              <Tag color={rec.status === 'OPTIMAL' ? 'success' : 'warning'} style={{ marginTop: 8, fontSize: 12 }}>
                {rec.status === 'OPTIMAL' ? '全局最优解' : '可行方案'}
              </Tag>
            )}
          </Card>

          {/* 边际贡献对比 */}
          <div className="compare-row" style={{ margin: '0 12px', display: 'flex', gap: 12 }}>
            <Card style={{ flex: 1, textAlign: 'center' }}>
              <div className="compare-label">系统推荐</div>
              <div className="compare-value" style={{ color: '#1677ff' }}>{formatCurrency(rec?.total_margin ?? 0)}</div>
              <div className="compare-unit">边际贡献/天</div>
            </Card>
            <Card style={{ flex: 1, textAlign: 'center' }}>
              <div className="compare-label">人工方案</div>
              <div className="compare-value" style={{ color: '#666' }}>{formatCurrency(manual?.totalMargin ?? 0)}</div>
              <div className="compare-unit">边际贡献/天</div>
            </Card>
          </div>

          {/* 推荐产量 */}
          <Card style={{ margin: '12px' }}>
            <div className="card-title">
              <span>📊</span>
              <span>系统推荐产量</span>
            </div>
            {rec?.products ? (
              <div className="product-grid">
                {Object.entries(rec.products).map(([key, value]) => (
                  <div key={key} className="product-card">
                    <div className="product-name">{PRODUCT_LABELS[key as keyof typeof PRODUCT_LABELS]}</div>
                    <div className="product-value">{formatTons(value)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">加载中...</div>
            )}
          </Card>

          {/* 氯气平衡 */}
          {manual && (
            <Card style={{ margin: '12px' }}>
              <div className="card-title">
                <span>⚗️</span>
                <span>氯气平衡</span>
                <Tag color={manual.isBalanced ? 'success' : 'warning'}>
                  {manual.isBalanced ? '平衡' : '失衡'}
                </Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#666' }}>
                <span>偏差: {formatTons(manual.cl2Diff)}</span>
                <span className={manual.isBalanced ? 'status-optimal' : 'status-warning'}>
                  {manual.isBalanced ? '✓ 正常' : '⚠ 需调整'}
                </span>
              </div>
            </Card>
          )}

          {/* 结论 */}
          {rec?.conclusion && (
            <Card style={{ margin: '12px', background: '#e6f7ff', border: '1px solid #91d5ff' }}>
              <div style={{ fontSize: 14, color: '#0958d9', lineHeight: 1.6 }}>
                <strong>💡 分析结论：</strong>{rec.conclusion}
              </div>
            </Card>
          )}

          {/* 快捷入口 */}
          <Card style={{ margin: '12px' }}>
            <div className="card-title">
              <span>🚀</span>
              <span>功能入口</span>
            </div>
            <Grid columns={4} gap={8}>
              {quickCards.map((item) => (
                <Grid.Item key={item.title} onClick={() => navigate(item.path)}>
                  <div style={{ textAlign: 'center', padding: '10px 2px' }}>
                    <div style={{ fontSize: 24, color: item.color, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{item.title}</div>
                  </div>
                </Grid.Item>
              ))}
            </Grid>
          </Card>
        </div>
      </PullToRefresh>
    </div>
  );
}
