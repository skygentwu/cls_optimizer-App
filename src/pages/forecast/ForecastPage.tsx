import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag, Button, Selector, Toast } from 'antd-mobile';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartBox } from '@/components/common/ChartBox';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ErrorRetry } from '@/components/common/ErrorRetry';
import { runForecastAnalysis, generateForecastLlmAdvice } from '@/api/client';
import { PRODUCT_LABELS } from '@/constants';
import { formatCurrency, formatTons } from '@/utils/format';
import { toNum, pick, CN_PRODUCT } from '@/utils/record';
import { useAbortableAsync } from '@/hooks/useAbortableAsync';
import './forecast.css';

interface PricePoint { date: string; liquid_chlorine: number; hcl31: number; naclo10: number }
interface OutputPoint { date: string; liquid_chlorine: number; hcl31: number; naclo10: number }

export default function ForecastPage() {
  const navigate = useNavigate();
  const [days, setDays] = useState<'7' | '14' | '30'>('7');
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [llmAdvice, setLlmAdvice] = useState('');

  const [priceTrend, setPriceTrend] = useState<PricePoint[]>([]);
  const [productionTrend, setProductionTrend] = useState<OutputPoint[]>([]);
  const [recommended, setRecommended] = useState<Record<'liquid_chlorine' | 'hcl31' | 'naclo10', number>>({
    liquid_chlorine: 0, hcl31: 0, naclo10: 0,
  });
  const [avgMargin, setAvgMargin] = useState(0);
  const [totalMargin, setTotalMargin] = useState(0);

  // 依赖 days：快速切换 7/14/30 天会并发请求，自动取消旧请求避免旧响应覆盖新数据
  const { loading, error, run } = useAbortableAsync(async (signal) => {
    const res = await runForecastAnalysis(Number(days));
    if (signal.aborted) return;

    const prices: PricePoint[] = (res.forecast_records ?? [])
      .map((r) => ({
        date: String(pick(r, '日期', 'date') ?? ''),
        liquid_chlorine: toNum(pick(r, '液氯_元/吨', 'liquid_chlorine')),
        hcl31: toNum(pick(r, '31%盐酸_元/吨', 'hcl31')),
        naclo10: toNum(pick(r, '10%次氯_元/吨', 'naclo10')),
      }))
      .filter((p) => p.date);

    const production: OutputPoint[] = (res.output_trend_records ?? [])
      .map((r) => ({
        date: String(pick(r, 'date', '日期') ?? ''),
        liquid_chlorine: toNum(pick(r, 'liquid_chlorine')),
        hcl31: toNum(pick(r, 'hcl31')),
        naclo10: toNum(pick(r, 'naclo10')),
      }))
      .filter((p) => p.date);

    const benefit = res.benefit_summary ?? {};
    const avgPlan = (benefit.avg_plan ?? {}) as Record<string, unknown>;

    setPriceTrend(prices);
    setProductionTrend(production);
    setAvgMargin(toNum(benefit.avg_profit));
    setTotalMargin(toNum(benefit.cumulative_profit));
    setRecommended({
      liquid_chlorine: toNum(avgPlan[CN_PRODUCT.liquid_chlorine]),
      hcl31: toNum(avgPlan[CN_PRODUCT.hcl31]),
      naclo10: toNum(avgPlan[CN_PRODUCT.naclo10]),
    });
  }, [days]);

  const loadLlmAdvice = async () => {
    setAdviceLoading(true);
    try {
      const res = await generateForecastLlmAdvice(Number(days));
      setLlmAdvice(res.answer || '暂无预测建议。');
    } catch {
      Toast.show({ icon: 'fail', content: '生成建议失败' });
    } finally {
      setAdviceLoading(false);
    }
  };

  const filtered = priceTrend.slice(0, Number(days));
  const productionFiltered = productionTrend.slice(0, Number(days));
  const hasData = filtered.length > 0 || productionFiltered.length > 0;

  if (loading) {
    return (
      <div className="forecast-page">
        <NavBar onBack={() => navigate(-1)}>预测分析</NavBar>
        <div className="page-content">
          <SkeletonCard rows={3} />
          <SkeletonCard rows={4} />
          <SkeletonCard rows={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="forecast-page">
        <NavBar onBack={() => navigate(-1)}>预测分析</NavBar>
        <div className="page-content">
          <ErrorRetry onRetry={run} />
        </div>
      </div>
    );
  }

  return (
    <div className="forecast-page">
      <NavBar onBack={() => navigate(-1)}>预测分析</NavBar>

      <div className="page-content">
        <div style={{ margin: '12px' }}>
          <Selector
            options={[
              { label: '未来7天', value: '7' },
              { label: '未来14天', value: '14' },
              { label: '未来30天', value: '30' },
            ]}
            value={[days]}
            onChange={(v) => v[0] && setDays(v[0] as '7' | '14' | '30')}
            showCheckMark={false}
          />
        </div>

        {!hasData ? (
          <div style={{ textAlign: 'center', padding: '40px 12px', color: '#999', fontSize: 14 }}>
            暂无预测数据。请先在 PC 端维护并保存“预测价格”，再回到此页查看。
          </div>
        ) : (
          <>
            <div style={{ margin: '0 12px', display: 'flex', gap: 8 }}>
              <Card style={{ flex: 1, textAlign: 'center' }}>
                <div className="metric-label">预测日均边际贡献</div>
                <div className="metric-value" style={{ color: '#1677ff' }}>{formatCurrency(avgMargin)}</div>
              </Card>
              <Card style={{ flex: 1, textAlign: 'center' }}>
                <div className="metric-label">预测期累计</div>
                <div className="metric-value" style={{ color: '#52c41a' }}>{formatCurrency(totalMargin)}</div>
              </Card>
            </div>

            <Card style={{ margin: '12px' }}>
              <div className="card-title">
                <span>📊</span>
                <span>系统推荐产量（预测期均值）</span>
              </div>
              <div className="product-grid">
                {(Object.keys(recommended) as Array<keyof typeof recommended>).map((key) => (
                  <div key={key} className="product-card">
                    <div className="product-name">{PRODUCT_LABELS[key]}</div>
                    <div className="product-value">{formatTons(recommended[key])}</div>
                  </div>
                ))}
              </div>
            </Card>

            {filtered.length > 0 && (
              <Card style={{ margin: '12px' }}>
                <div className="card-title">
                  <span>📈</span>
                  <span>价格预测趋势</span>
                </div>
                <ChartBox height={200}>
                  <LineChart data={filtered}>
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
            )}

            {productionFiltered.length > 0 && (
              <Card style={{ margin: '12px' }}>
                <div className="card-title">
                  <span>📊</span>
                  <span>预测产量</span>
                </div>
                <ChartBox height={200}>
                  <BarChart data={productionFiltered}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(v) => String(v).slice(5)} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} 吨`, '']} />
                    <Legend />
                    <Bar dataKey="liquid_chlorine" name="液氯" fill="#1677ff" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hcl31" name="盐酸" fill="#52c41a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="naclo10" name="次氯" fill="#faad14" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartBox>
              </Card>
            )}

            <Card style={{ margin: '12px' }}>
              <div className="card-title">
                <span>🤖</span>
                <span>AI 预测建议</span>
                <Tag color="primary">{days}天</Tag>
              </div>
              {llmAdvice ? (
                <div className="advice-content">{llmAdvice}</div>
              ) : (
                <Button color="primary" block loading={adviceLoading} onClick={loadLlmAdvice}>
                  生成 AI 预测建议
                </Button>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
