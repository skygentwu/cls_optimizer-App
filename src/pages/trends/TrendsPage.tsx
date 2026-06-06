import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tabs } from 'antd-mobile';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ErrorRetry } from '@/components/common/ErrorRetry';
import { PRODUCT_LABELS } from '@/constants';
import { formatCurrency } from '@/utils/format';
import './trends.css';

// FIXME: 初版演示数据，待 /api/prices 和 /api/decisions 提供趋势聚合接口后替换为真实数据
const MOCK_PRICES: Array<Record<string, any>> = [];
const MOCK_MARGIN: Array<Record<string, any>> = [];

export default function TrendsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('price');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
          <ErrorRetry onRetry={loadData} />
        </div>
      </div>
    );
  }

  const priceChange = MOCK_PRICES.length >= 2 ? {
    liquid_chlorine: ((MOCK_PRICES[MOCK_PRICES.length - 1].liquid_chlorine - MOCK_PRICES[0].liquid_chlorine) / MOCK_PRICES[0].liquid_chlorine * 100).toFixed(1),
    hcl31: ((MOCK_PRICES[MOCK_PRICES.length - 1].hcl31 - MOCK_PRICES[0].hcl31) / MOCK_PRICES[0].hcl31 * 100).toFixed(1),
    naclo10: ((MOCK_PRICES[MOCK_PRICES.length - 1].naclo10 - MOCK_PRICES[0].naclo10) / MOCK_PRICES[0].naclo10 * 100).toFixed(1),
  } : {};

  return (
    <div className="trends-page">
      <NavBar onBack={() => navigate(-1)}>趋势洞察</NavBar>

      <div className="page-content">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.Tab title="价格走势" key="price">
            {MOCK_PRICES.length > 0 ? (
              <>
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
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={MOCK_PRICES}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} 元/吨`, '']} />
                      <Legend />
                      <Line type="monotone" dataKey="liquid_chlorine" name="液氯" stroke="#1677ff" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="hcl31" name="盐酸" stroke="#52c41a" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="naclo10" name="次氯" stroke="#faad14" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无价格趋势数据
              </div>
            )}

            {/* 价格趋势图 */}
            <Card style={{ margin: '12px' }}>
              <div className="card-title">
                <span>📈</span>
                <span>近7天价格走势</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={MOCK_PRICES}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} 元/吨`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="liquid_chlorine" name="液氯" stroke="#1677ff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="hcl31" name="盐酸" stroke="#52c41a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="naclo10" name="次氯" stroke="#faad14" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Tabs.Tab>

          <Tabs.Tab title="收益趋势" key="margin">
            {MOCK_MARGIN.length > 0 ? (
              <>
                {/* 边际贡献趋势 */}
                <Card style={{ margin: '12px' }}>
                  <div className="card-title">
                    <span>💰</span>
                    <span>边际贡献趋势</span>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={MOCK_MARGIN}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                      <Legend />
                      <Bar dataKey="manual" name="人工" fill="#d9d9d9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="system" name="系统" fill="#1677ff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
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
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无收益趋势数据
              </div>
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
  const [sensitivityData, setSensitivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const mockData = [
        { product: '液氯', shock: -10, margin: 185000 },
        { product: '液氯', shock: -5, margin: 192000 },
        { product: '液氯', shock: 0, margin: 200800 },
        { product: '液氯', shock: 5, margin: 208000 },
        { product: '液氯', shock: 10, margin: 215000 },
      ];
      setSensitivityData(mockData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <SkeletonCard rows={3} />;
  if (error) return <ErrorRetry onRetry={fetchData} />;

  return (
    <Card style={{ margin: '12px' }}>
      <div className="card-title">
        <span>🎯</span>
        <span>价格敏感性分析</span>
      </div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
        液氯价格波动对边际贡献的影响
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={sensitivityData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="shock" tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}%`} />
          <YAxis />
          <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
          <Bar dataKey="margin" name="边际贡献" fill="#1677ff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
