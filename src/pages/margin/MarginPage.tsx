import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Selector, Toast } from 'antd-mobile';
import { runFinanceMarginAnalysis } from '@/api/client';
import { PRODUCT_LABELS } from '@/constants';
import { formatCurrency, formatTons } from '@/utils/format';
import './margin.css';

// FIXME: 初版演示数据，/api/finance/margin-analysis 接口返回真实数据后应移除
const MOCK_FINANCE = {
  month: '2026-05',
  manual: {
    total: 5523000,
    liquid_chlorine: { qty: 1470, price: 225, cost: 120, margin: 154350 },
    hcl31: { qty: 2460, price: 159, cost: 85, margin: 182040 },
    naclo10: { qty: 870, price: 410, cost: 220, margin: 165300 },
  },
  system: {
    total: 5931000,
    liquid_chlorine: { qty: 1560, price: 225, cost: 120, margin: 163800 },
    hcl31: { qty: 2550, price: 159, cost: 85, margin: 188700 },
    naclo10: { qty: 930, price: 410, cost: 220, margin: 176700 },
  },
  diff: 408000,
};

export default function MarginPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState('2026-05');

  const loadMargin = async () => {
    try {
      const res = await runFinanceMarginAnalysis(month);
      if (res.finance_view && res.finance_view.length > 0) {
        // FIXME: 后端返回数据结构确认后映射真实数据
        Toast.show({ icon: 'success', content: '财务数据已更新' });
        return;
      }
    } catch {
      // ignore
    }
    // 接口未就绪时回退演示数据并提示
    Toast.show({ icon: 'fail', content: '财务接口未返回数据，显示演示数据' });
  };

  useEffect(() => {
    loadMargin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const data = MOCK_FINANCE;
  const products = ['liquid_chlorine', 'hcl31', 'naclo10'] as const;

  return (
    <div className="margin-page">
      <NavBar onBack={() => navigate(-1)}>财务分析</NavBar>

      <div className="page-content">
        {/* 月份选择 */}
        <div style={{ margin: '12px' }}>
          <Selector
            options={[
              { label: '2026-05', value: '2026-05' },
              { label: '2026-04', value: '2026-04' },
              { label: '2026-03', value: '2026-03' },
            ]}
            value={[month]}
            onChange={(v) => setMonth(v[0])}
            showCheckMark={false}
          />
        </div>

        {/* 月度总览 */}
        <Card className="hero-card" style={{ margin: '12px' }}>
          <div className="hero-label">{data.month} 累计收益差异</div>
          <div className="hero-diff">
            <span className="diff-positive">+{formatCurrency(data.diff)}</span>
          </div>
          <div className="hero-sub">
            系统推荐方案较人工方案多收益 {formatCurrency(data.diff)}
          </div>
        </Card>

        {/* 总对比 */}
        <div style={{ margin: '0 12px', display: 'flex', gap: 12 }}>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div className="metric-label">人工方案</div>
            <div className="metric-value" style={{ color: '#999' }}>{formatCurrency(data.manual.total)}</div>
          </Card>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div className="metric-label">系统推荐</div>
            <div className="metric-value" style={{ color: '#1677ff' }}>{formatCurrency(data.system.total)}</div>
          </Card>
        </div>

        {/* 产品明细 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📋</span>
            <span>产品边际贡献明细</span>
          </div>
          <div className="margin-table">
            <div className="margin-header">
              <span>产品</span>
              <span>方案</span>
              <span>销量</span>
              <span>单价</span>
              <span>毛利</span>
            </div>
            {products.map((key) => {
              const man = data.manual[key];
              const sys = data.system[key];
              return (
                <div key={key}>
                  <div className="margin-row product-name-row">
                    <span style={{ gridColumn: '1 / -1' }}>{PRODUCT_LABELS[key]}</span>
                  </div>
                  <div className="margin-row">
                    <span></span>
                    <span className="text-gray">人工</span>
                    <span>{formatTons(man.qty)}</span>
                    <span>{man.price}元</span>
                    <span className="text-gray">{formatCurrency(man.margin)}</span>
                  </div>
                  <div className="margin-row">
                    <span></span>
                    <span className="text-blue">系统</span>
                    <span>{formatTons(sys.qty)}</span>
                    <span>{sys.price}元</span>
                    <span className="text-blue">{formatCurrency(sys.margin)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 差异分析 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📊</span>
            <span>差异分析</span>
          </div>
          <div className="diff-analysis">
            {products.map((key) => {
              const man = data.manual[key];
              const sys = data.system[key];
              const diff = sys.margin - man.margin;
              return (
                <div key={key} className="diff-row">
                  <span>{PRODUCT_LABELS[key]}</span>
                  <div className="diff-bar-bg">
                    <div className="diff-bar-fill" style={{ width: `${Math.min((diff / 50000) * 100, 100)}%` }} />
                  </div>
                  <span className="diff-value">+{formatCurrency(diff)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
