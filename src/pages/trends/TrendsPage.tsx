import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tabs } from 'antd-mobile';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartBox } from '@/components/common/ChartBox';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ErrorRetry } from '@/components/common/ErrorRetry';
import { useAppStore } from '@/stores/appStore';
import { fetchPrices, runBacktestAnalysis, runDecisionSensitivity } from '@/api/client';
import { PRODUCT_LABELS } from '@/constants';
import { formatCurrency } from '@/utils/format';
import { toNum, pick } from '@/utils/record';
import { useAbortableAsync } from '@/hooks/useAbortableAsync';
import './trends.css';

interface PricePoint { date: string; liquid_chlorine: number; hcl31: number; naclo10: number }
interface MarginPoint { date: string; manual: number; system: number }

export default function TrendsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('price');
  const [prices, setPrices] = useState<PricePoint[]>([]);
  const [margins, setMargins] = useState<MarginPoint[]>([]);

  const { loading, error, run } = useAbortableAsync(async (signal) => {
    const [priceRes, backtestRes] = await Promise.all([
      fetchPrices(30),
      runBacktestAnalysis().catch(() => null),
    ]);
    // 任一被新请求取代则整体丢弃，避免新旧数据混杂
    if (signal.aborted) return;

    const pricePoints: PricePoint[] = (priceRes.records ?? [])
      .map((r) => ({
        date: r.date,
        liquid_chlorine: toNum(r.prices?.liquid_chlorine),
        hcl31: toNum(r.prices?.hcl31),
        naclo10: toNum(r.prices?.naclo10),
      }))
      .filter((p) => p.date)
      .sort((a, b) => a.date.localeCompare(b.date));
    setPrices(pricePoints.slice(-14));

    const marginPoints: MarginPoint[] = ((backtestRes?.detail_records ?? []) as Array<Record<string, unknown>>)
      .map((r) => ({
        date: String(pick(r, '日期', 'date') ?? ''),
        system: toNum(pick(r, '系统边际贡献', 'system')),
        manual: toNum(pick(r, '人工边际贡献', 'manual')),
      }))
      .filter((m) => m.date)
      .sort((a, b) => a.date.localeCompare(b.date));
    setMargins(marginPoints);
  }, []);

  if (loading) {
    return (
      <div className="trends-page">
        <NavBar onBack={() => navigate(-1)}>趋势洞察</NavBar>
        <div className="page-content">
          <SkeletonCard rows={4} />
          <SkeletonCard rows={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trends-page">
        <NavBar onBack={() => navigate(-1)}>趋势洞察</NavBar>
        <div className="page-content">
          <ErrorRetry onRetry={run} />
        </div>
      </div>
    );
  }

  const priceChange = prices.length >= 2
    ? (['liquid_chlorine', 'hcl31', 'naclo10'] as const).reduce((acc, key) => {
        const first = prices[0][key];
        const last = prices[prices.length - 1][key];
        acc[key] = first ? (((last - first) / first) * 100).toFixed(1) : '0.0';
        return acc;
      }, {} as Record<'liquid_chlorine' | 'hcl31' | 'naclo10', string>)
    : null;

  const marginRecent = margins.slice(-14);

  return (
    <div className="trends-page">
      <NavBar onBack={() => navigate(-1)}>趋势洞察</NavBar>

      <div className="page-content">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.Tab title="价格走势" key="price">
            {prices.length > 0 ? (
              <>
                {priceChange && (
                  <div style={{ margin: '12px', display: 'flex', gap: 12 }}>
                    {(Object.entries(priceChange) as Array<['liquid_chlorine' | 'hcl31' | 'naclo10', string]>).map(([key, change]) => (
                      <Card key={key} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 12, color: '#999' }}>{PRODUCT_LABELS[key]}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: Number(change) >= 0 ? '#52c41a' : '#f5222d', marginTop: 4 }}>
                          {Number(change) >= 0 ? '+' : ''}{change}%
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                <Card style={{ margin: '12px' }}>
                  <div className="card-title">
                    <span>📈</span>
                    <span>近 {prices.length} 天价格走势</span>
                  </div>
                  <ChartBox height={200}>
                    <LineChart data={prices}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5)} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} 元/吨`, '']} />
                      <Legend />
                      <Line type="monotone" dataKey="liquid_chlorine" name="液氯" stroke="#1677ff" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="hcl31" name="盐酸" stroke="#52c41a" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="naclo10" name="次氯" stroke="#faad14" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartBox>
                </Card>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无价格趋势数据</div>
            )}
          </Tabs.Tab>

          <Tabs.Tab title="收益趋势" key="margin">
            {marginRecent.length > 0 ? (
              <>
                <Card style={{ margin: '12px' }}>
                  <div className="card-title">
                    <span>💰</span>
                    <span>边际贡献趋势（近 {marginRecent.length} 天）</span>
                  </div>
                  <ChartBox height={200}>
                    <BarChart data={marginRecent}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5)} />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                      <Legend />
                      <Bar dataKey="manual" name="人工" fill="#d9d9d9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="system" name="系统" fill="#1677ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartBox>
                </Card>

                <Card style={{ margin: '12px' }}>
                  <div className="card-title">
                    <span>📊</span>
                    <span>累计收益对比（全区间）</span>
                  </div>
                  <div className="summary-row">
                    <div className="summary-item">
                      <div className="summary-label">人工累计</div>
                      <div className="summary-value gray">{formatCurrency(margins.reduce((s, d) => s + d.manual, 0))}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">系统累计</div>
                      <div className="summary-value blue">{formatCurrency(margins.reduce((s, d) => s + d.system, 0))}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">差异</div>
                      <div className="summary-value green">
                        +{formatCurrency(margins.reduce((s, d) => s + (d.system - d.manual), 0))}
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无收益趋势数据</div>
            )}
          </Tabs.Tab>

          <Tabs.Tab title="敏感性" key="sensitivity">
            <SensitivityCard />
          </Tabs.Tab>
        </Tabs>
      </div>
    </div>
  );
}

function SensitivityCard() {
  const decisionName = useAppStore((s) => s.decisionName);
  const naohDaily = useAppStore((s) => s.naohDaily);
  const appPrices = useAppStore((s) => s.prices);
  const [data, setData] = useState<Array<{ shock: number; margin: number }>>([]);

  // 依赖 decisionName/naohDaily/appPrices：参数变化时重新请求并自动取消旧请求
  const { loading, error, run } = useAbortableAsync(async (signal) => {
    const res = await runDecisionSensitivity(decisionName, naohDaily, appPrices);
    if (signal.aborted) return;
    const rows = (res.rows ?? []).filter(
      (r) => r.product_key === 'liquid_chlorine' || r.product === '液氯',
    );
    setData(rows.map((r) => ({ shock: toNum(r.shock_pct), margin: toNum(r.total_margin) })));
  }, [decisionName, naohDaily, appPrices]);

  if (loading) return <SkeletonCard rows={3} />;
  if (error) return <ErrorRetry onRetry={run} />;
  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
        暂无敏感性数据，请先在概览页加载推荐数据
      </div>
    );
  }

  return (
    <Card style={{ margin: '12px' }}>
      <div className="card-title">
        <span>🎯</span>
        <span>价格敏感性分析</span>
      </div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
        液氯价格波动对边际贡献的影响
      </div>
      <ChartBox height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="shock" tickFormatter={(v) => `${Number(v) > 0 ? '+' : ''}${v}%`} />
          <YAxis />
          <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
          <Bar dataKey="margin" name="边际贡献" fill="#1677ff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartBox>
    </Card>
  );
}
