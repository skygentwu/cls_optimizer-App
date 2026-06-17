import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { NavBar, Card, Tag, Toast, PullToRefresh, Grid } from 'antd-mobile';
import {
  HistogramOutline,
  EyeOutline,
  AudioOutline,
  ClockCircleOutline,
  CalendarOutline,
  PayCircleOutline,
  FileOutline,
  DownlandOutline,
  EditSOutline,
  ContentOutline,
} from 'antd-mobile-icons';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts';
import { ChartBox } from '@/components/common/ChartBox';
import { useAppStore } from '@/stores/appStore';
import { fetchDecisionModes, recommendDecision, fetchPrices, evaluateManualPlan } from '@/api/client';
import { PRODUCT_LABELS, DEFAULT_NAOH_DAILY } from '@/constants';
import { formatCurrency, formatTons } from '@/utils/format';
import { SkeletonCard, SkeletonGrid } from '@/components/common/SkeletonCard';
import { ErrorRetry } from '@/components/common/ErrorRetry';

import './dashboard.css';

const PIE_COLORS = ['#1677ff', '#52c41a', '#faad14', '#f5222d'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const rec = useAppStore((s) => s.recommendation);
  const manual = useAppStore((s) => s.manualResult);

  const handleExport = useCallback(async () => {
    if (!dashboardRef.current) return;
    Toast.show({ icon: 'loading', content: '正在生成图片...', duration: 0 });
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, backgroundColor: '#f5f5f5' });
      const link = document.createElement('a');
      link.download = `CLS_Optimizer_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Toast.clear();
      Toast.show({ icon: 'success', content: '图片已保存' });
    } catch {
      Toast.clear();
      Toast.show({ icon: 'fail', content: '导出失败' });
    }
  }, []);

  const abortRef = useRef<AbortController | null>(null);

  const loadDashboardData = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(false);
    try {
      const [modes, priceRes] = await Promise.all([
        fetchDecisionModes(),
        fetchPrices(1),
      ]);
      if (ctrl.signal.aborted) return;

      const state = useAppStore.getState();
      state.setModes(modes);
      const defaultMode = modes.find((m) => m.enabled) || modes[0];
      if (defaultMode) state.setDecisionName(defaultMode.name);

      const prices = priceRes.records.length > 0 ? priceRes.records[0].prices : state.prices;
      state.setPrices(prices);

      const rec = await recommendDecision(defaultMode?.name ?? '利润最大化（默认）', state.naohDaily || DEFAULT_NAOH_DAILY, prices);
      if (ctrl.signal.aborted) return;
      state.setRecommendation(rec);

      try {
        const manualRes = await evaluateManualPlan(
          state.naohDaily || DEFAULT_NAOH_DAILY,
          prices,
          rec.products ?? { liquid_chlorine: 0, hcl31: 0, naclo10: 0 },
          rec.products,
          rec.total_margin
        );
        if (ctrl.signal.aborted) return;
        state.setManualResult({
          totalMargin: manualRes.total_margin,
          cl2Diff: manualRes.cl2_diff,
          isBalanced: manualRes.is_cl2_balanced,
          compareRows: manualRes.compare_rows,
        });
      } catch {
        // ignore
      }
    } catch {
      if (ctrl.signal.aborted) return;
      setError(true);
      Toast.show({ icon: 'fail', content: '数据加载失败' });
    } finally {
      if (!ctrl.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    return () => {
      abortRef.current?.abort();
    };
  }, [loadDashboardData]);

  const diff = manual ? manual.totalMargin - (rec?.total_margin ?? 0) : 0;

  const marginCompareData = useMemo(() => [
    { name: '系统推荐', value: rec?.total_margin ?? 0, fill: '#1677ff' },
    { name: '人工方案', value: manual?.totalMargin ?? 0, fill: '#999' },
  ], [rec?.total_margin, manual?.totalMargin]);

  const productPieData = useMemo(() =>
    rec?.products
      ? Object.entries(rec.products)
          .filter(([, v]) => (v as number) > 0)
          .map(([key, value]) => ({
            name: PRODUCT_LABELS[key as keyof typeof PRODUCT_LABELS] || key,
            value: Math.round(value as number),
          }))
      : []
  , [rec?.products]);

  const quickCards = useMemo(() => [
    { title: '最优推荐', icon: <ContentOutline />, color: '#1677ff', path: '/recommendation' },
    { title: '决策对比', icon: <HistogramOutline />, color: '#722ed1', path: '/compare' },
    { title: '趋势分析', icon: <EyeOutline />, color: '#eb2f96', path: '/trends' },
    { title: '经营建议', icon: <AudioOutline />, color: '#faad14', path: '/insights' },
    { title: '历史回测', icon: <ClockCircleOutline />, color: '#13c2c2', path: '/backtest' },
    { title: '预测分析', icon: <CalendarOutline />, color: '#0958d9', path: '/forecast' },
    { title: '财务分析', icon: <PayCircleOutline />, color: '#f5222d', path: '/margin' },
    { title: '经营报告', icon: <FileOutline />, color: '#fa541c', path: '/report' },
    { title: '手动模拟', icon: <EditSOutline />, color: '#2f4554', path: '/manual' },
  ], []);

  return (
    <div className="dashboard-page">
      <NavBar back={null} style={{ background: '#1677ff', color: '#fff' }}
        right={<DownlandOutline style={{ color: '#fff', fontSize: 20 }} onClick={handleExport} />}
      >
        <span style={{ color: '#fff', fontWeight: 600 }}>经营驾驶舱</span>
      </NavBar>

      <PullToRefresh onRefresh={loadDashboardData}>
        <div className="dashboard-content" ref={dashboardRef}>
          {loading && (
            <>
              <SkeletonCard rows={2} />
              <SkeletonCard rows={3} />
              <SkeletonGrid count={4} />
            </>
          )}
          {error && !loading && (
            <ErrorRetry message="首页数据加载失败，请检查网络连接" onRetry={loadDashboardData} />
          )}
          {!loading && !error && (
            <>
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

          {/* 边际贡献对比图表 */}
          {rec && (
            <Card style={{ margin: '12px' }}>
              <div className="card-title">
                <span>📊</span>
                <span>边际贡献对比</span>
              </div>
              <ChartBox height={160}>
                <BarChart data={marginCompareData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={70} />
                  <Tooltip formatter={(value) => [`¥${Number(value).toLocaleString()}`, '边际贡献']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {marginCompareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartBox>
            </Card>
          )}

          {/* 产品产量分布 */}
          {productPieData.length > 0 && (
            <Card style={{ margin: '12px' }}>
              <div className="card-title">
                <span>🥧</span>
                <span>产量分布</span>
              </div>
              <ChartBox height={200}>
                <PieChart>
                  <Pie
                    data={productPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {productPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value)} 吨`, '产量']} />
                </PieChart>
              </ChartBox>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                {productPieData.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span>{item.name} {item.value}吨</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

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
            <Grid columns={5} gap={8}>
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
            </>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}
