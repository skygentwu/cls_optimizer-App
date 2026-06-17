import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag } from 'antd-mobile';
import { useAppStore } from '@/stores/appStore';
import { runBacktestAnalysis } from '@/api/client';
import { PRODUCT_LABELS } from '@/constants';
import { formatCurrency, formatTons } from '@/utils/format';
import { toNum, pick } from '@/utils/record';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ErrorRetry } from '@/components/common/ErrorRetry';
import { useAbortableAsync } from '@/hooks/useAbortableAsync';
import './compare.css';

interface HistoryRow { date: string; manual: number; system: number; diff: number }

const MAX_EXPECTED_MARGIN = 220000;

export default function ComparePage() {
  const navigate = useNavigate();
  const rec = useAppStore((s) => s.recommendation);
  const manual = useAppStore((s) => s.manualResult);

  const [history, setHistory] = useState<HistoryRow[]>([]);

  const { loading, error, run } = useAbortableAsync(async (signal) => {
    const res = await runBacktestAnalysis();
    // 被新请求取代则丢弃结果，避免旧响应覆盖新数据
    if (signal.aborted) return;
    const rows: HistoryRow[] = ((res.detail_records ?? []) as Array<Record<string, unknown>>)
      .map((r) => {
        const system = toNum(pick(r, '系统边际贡献', 'system'));
        const manualVal = toNum(pick(r, '人工边际贡献', 'manual'));
        return { date: String(pick(r, '日期', 'date') ?? ''), system, manual: manualVal, diff: system - manualVal };
      })
      .filter((r) => r.date)
      .sort((a, b) => a.date.localeCompare(b.date));
    setHistory(rows);
  }, []);

  if (loading) {
    return (
      <div className="compare-page">
        <NavBar onBack={() => navigate(-1)}>决策对比分析</NavBar>
        <SkeletonCard rows={3} />
        <SkeletonCard rows={3} />
        <SkeletonCard rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="compare-page">
        <NavBar onBack={() => navigate(-1)}>决策对比分析</NavBar>
        <ErrorRetry onRetry={run} />
      </div>
    );
  }

  const hasHistory = history.length > 0;
  const recentHistory = history.slice(-14);
  const totalDiff = hasHistory ? history.reduce((sum, d) => sum + d.diff, 0) : null;
  const avgDiff = hasHistory && totalDiff !== null ? totalDiff / history.length : null;
  const maxDiffDay = hasHistory ? history.reduce((max, d) => (d.diff > max.diff ? d : max), history[0]) : null;

  return (
    <div className="compare-page">
      <NavBar onBack={() => navigate(-1)}>决策对比分析</NavBar>

      <div className="page-content">
        {hasHistory && totalDiff !== null && avgDiff !== null && (
          <>
            <Card className="hero-card" style={{ margin: '12px' }}>
              <div className="hero-label">近 {history.length} 天累计收益差异</div>
              <div className="hero-diff">
                <span className={totalDiff >= 0 ? 'diff-positive' : 'diff-negative'}>
                  {totalDiff >= 0 ? '+' : ''}{formatCurrency(totalDiff)}
                </span>
              </div>
              <div className="hero-sub">
                若全程按系统推荐执行，可{totalDiff >= 0 ? '多' : '少'}收益 {formatCurrency(Math.abs(totalDiff))}
              </div>
            </Card>

            <div style={{ margin: '0 12px', display: 'flex', gap: 12 }}>
              <Card style={{ flex: 1, textAlign: 'center' }}>
                <div className="metric-label">日均差异</div>
                <div className="metric-value" style={{ color: '#1677ff' }}>
                  {avgDiff >= 0 ? '+' : ''}{formatCurrency(avgDiff)}
                </div>
              </Card>
              <Card style={{ flex: 1, textAlign: 'center' }}>
                <div className="metric-label">最大单日差异</div>
                <div className="metric-value" style={{ color: '#52c41a' }}>
                  {maxDiffDay && maxDiffDay.diff >= 0 ? '+' : ''}{formatCurrency(maxDiffDay?.diff ?? 0)}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>{maxDiffDay?.date ?? '-'}</div>
              </Card>
            </div>
          </>
        )}

        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>今日产量对比</span>
          </div>
          {rec?.products && manual ? (
            <div className="compare-table">
              <div className="compare-header">
                <span>产品</span>
                <span>人工方案</span>
                <span>系统推荐</span>
                <span>差额</span>
              </div>
              {Object.entries(rec.products).map(([key, sysVal]) => {
                const row = manual.compareRows?.find(
                  (r: Record<string, unknown>) => r['product_key'] === key
                );
                const manVal = (row?.['manual_qty'] as number) ?? 0;
                const diff = (sysVal as number) - manVal;
                return (
                  <div key={key} className="compare-row">
                    <span>{PRODUCT_LABELS[key as keyof typeof PRODUCT_LABELS]}</span>
                    <span>{formatTons(manVal)}</span>
                    <span style={{ color: '#1677ff', fontWeight: 600 }}>{formatTons(sysVal)}</span>
                    <span className={diff >= 0 ? 'diff-positive' : 'diff-negative'}>
                      {diff >= 0 ? '+' : ''}{formatTons(diff)}
                    </span>
                  </div>
                );
              })}
              <div className="compare-row total">
                <span>边际贡献</span>
                <span>{formatCurrency(manual.totalMargin)}</span>
                <span style={{ color: '#1677ff', fontWeight: 600 }}>{formatCurrency(rec.total_margin)}</span>
                <span className={rec.total_margin >= manual.totalMargin ? 'diff-positive' : 'diff-negative'}>
                  {rec.total_margin >= manual.totalMargin ? '+' : ''}{formatCurrency(rec.total_margin - manual.totalMargin)}
                </span>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ textAlign: 'center', padding: '24px 0', color: '#999', fontSize: 14 }}>
              请先在概览页加载推荐数据
            </div>
          )}
        </Card>

        {hasHistory && (
          <Card style={{ margin: '12px' }}>
            <div className="card-title">
              <span>历史对比（近 {recentHistory.length} 天）</span>
            </div>
            <div className="history-list">
              {recentHistory.map((day) => (
                <div key={day.date} className="history-item">
                  <div className="history-date">{day.date}</div>
                  <div className="history-bars">
                    <div className="history-bar manual" style={{ width: `${Math.min((day.manual / MAX_EXPECTED_MARGIN) * 100, 100)}%` }} />
                    <div className="history-bar system" style={{ width: `${Math.min((day.system / MAX_EXPECTED_MARGIN) * 100, 100)}%` }} />
                  </div>
                  <div className="history-values">
                    <span className="history-manual">{formatCurrency(day.manual)}</span>
                    <span className="history-system">{formatCurrency(day.system)}</span>
                    <Tag color={day.diff >= 0 ? 'success' : 'danger'}>
                      {day.diff >= 0 ? '+' : ''}{formatCurrency(day.diff)}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
