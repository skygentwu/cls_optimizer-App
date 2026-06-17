import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Selector } from 'antd-mobile';
import { runFinanceMarginAnalysis } from '@/api/client';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ErrorRetry } from '@/components/common/ErrorRetry';
import { PRODUCT_LABELS } from '@/constants';
import { formatCurrency, formatTons } from '@/utils/format';
import { toNum, pick, CN_PRODUCT } from '@/utils/record';
import { useAbortableAsync } from '@/hooks/useAbortableAsync';
import './margin.css';

type ProductKey = 'liquid_chlorine' | 'hcl31' | 'naclo10';
const PRODUCTS: ProductKey[] = ['liquid_chlorine', 'hcl31', 'naclo10'];

interface ProductRow { manQty: number; manMargin: number; sysQty: number; sysMargin: number; price: number }

export default function MarginPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState('');
  const [monthOptions, setMonthOptions] = useState<string[]>([]);

  const [manualTotal, setManualTotal] = useState(0);
  const [systemTotal, setSystemTotal] = useState(0);
  const [diff, setDiff] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [rows, setRows] = useState<Record<ProductKey, ProductRow>>({
    liquid_chlorine: { manQty: 0, manMargin: 0, sysQty: 0, sysMargin: 0, price: 0 },
    hcl31: { manQty: 0, manMargin: 0, sysQty: 0, sysMargin: 0, price: 0 },
    naclo10: { manQty: 0, manMargin: 0, sysQty: 0, sysMargin: 0, price: 0 },
  });

  // 依赖 month：切换月份时重新请求并自动取消上一次请求，避免竞态覆盖
  const { loading, error, run } = useAbortableAsync(async (signal) => {
    const res = await runFinanceMarginAnalysis(month || undefined);
    if (signal.aborted) return;
    if (res.months?.length) setMonthOptions(res.months);
    setSelectedMonth(res.selected_month || month);

    const summary = res.summary ?? {};
    setManualTotal(toNum(summary.manual_total));
    setSystemTotal(toNum(summary.system_total));
    setDiff(toNum(summary.diff));

    const records = res.compare_records ?? [];
    // 函数式更新：避免闭包捕获旧 rows，彻底消除原先 eslint-disable 掩盖的隐患
    setRows((prev) => {
      const next = { ...prev };
      for (const key of PRODUCTS) {
        const row = records.find((r) => String(pick(r, '产品', 'product')) === CN_PRODUCT[key]);
        next[key] = row
          ? {
              manQty: toNum(pick(row, '产量_人工')),
              manMargin: toNum(pick(row, '毛利_人工')),
              sysQty: toNum(pick(row, '产量_系统')),
              sysMargin: toNum(pick(row, '毛利_系统')),
              price: toNum(pick(row, '财务单价')),
            }
          : { manQty: 0, manMargin: 0, sysQty: 0, sysMargin: 0, price: 0 };
      }
      return next;
    });
  }, [month]);

  if (loading) {
    return (
      <div className="margin-page">
        <NavBar onBack={() => navigate(-1)}>财务分析</NavBar>
        <div className="page-content">
          <SkeletonCard rows={3} />
          <SkeletonCard rows={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="margin-page">
        <NavBar onBack={() => navigate(-1)}>财务分析</NavBar>
        <div className="page-content">
          <ErrorRetry onRetry={run} />
        </div>
      </div>
    );
  }

  const hasData = systemTotal !== 0 || manualTotal !== 0;
  const selectorOptions = (monthOptions.length ? monthOptions : [selectedMonth].filter(Boolean)).map((m) => ({ label: m, value: m }));

  return (
    <div className="margin-page">
      <NavBar onBack={() => navigate(-1)}>财务分析</NavBar>

      <div className="page-content">
        {selectorOptions.length > 0 && (
          <div style={{ margin: '12px' }}>
            <Selector
              options={selectorOptions}
              value={[selectedMonth]}
              onChange={(v) => v[0] && setMonth(v[0])}
              showCheckMark={false}
            />
          </div>
        )}

        {!hasData ? (
          <div style={{ textAlign: 'center', padding: '40px 12px', color: '#999', fontSize: 14 }}>
            暂无财务分析数据。请确认 PC 端已维护当月销量与价格数据。
          </div>
        ) : (
          <>
            <Card className="hero-card" style={{ margin: '12px' }}>
              <div className="hero-label">{selectedMonth} 累计收益差异</div>
              <div className="hero-diff">
                <span className={diff >= 0 ? 'diff-positive' : 'diff-negative'}>
                  {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                </span>
              </div>
              <div className="hero-sub">
                系统推荐方案较人工方案{diff >= 0 ? '多' : '少'}收益 {formatCurrency(Math.abs(diff))}
              </div>
            </Card>

            <div style={{ margin: '0 12px', display: 'flex', gap: 12 }}>
              <Card style={{ flex: 1, textAlign: 'center' }}>
                <div className="metric-label">人工方案</div>
                <div className="metric-value" style={{ color: '#999' }}>{formatCurrency(manualTotal)}</div>
              </Card>
              <Card style={{ flex: 1, textAlign: 'center' }}>
                <div className="metric-label">系统推荐</div>
                <div className="metric-value" style={{ color: '#1677ff' }}>{formatCurrency(systemTotal)}</div>
              </Card>
            </div>

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
                {PRODUCTS.map((key) => {
                  const r = rows[key];
                  return (
                    <div key={key}>
                      <div className="margin-row product-name-row">
                        <span style={{ gridColumn: '1 / -1' }}>{PRODUCT_LABELS[key]}</span>
                      </div>
                      <div className="margin-row">
                        <span></span>
                        <span className="text-gray">人工</span>
                        <span>{formatTons(r.manQty)}</span>
                        <span>{r.price}元</span>
                        <span className="text-gray">{formatCurrency(r.manMargin)}</span>
                      </div>
                      <div className="margin-row">
                        <span></span>
                        <span className="text-blue">系统</span>
                        <span>{formatTons(r.sysQty)}</span>
                        <span>{r.price}元</span>
                        <span className="text-blue">{formatCurrency(r.sysMargin)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card style={{ margin: '12px' }}>
              <div className="card-title">
                <span>📊</span>
                <span>差异分析</span>
              </div>
              <div className="diff-analysis">
                {PRODUCTS.map((key) => {
                  const r = rows[key];
                  const d = r.sysMargin - r.manMargin;
                  return (
                    <div key={key} className="diff-row">
                      <span>{PRODUCT_LABELS[key]}</span>
                      <div className="diff-bar-bg">
                        <div className="diff-bar-fill" style={{ width: `${Math.min(Math.abs(d) / 50000 * 100, 100)}%` }} />
                      </div>
                      <span className="diff-value">{d >= 0 ? '+' : ''}{formatCurrency(d)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
