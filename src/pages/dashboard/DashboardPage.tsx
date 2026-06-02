import { useEffect } from 'react';
import { NavBar, Grid, Card, Tag, Toast, Skeleton } from 'antd-mobile';
import {
  HistogramOutline,
  EditSOutline,
  PayCircleOutline,
  UnorderedListOutline,
} from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { fetchDecisionModes, recommendDecision, fetchPrices } from '@/api/client';
import { PRODUCT_LABELS, DEFAULT_NAOH_DAILY } from '@/constants';
import { formatNumber, formatCurrency, formatTons } from '@/utils/format';
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
      const modes = await fetchDecisionModes();
      store.setModes(modes);
      const defaultMode = modes.find((m) => m.enabled) || modes[0];
      if (defaultMode) store.setDecisionName(defaultMode.name);

      const priceRes = await fetchPrices(1);
      if (priceRes.records.length > 0) {
        store.setPrices(priceRes.records[0].prices);
      }

      if (defaultMode) {
        const rec = await recommendDecision(
          defaultMode.name,
          store.naohDaily || DEFAULT_NAOH_DAILY,
          store.prices
        );
        store.setRecommendation(rec);
      }
    } catch {
      Toast.show({ icon: 'fail', content: '数据加载失败' });
    } finally {
      store.setGlobalLoading(false);
    }
  };

  const quickActions = [
    { title: '最优推荐', icon: <HistogramOutline />, path: '/recommendation', color: '#1677ff' },
    { title: '手动模拟', icon: <EditSOutline />, path: '/manual', color: '#52c41a' },
    { title: '价格数据', icon: <PayCircleOutline />, path: '/prices', color: '#faad14' },
    { title: '更多功能', icon: <UnorderedListOutline />, path: '/recommendation', color: '#722ed1' },
  ];

  const rec = store.recommendation;

  return (
    <div className="dashboard-page">
      <NavBar back={null} style={{ background: '#1677ff', color: '#fff' }}>
        <span style={{ color: '#fff', fontWeight: 600 }}>CLS Optimizer</span>
      </NavBar>

      <div className="dashboard-content">
        {/* 今日推荐卡片 */}
        <Card className="recommendation-card" style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📊</span>
            <span>今日最优推荐</span>
            {rec?.status && (
              <Tag color={rec.status === 'OPTIMAL' ? 'success' : 'warning'}>
                {rec.status === 'OPTIMAL' ? '最优' : '可行'}
              </Tag>
            )}
          </div>

          {store.globalLoading ? (
            <Skeleton.Title animated />
          ) : rec?.products ? (
            <div className="recommendation-products">
              {Object.entries(rec.products).map(([key, value]) => (
                <div key={key} className="product-item">
                  <div className="product-name">{PRODUCT_LABELS[key as keyof typeof PRODUCT_LABELS] || key}</div>
                  <div className="product-value">{formatTons(value)}</div>
                </div>
              ))}
              <div className="product-item highlight">
                <div className="product-name">边际贡献</div>
                <div className="product-value" style={{ color: '#f5222d' }}>
                  {formatCurrency(rec.total_margin)}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">暂无推荐数据</div>
          )}
        </Card>

        {/* 关键指标 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📈</span>
            <span>关键指标</span>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-value">{formatTons(store.naohDaily)}</div>
              <div className="metric-label">烧碱日产量</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{formatNumber(store.prices.liquid_chlorine, 0)}</div>
              <div className="metric-label">液氯价格(元/吨)</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{formatNumber(store.prices.hcl31, 0)}</div>
              <div className="metric-label">盐酸价格(元/吨)</div>
            </div>
            <div className="metric-item">
              <div className="metric-value">{formatNumber(store.prices.naclo10, 0)}</div>
              <div className="metric-label">次氯价格(元/吨)</div>
            </div>
          </div>
        </Card>

        {/* 快捷入口 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>🚀</span>
            <span>快捷入口</span>
          </div>
          <Grid columns={4} gap={8}>
            {quickActions.map((action) => (
              <Grid.Item key={action.title} onClick={() => navigate(action.path)}>
                <div style={{ textAlign: 'center', padding: '12px 4px' }}>
                  <div style={{ fontSize: 28, color: action.color, marginBottom: 8 }}>
                    {action.icon}
                  </div>
                  <div style={{ fontSize: 13, color: '#666' }}>{action.title}</div>
                </div>
              </Grid.Item>
            ))}
          </Grid>
        </Card>
      </div>
    </div>
  );
}
