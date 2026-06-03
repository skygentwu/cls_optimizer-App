import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag, Selector } from 'antd-mobile';
import { fetchBacktestRange, runBacktestAnalysis } from '@/api/client';
import { formatCurrency } from '@/utils/format';
import './backtest.css';

// 模拟回测数据
const MOCK_BACKTEST = [
  { date: '2026-05-01', manual: 182000, system: 195000, diff: 13000, products: { liquid_chlorine: 45, hcl31: 82, naclo10: 28 } },
  { date: '2026-05-02', manual: 185000, system: 198000, diff: 13000, products: { liquid_chlorine: 48, hcl31: 80, naclo10: 30 } },
  { date: '2026-05-03', manual: 183000, system: 197000, diff: 14000, products: { liquid_chlorine: 46, hcl31: 81, naclo10: 29 } },
  { date: '2026-05-04', manual: 188000, system: 202000, diff: 14000, products: { liquid_chlorine: 50, hcl31: 83, naclo10: 31 } },
  { date: '2026-05-05', manual: 186000, system: 200000, diff: 14000, products: { liquid_chlorine: 49, hcl31: 82, naclo10: 30 } },
  { date: '2026-05-06', manual: 190000, system: 204000, diff: 14000, products: { liquid_chlorine: 51, hcl31: 84, naclo10: 32 } },
  { date: '2026-05-07', manual: 187000, system: 201000, diff: 14000, products: { liquid_chlorine: 49, hcl31: 83, naclo10: 30 } },
  { date: '2026-05-08', manual: 184000, system: 199000, diff: 15000, products: { liquid_chlorine: 47, hcl31: 81, naclo10: 29 } },
  { date: '2026-05-09', manual: 189000, system: 203000, diff: 14000, products: { liquid_chlorine: 50, hcl31: 83, naclo10: 31 } },
  { date: '2026-05-10', manual: 191000, system: 205000, diff: 14000, products: { liquid_chlorine: 52, hcl31: 84, naclo10: 32 } },
];

export default function BacktestPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<'7' | '14' | '30'>('14');
  const [data] = useState(MOCK_BACKTEST);

  const filtered = data.slice(0, Number(range));
  const totalDiff = filtered.reduce((s, d) => s + d.diff, 0);
  const avgDiff = totalDiff / filtered.length;
  const bestDay = filtered.reduce((max, d) => d.diff > max.diff ? d : max, filtered[0]);
  const winRate = (filtered.filter(d => d.system > d.manual).length / filtered.length * 100).toFixed(0);

  const loadBacktest = async () => {
    try {
      await fetchBacktestRange();
      const analysis = await runBacktestAnalysis();
      if (analysis.detail_records) {
        // 处理真实数据
      }
    } catch {
      // 使用模拟数据
    }
  };

  useEffect(() => {
    loadBacktest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="backtest-page">
      <NavBar onBack={() => navigate(-1)}>历史回测</NavBar>

      <div className="page-content">
        {/* 累计收益差异 */}
        <Card className="hero-card" style={{ margin: '12px' }}>
          <div className="hero-label">近 {filtered.length} 天累计收益差异</div>
          <div className="hero-diff">
            <span className="diff-positive">+{formatCurrency(totalDiff)}</span>
          </div>
          <div className="hero-sub">
            系统推荐在 {winRate}% 的天数中收益更优
          </div>
        </Card>

        {/* 关键指标 */}
        <div style={{ margin: '0 12px', display: 'flex', gap: 8 }}>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div className="metric-label">日均提升</div>
            <div className="metric-value" style={{ color: '#1677ff' }}>+{formatCurrency(avgDiff)}</div>
          </Card>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div className="metric-label">最优单日</div>
            <div className="metric-value" style={{ color: '#52c41a' }}>+{formatCurrency(bestDay.diff)}</div>
            <div style={{ fontSize: 11, color: '#999' }}>{bestDay.date}</div>
          </Card>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div className="metric-label">胜率</div>
            <div className="metric-value" style={{ color: '#faad14' }}>{winRate}%</div>
          </Card>
        </div>

        {/* 日期范围选择 */}
        <div style={{ margin: '12px' }}>
          <Selector
            options={[
              { label: '近7天', value: '7' },
              { label: '近14天', value: '14' },
              { label: '近30天', value: '30' },
            ]}
            value={[range]}
            onChange={(v) => setRange(v[0] as '7' | '14' | '30')}
            showCheckMark={false}
          />
        </div>

        {/* 趋势图 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📈</span>
            <span>收益趋势对比</span>
          </div>
          <div className="chart-container">
            {filtered.map((d) => (
              <div key={d.date} className="chart-column">
                <div className="chart-bars">
                  <div className="chart-bar manual" style={{ height: `${(d.manual / 220000) * 100}%` }} />
                  <div className="chart-bar system" style={{ height: `${(d.system / 220000) * 100}%` }} />
                </div>
                <div className="chart-label">{d.date.slice(5)}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><span className="legend-dot" style={{ background: '#d9d9d9' }} />人工</span>
            <span><span className="legend-dot" style={{ background: '#1677ff' }} />系统</span>
          </div>
        </Card>

        {/* 明细表格 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📋</span>
            <span>每日明细</span>
          </div>
          <div className="detail-list">
            <div className="detail-header">
              <span>日期</span>
              <span>人工</span>
              <span>系统</span>
              <span>差额</span>
            </div>
            {filtered.map((d) => (
              <div key={d.date} className="detail-row">
                <span>{d.date}</span>
                <span>{formatCurrency(d.manual)}</span>
                <span style={{ color: '#1677ff', fontWeight: 600 }}>{formatCurrency(d.system)}</span>
                <Tag color="success">+{formatCurrency(d.diff)}</Tag>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
