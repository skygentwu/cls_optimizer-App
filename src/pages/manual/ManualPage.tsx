import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Button, Card, Tag, Toast, Stepper, ProgressBar } from 'antd-mobile';
import { useAppStore } from '@/stores/appStore';
import { evaluateManualPlan } from '@/api/client';
import { PRODUCT_LABELS } from '@/constants';
import { formatCurrency, formatTons } from '@/utils/format';
import './manual.css';

export default function ManualPage() {
  const navigate = useNavigate();
  const recommendation = useAppStore((s) => s.recommendation);
  const prices = useAppStore((s) => s.prices);
  const naohDaily = useAppStore((s) => s.naohDaily);
  const manualProducts = useAppStore((s) => s.manualProducts);
  const manualResult = useAppStore((s) => s.manualResult);
  const setManualProducts = useAppStore((s) => s.setManualProducts);
  const setManualResult = useAppStore((s) => s.setManualResult);

  const [loading, setLoading] = useState(false);
  const [localProducts, setLocalProducts] = useState({ ...manualProducts });

  const handleSyncFromRecommendation = () => {
    if (recommendation?.products) {
      setLocalProducts({ ...recommendation.products });
      setManualProducts({ ...recommendation.products });
      Toast.show({ icon: 'success', content: '已同步推荐方案' });
    } else {
      Toast.show({ icon: 'fail', content: '暂无推荐方案，请先计算' });
    }
  };

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      setManualProducts(localProducts);

      const res = await evaluateManualPlan(
        naohDaily,
        prices,
        localProducts,
        recommendation?.products ?? null,
        recommendation?.total_margin ?? null
      );

      setManualResult({
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
  const cl2BalancePercent = manualResult
    ? Math.max(0, Math.min(100, 100 - Math.abs(manualResult.cl2Diff) * 2))
    : 0;

  return (
    <div className="manual-page">
      <NavBar onBack={() => navigate(-1)}>手动模拟</NavBar>

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
              {recommendation && (
                <div className="margin-item">
                  <div className="margin-label">系统推荐边际贡献</div>
                  <div className="margin-value recommended">{formatCurrency(recommendation.total_margin)}</div>
                </div>
              )}
            </div>

            {recommendation && (
              <div className="diff-summary">
                <div className="diff-item">
                  <span>差额:</span>
                  <span className={manualResult.totalMargin >= recommendation.total_margin ? 'status-optimal' : 'status-error'}>
                    {manualResult.totalMargin >= recommendation.total_margin ? '+' : ''}
                    {formatCurrency(manualResult.totalMargin - recommendation.total_margin)}
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
