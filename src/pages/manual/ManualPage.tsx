import { useState } from 'react';
import { NavBar, Button, Card, Tag, Toast, Stepper, ProgressBar } from 'antd-mobile';
import { useAppStore } from '@/stores/appStore';
import { evaluateManualPlan } from '@/api/client';
import { PRODUCT_LABELS } from '@/constants';
import { formatCurrency, formatTons } from '@/utils/format';
import './manual.css';

export default function ManualPage() {
  const store = useAppStore();
  const [loading, setLoading] = useState(false);
  const [localProducts, setLocalProducts] = useState({ ...store.manualProducts });

  const handleSyncFromRecommendation = () => {
    const rec = store.recommendation;
    if (rec?.products) {
      setLocalProducts({ ...rec.products });
      store.setManualProducts({ ...rec.products });
      Toast.show({ icon: 'success', content: '已同步推荐方案' });
    } else {
      Toast.show({ icon: 'fail', content: '暂无推荐方案，请先计算' });
    }
  };

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      store.setManualProducts(localProducts);
      const rec = store.recommendation;

      const res = await evaluateManualPlan(
        store.naohDaily,
        store.prices,
        localProducts,
        rec?.products ?? null,
        rec?.total_margin ?? null
      );

      store.setManualResult({
        totalMargin: res.total_margin,
        cl2Diff: res.cl2_diff,
        isBalanced: res.is_cl2_balanced,
        compareRows: res.compare_rows,
      });

      Toast.show({ icon: 'success', content: '评估完成' });
    } catch {
      Toast.show({ icon: 'fail', content: '评估失败' });
    } finally {
      setLoading(false);
    }
  };

  const manualResult = store.manualResult;
  const cl2BalancePercent = manualResult
    ? Math.max(0, Math.min(100, 100 - Math.abs(manualResult.cl2Diff) * 2))
    : 0;

  return (
    <div className="manual-page">
      <NavBar back={null}>手动模拟</NavBar>

      <div className="page-content">
        {/* 产量输入 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>✏️</span>
            <span>人工调整产量</span>
          </div>

          <Button
            size="mini"
            color="primary"
            fill="outline"
            onClick={handleSyncFromRecommendation}
            style={{ marginBottom: 16 }}
          >
            同步推荐方案
          </Button>

          <div className="product-inputs">
            {Object.entries(localProducts).map(([key, value]) => (
              <div key={key} className="product-input-row">
                <div className="product-input-label">
                  <span>{PRODUCT_LABELS[key as keyof typeof PRODUCT_LABELS]}</span>
                  <span className="product-input-unit">吨/天</span>
                </div>
                <Stepper
                  value={value}
                  onChange={(val) =>
                    setLocalProducts((prev) => ({ ...prev, [key]: val }))
                  }
                  min={0}
                  max={1000}
                  step={5}
                  digits={1}
                />
              </div>
            ))}
          </div>

          <Button
            color="primary"
            block
            loading={loading}
            onClick={handleEvaluate}
            style={{ marginTop: 16, borderRadius: 24 }}
          >
            🔍 评估人工方案
          </Button>
        </Card>

        {/* 评估结果 */}
        {manualResult && (
          <Card style={{ margin: '12px' }}>
            <div className="card-title">
              <span>📋</span>
              <span>评估结果</span>
              <Tag color={manualResult.isBalanced ? 'success' : 'warning'}>
                {manualResult.isBalanced ? '氯气平衡' : '氯气失衡'}
              </Tag>
            </div>

            {/* 氯气平衡 */}
            <div className="cl2-balance-section">
              <div className="cl2-balance-header">
                <span>氯气平衡度</span>
                <span className={manualResult.isBalanced ? 'status-optimal' : 'status-warning'}>
                  {manualResult.cl2Diff > 0 ? '+' : ''}{formatTons(manualResult.cl2Diff)}
                </span>
              </div>
              <ProgressBar
                percent={cl2BalancePercent}
                style={{ '--fill-color': manualResult.isBalanced ? '#52c41a' : '#faad14' }}
              />
            </div>

            {/* 收益对比 */}
            <div className="margin-compare">
              <div className="margin-item">
                <div className="margin-label">人工方案边际贡献</div>
                <div className="margin-value">{formatCurrency(manualResult.totalMargin)}</div>
              </div>
              {store.recommendation && (
                <div className="margin-item">
                  <div className="margin-label">系统推荐边际贡献</div>
                  <div className="margin-value recommended">{formatCurrency(store.recommendation.total_margin)}</div>
                </div>
              )}
            </div>

            {store.recommendation && (
              <div className="diff-summary">
                <div className="diff-item">
                  <span>差额:</span>
                  <span className={manualResult.totalMargin >= store.recommendation.total_margin ? 'status-optimal' : 'status-error'}>
                    {manualResult.totalMargin >= store.recommendation.total_margin ? '+' : ''}
                    {formatCurrency(manualResult.totalMargin - store.recommendation.total_margin)}
                  </span>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
