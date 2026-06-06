import { useState } from 'react';
import { NavBar, Button, Card, Tag, Toast, Stepper, PickerView, Popup } from 'antd-mobile';
import { useAppStore } from '@/stores/appStore';
import { runOptimization, recommendDecision } from '@/api/client';
import { PRODUCT_LABELS, DEFAULT_NAOH_DAILY } from '@/constants';
import { formatCurrency, formatTons } from '@/utils/format';
import './recommendation.css';

export default function RecommendationPage() {
  const store = useAppStore();
  const [loading, setLoading] = useState(false);
  const [showModePicker, setShowModePicker] = useState(false);
  const [localNaoh, setLocalNaoh] = useState(store.naohDaily || DEFAULT_NAOH_DAILY);
  const [localPrices, setLocalPrices] = useState({ ...store.prices });

  const modeColumns = store.modes
    .filter((m) => m.enabled)
    .map((m) => ({ label: m.name, value: m.name }));

  const handleCalculate = async () => {
    setLoading(true);
    try {
      store.setNaohDaily(localNaoh);
      store.setPrices(localPrices);

      await runOptimization(localNaoh, localPrices, store.decisionName);
      const recRes = await recommendDecision(store.decisionName, localNaoh, localPrices);

      store.setRecommendation(recRes);
      Toast.show({ icon: 'success', content: '计算完成' });
    } catch {
      Toast.show({ icon: 'fail', content: '计算失败，请检查参数' });
    } finally {
      setLoading(false);
    }
  };

  const rec = store.recommendation;

  return (
    <div className="recommendation-page">
      <NavBar back={null}>最优推荐</NavBar>

      <div className="page-content">
        {/* 输入参数 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>⚙️</span>
            <span>计算参数</span>
          </div>

          <div className="form-group">
            <label className="form-label">
              烧碱折百日产量 (吨/天)
              <Stepper
                value={localNaoh}
                onChange={(val) => setLocalNaoh(val)}
                min={100}
                max={2000}
                step={10}
              />
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">决策模式</label>
            <div className="picker-trigger" onClick={() => setShowModePicker(true)}>
              {store.decisionName}
              <span style={{ color: '#999' }}>▼</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">产品价格 (元/吨)</label>
            <div className="price-inputs">
              {Object.entries(localPrices).map(([key, value]) => (
                <div key={key} className="price-input-item">
                  <label>{PRODUCT_LABELS[key as keyof typeof PRODUCT_LABELS]}</label>
                  <Stepper
                    aria-label={PRODUCT_LABELS[key as keyof typeof PRODUCT_LABELS]}
                    value={value}
                    onChange={(val) =>
                      setLocalPrices((prev) => ({ ...prev, [key]: val }))
                    }
                    min={0}
                    max={10000}
                    step={10}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            color="primary"
            block
            loading={loading}
            onClick={handleCalculate}
            style={{ marginTop: 16, borderRadius: 24 }}
          >
            🚀 计算最优方案
          </Button>
        </Card>

        {/* 计算结果 */}
        {rec?.products && (
          <Card style={{ margin: '12px', background: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)' }}>
            <div className="card-title">
              <span>📊</span>
              <span>推荐方案</span>
              <Tag color={rec.status === 'OPTIMAL' ? 'success' : 'warning'}>
                {rec.status === 'OPTIMAL' ? '全局最优' : '可行方案'}
              </Tag>
            </div>

            <div className="result-products">
              {Object.entries(rec.products).map(([key, value]) => (
                <div key={key} className="result-product-item">
                  <div className="result-product-info">
                    <div className="result-product-name">
                      {PRODUCT_LABELS[key as keyof typeof PRODUCT_LABELS]}
                    </div>
                    <div className="result-product-bar">
                      <div
                        className="result-product-bar-inner"
                        style={{ width: `${Math.min((value / localNaoh) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="result-product-value">{formatTons(value)}</div>
                </div>
              ))}
            </div>

            <div className="result-summary">
              <div className="result-summary-item">
                <div className="result-summary-label">边际贡献</div>
                <div className="result-summary-value highlight">
                  {formatCurrency(rec.total_margin)}
                </div>
              </div>
              <div className="result-summary-item">
                <div className="result-summary-label">总产量</div>
                <div className="result-summary-value">
                  {formatTons(Object.values(rec.products).reduce((a, b) => a + b, 0))}
                </div>
              </div>
            </div>

            {rec.conclusion && (
              <div style={{ marginTop: 12, padding: 12, background: '#f6ffed', borderRadius: 8, fontSize: 13, color: '#389e0d' }}>
                {rec.conclusion}
              </div>
            )}
          </Card>
        )}
      </div>

      <Popup visible={showModePicker} onMaskClick={() => setShowModePicker(false)}>
        <div style={{ padding: 20, background: '#fff' }}>
          <div style={{ textAlign: 'center', fontWeight: 600, marginBottom: 16 }}>选择决策模式</div>
          <PickerView
            columns={[modeColumns]}
            value={[store.decisionName]}
            onChange={(val) => {
              if (val[0]) store.setDecisionName(String(val[0]));
            }}
          />
          <Button color="primary" block onClick={() => setShowModePicker(false)} style={{ marginTop: 16 }}>
            确定
          </Button>
        </div>
      </Popup>
    </div>
  );
}
