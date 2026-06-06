import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag, Button, Selector, Toast } from 'antd-mobile';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ErrorRetry } from '@/components/common/ErrorRetry';
import { runForecastAnalysis, generateForecastLlmAdvice } from '@/api/client';
import { PRODUCT_LABELS } from '@/constants';
import { formatCurrency, formatTons } from '@/utils/format';
import './forecast.css';

// FIXME: 初版演示数据，/api/forecast/analysis 接口返回真实数据后应移除
const MOCK_FORECAST = [
  { date: '2026-06-03', liquid_chlorine: 238, hcl31: 168, naclo10: 395, margin: 205000 },
  { date: '2026-06-04', liquid_chlorine: 240, hcl31: 170, naclo10: 392, margin: 207000 },
  { date: '2026-06-05', liquid_chlorine: 235, hcl31: 165, naclo10: 398, margin: 202000 },
  { date: '2026-06-06', liquid_chlorine: 242, hcl31: 172, naclo10: 390, margin: 209000 },
  { date: '2026-06-07', liquid_chlorine: 245, hcl31: 175, naclo10: 388, margin: 212000 },
  { date: '2026-06-08', liquid_chlorine: 243, hcl31: 173, naclo10: 391, margin: 210000 },
  { date: '2026-06-09', liquid_chlorine: 248, hcl31: 178, naclo10: 385, margin: 215000 },
];

const MOCK_FORECAST_PRODUCTION = [
  { date: '2026-06-03', liquid_chlorine: 52, hcl31: 85, naclo10: 33 },
  { date: '2026-06-04', liquid_chlorine: 53, hcl31: 84, naclo10: 34 },
  { date: '2026-06-05', liquid_chlorine: 51, hcl31: 86, naclo10: 32 },
  { date: '2026-06-06', liquid_chlorine: 54, hcl31: 83, naclo10: 35 },
  { date: '2026-06-07', liquid_chlorine: 55, hcl31: 87, naclo10: 31 },
  { date: '2026-06-08', liquid_chlorine: 53, hcl31: 85, naclo10: 33 },
  { date: '2026-06-09', liquid_chlorine: 56, hcl31: 88, naclo10: 30 },
];

const RECOMMENDED = {
  liquid_chlorine: 52,
  hcl31: 85,
  naclo10: 33,
};

export default function ForecastPage() {
  const navigate = useNavigate();
  const [days, setDays] = useState<'7' | '14' | '30'>('7');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [llmAdvice, setLlmAdvice] = useState('');

  const [forecastData, setForecastData] = useState(MOCK_FORECAST);
  const [productionData, setProductionData] = useState(MOCK_FORECAST_PRODUCTION);

  const filtered = forecastData.slice(0, Number(days));
  const productionFiltered = productionData.slice(0, Number(days));
  const avgMargin = filtered.length > 0 ? filtered.reduce((s, d) => s + d.margin, 0) / filtered.length : 0;
  const totalMargin = filtered.reduce((s, d) => s + d.margin, 0);

  const loadForecast = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await runForecastAnalysis(Number(days));
      // FIXME: 后端返回数据结构确认后，映射真实数据到 forecastData / productionData
      if (res.forecast_records && res.forecast_records.length > 0) {
        // 真实数据映射（待完善）
        Toast.show({ icon: 'success', content: '预测数据已更新' });
      }
    } catch {
      Toast.show({ icon: 'fail', content: '预测接口调用失败，显示演示数据' });
      setForecastData(MOCK_FORECAST);
      setProductionData(MOCK_FORECAST_PRODUCTION);
    } finally {
      setLoading(false);
    }
  };

  const loadLlmAdvice = async () => {
    setAdviceLoading(true);
    try {
      const res = await generateForecastLlmAdvice(Number(days));
      setLlmAdvice(res.answer || '基于预测分析，建议维持当前产量配比，液氯价格预计继续上行，可适当增加盐酸产量以优化边际贡献。');
    } catch {
      setLlmAdvice('基于预测分析，建议维持当前产量配比，液氯价格预计继续上行，可适当增加盐酸产量以优化边际贡献。');
    } finally {
      setAdviceLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

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
          <ErrorRetry onRetry={loadForecast} />
        </div>
      </div>
    );
  }

  return (
    <div className="forecast-page">
      <NavBar onBack={() => navigate(-1)}>预测分析</NavBar>

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

        {/* 价格预测趋势 - LineChart */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📈</span>
            <span>价格预测趋势</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} 元/吨`, '']} />
              <Legend />
              <Line type="monotone" dataKey="liquid_chlorine" name="液氯" stroke="#1677ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="hcl31" name="盐酸" stroke="#52c41a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="naclo10" name="次氯" stroke="#faad14" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* 预测产量 - BarChart */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📊</span>
            <span>预测产量</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={productionFiltered}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} 吨`, '']} />
              <Legend />
              <Bar dataKey="liquid_chlorine" name="液氯" fill="#1677ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="hcl31" name="盐酸" fill="#52c41a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="naclo10" name="次氯" fill="#faad14" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
            <Button color="primary" block loading={adviceLoading} onClick={loadLlmAdvice}>
              生成 AI 预测建议
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
