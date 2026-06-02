import { useState, useEffect } from 'react';
import { NavBar, Card, Tag, Button, Selector } from 'antd-mobile';
import { runForecastAnalysis, generateForecastLlmAdvice } from '@/api/client';
import { PRODUCT_LABELS } from '@/constants';
import { formatCurrency, formatTons } from '@/utils/format';
import './forecast.css';

// 模拟预测数据
const MOCK_FORECAST = [
  { date: '2026-06-03', liquid_chlorine: 238, hcl31: 168, naclo10: 395, margin: 205000 },
  { date: '2026-06-04', liquid_chlorine: 240, hcl31: 170, naclo10: 392, margin: 207000 },
  { date: '2026-06-05', liquid_chlorine: 235, hcl31: 165, naclo10: 398, margin: 202000 },
  { date: '2026-06-06', liquid_chlorine: 242, hcl31: 172, naclo10: 390, margin: 209000 },
  { date: '2026-06-07', liquid_chlorine: 245, hcl31: 175, naclo10: 388, margin: 212000 },
  { date: '2026-06-08', liquid_chlorine: 243, hcl31: 173, naclo10: 391, margin: 210000 },
  { date: '2026-06-09', liquid_chlorine: 248, hcl31: 178, naclo10: 385, margin: 215000 },
];

const RECOMMENDED = {
  liquid_chlorine: 52,
  hcl31: 85,
  naclo10: 33,
};

export default function ForecastPage() {
  const [days, setDays] = useState<'7' | '14' | '30'>('7');
  const [loading, setLoading] = useState(false);
  const [llmAdvice, setLlmAdvice] = useState('');

  const filtered = MOCK_FORECAST.slice(0, Number(days));
  const avgMargin = filtered.reduce((s, d) => s + d.margin, 0) / filtered.length;
  const totalMargin = filtered.reduce((s, d) => s + d.margin, 0);

  const loadForecast = async () => {
    setLoading(true);
    try {
      await runForecastAnalysis(Number(days));
      // 处理真实数据
    } catch {
      // 使用模拟数据
    } finally {
      setLoading(false);
    }
  };

  const loadLlmAdvice = async () => {
    setLoading(true);
    try {
      const res = await generateForecastLlmAdvice(Number(days));
      setLlmAdvice(res.answer || '基于预测分析，建议维持当前产量配比，液氯价格预计继续上行，可适当增加盐酸产量以优化边际贡献。');
    } catch {
      setLlmAdvice('基于预测分析，建议维持当前产量配比，液氯价格预计继续上行，可适当增加盐酸产量以优化边际贡献。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  return (
    <div className="forecast-page">
      <NavBar back={null}>预测分析</NavBar>

      <div className="page-content">
        {/* 预测天数选择 */}
        <div style={{ margin: '12px' }}>
          <Selector
            options={[
              { label: '未来7天', value: '7' },
              { label: '未来14天', value: '14' },
              { label: '未来30天', value: '30' },
            ]}
            value={[days]}
            onChange={(v) => setDays(v[0] as '7' | '14' | '30')}
            showCheckMark={false}
          />
        </div>

        {/* 核心指标 */}
        <div style={{ margin: '0 12px', display: 'flex', gap: 8 }}>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div className="metric-label">预测日均边际贡献</div>
            <div className="metric-value" style={{ color: '#1677ff' }}>{formatCurrency(avgMargin)}</div>
          </Card>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div className="metric-label">{days}天累计</div>
            <div className="metric-value" style={{ color: '#52c41a' }}>{formatCurrency(totalMargin)}</div>
          </Card>
        </div>

        {/* 推荐产量 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📊</span>
            <span>系统推荐产量（预测期）</span>
          </div>
          <div className="product-grid">
            {Object.entries(RECOMMENDED).map(([key, value]) => (
              <div key={key} className="product-card">
                <div className="product-name">{PRODUCT_LABELS[key as keyof typeof PRODUCT_LABELS]}</div>
                <div className="product-value">{formatTons(value)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* 价格预测趋势 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📈</span>
            <span>价格预测趋势</span>
          </div>
          <div className="forecast-list">
            {filtered.map((d) => (
              <div key={d.date} className="forecast-row">
                <div className="forecast-date">{d.date.slice(5)}</div>
                <div className="forecast-prices">
                  <span className="price-tag blue">液氯 {d.liquid_chlorine}</span>
                  <span className="price-tag green">盐酸 {d.hcl31}</span>
                  <span className="price-tag orange">次氯 {d.naclo10}</span>
                </div>
                <div className="forecast-margin">{formatCurrency(d.margin)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* AI 预测建议 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>🤖</span>
            <span>AI 预测建议</span>
            <Tag color="primary">{days}天</Tag>
          </div>
          {llmAdvice ? (
            <div className="advice-content">{llmAdvice}</div>
          ) : (
            <Button color="primary" block loading={loading} onClick={loadLlmAdvice}>
              生成 AI 预测建议
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
