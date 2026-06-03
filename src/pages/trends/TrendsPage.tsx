import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tabs } from 'antd-mobile';
import { PRODUCT_LABELS } from '@/constants';
import { formatCurrency } from '@/utils/format';
import './trends.css';

// 模拟价格趋势数据
const MOCK_PRICES = [
  { date: '5/28', liquid_chlorine: 225, hcl31: 158, naclo10: 410 },
  { date: '5/29', liquid_chlorine: 228, hcl31: 160, naclo10: 408 },
  { date: '5/30', liquid_chlorine: 230, hcl31: 162, naclo10: 405 },
  { date: '5/31', liquid_chlorine: 226, hcl31: 159, naclo10: 412 },
  { date: '6/01', liquid_chlorine: 232, hcl31: 165, naclo10: 400 },
  { date: '6/02', liquid_chlorine: 235, hcl31: 167, naclo10: 398 },
];

// 模拟边际贡献趋势
const MOCK_MARGIN = [
  { date: '5/28', manual: 185200, system: 198500 },
  { date: '5/29', manual: 182100, system: 201200 },
  { date: '5/30', manual: 188000, system: 196800 },
  { date: '5/31', manual: 190500, system: 203100 },
  { date: '6/01', manual: 187300, system: 199400 },
  { date: '6/02', manual: 189100, system: 200800 },
];

export default function TrendsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('price');

  const maxPrice = Math.max(...MOCK_PRICES.map(d => Math.max(d.liquid_chlorine, d.hcl31, d.naclo10)));
  const maxMargin = Math.max(...MOCK_MARGIN.map(d => Math.max(d.manual, d.system)));

  const priceChange = {
    liquid_chlorine: ((MOCK_PRICES[MOCK_PRICES.length - 1].liquid_chlorine - MOCK_PRICES[0].liquid_chlorine) / MOCK_PRICES[0].liquid_chlorine * 100).toFixed(1),
    hcl31: ((MOCK_PRICES[MOCK_PRICES.length - 1].hcl31 - MOCK_PRICES[0].hcl31) / MOCK_PRICES[0].hcl31 * 100).toFixed(1),
    naclo10: ((MOCK_PRICES[MOCK_PRICES.length - 1].naclo10 - MOCK_PRICES[0].naclo10) / MOCK_PRICES[0].naclo10 * 100).toFixed(1),
  };

  return (
    <div className="trends-page">
      <NavBar onBack={() => navigate(-1)}>趋势洞察</NavBar>

      <div className="page-content">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.Tab title="价格走势" key="price">
            {/* 价格变化摘要 */}
            <div style={{ margin: '12px', display: 'flex', gap: 12 }}>
              {Object.entries(priceChange).map(([key, change]) => (
                <Card key={key} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {PRODUCT_LABELS[key as keyof typeof PRODUCT_LABELS]}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: Number(change) >= 0 ? '#52c41a' : '#f5222d', marginTop: 4 }}>
                    {Number(change) >= 0 ? '+' : ''}{change}%
                  </div>
                </Card>
              ))}
            </div>

            {/* 价格趋势图 */}
            <Card style={{ margin: '12px' }}>
              <div className="card-title">
                <span>📈</span>
                <span>近7天价格走势</span>
              </div>
              <div className="chart-container">
                {MOCK_PRICES.map((d) => (
                  <div key={d.date} className="chart-column">
                    <div className="chart-bars">
                      <div className="chart-bar" style={{ height: `${(d.liquid_chlorine / maxPrice) * 100}%`, background: '#1677ff' }} />
                      <div className="chart-bar" style={{ height: `${(d.hcl31 / maxPrice) * 100}%`, background: '#52c41a' }} />
                      <div className="chart-bar" style={{ height: `${(d.naclo10 / maxPrice) * 100}%`, background: '#faad14' }} />
                    </div>
                    <div className="chart-label">{d.date}</div>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span><span className="legend-dot" style={{ background: '#1677ff' }} />液氯</span>
                <span><span className="legend-dot" style={{ background: '#52c41a' }} />盐酸</span>
                <span><span className="legend-dot" style={{ background: '#faad14' }} />次氯</span>
              </div>
            </Card>
          </Tabs.Tab>

          <Tabs.Tab title="收益趋势" key="margin">
            {/* 边际贡献趋势 */}
            <Card style={{ margin: '12px' }}>
              <div className="card-title">
                <span>💰</span>
                <span>边际贡献趋势</span>
              </div>
              <div className="chart-container">
                {MOCK_MARGIN.map((d) => (
                  <div key={d.date} className="chart-column">
                    <div className="chart-bars">
                      <div className="chart-bar wide" style={{ height: `${(d.manual / maxMargin) * 100}%`, background: '#d9d9d9' }} />
                      <div className="chart-bar wide" style={{ height: `${(d.system / maxMargin) * 100}%`, background: '#1677ff' }} />
                    </div>
                    <div className="chart-label">{d.date}</div>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span><span className="legend-dot" style={{ background: '#d9d9d9' }} />人工</span>
                <span><span className="legend-dot" style={{ background: '#1677ff' }} />系统</span>
              </div>
            </Card>

            {/* 累计趋势 */}
            <Card style={{ margin: '12px' }}>
              <div className="card-title">
                <span>📊</span>
                <span>累计收益对比</span>
              </div>
              <div className="summary-row">
                <div className="summary-item">
                  <div className="summary-label">人工累计</div>
                  <div className="summary-value gray">{formatCurrency(MOCK_MARGIN.reduce((s, d) => s + d.manual, 0))}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">系统累计</div>
                  <div className="summary-value blue">{formatCurrency(MOCK_MARGIN.reduce((s, d) => s + d.system, 0))}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">差异</div>
                  <div className="summary-value green">
                    +{formatCurrency(MOCK_MARGIN.reduce((s, d) => s + (d.system - d.manual), 0))}
                  </div>
                </div>
              </div>
            </Card>
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
  const [sensitivityData, setSensitivityData] = useState<any[]>([]);

  useEffect(() => {
    const mockData = [
      { product: '液氯', shock: -10, margin: 185000 },
      { product: '液氯', shock: -5, margin: 192000 },
      { product: '液氯', shock: 0, margin: 200800 },
      { product: '液氯', shock: 5, margin: 208000 },
      { product: '液氯', shock: 10, margin: 215000 },
    ];
    setSensitivityData(mockData);
  }, []);

  return (
    <Card style={{ margin: '12px' }}>
      <div className="card-title">
        <span>🎯</span>
        <span>价格敏感性分析</span>
      </div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
        液氯价格波动对边际贡献的影响
      </div>
      <div className="sensitivity-list">
        {sensitivityData.map((d, i) => (
          <div key={i} className="sensitivity-row">
            <span className="sensitivity-shock">{d.shock > 0 ? '+' : ''}{d.shock}%</span>
            <div className="sensitivity-bar-bg">
              <div
                className="sensitivity-bar-fill"
                style={{ width: `${((d.margin - 180000) / 40000) * 100}%` }}
              />
            </div>
            <span className="sensitivity-margin">{formatCurrency(d.margin)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
