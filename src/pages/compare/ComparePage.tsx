import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag } from 'antd-mobile';
import { useAppStore } from '@/stores/appStore';
import { PRODUCT_LABELS } from '@/constants';
import { formatCurrency, formatTons } from '@/utils/format';
import './compare.css';

// 模拟历史对比数据（实际应从后端获取）
const MOCK_HISTORY = [
  { date: '2026-05-28', manual: 185200, system: 198500, diff: 13300 },
  { date: '2026-05-29', manual: 182100, system: 201200, diff: 19100 },
  { date: '2026-05-30', manual: 188000, system: 196800, diff: 8800 },
  { date: '2026-05-31', manual: 190500, system: 203100, diff: 12600 },
  { date: '2026-06-01', manual: 187300, system: 199400, diff: 12100 },
];

export default function ComparePage() {
  const navigate = useNavigate();
  const store = useAppStore();
  const rec = store.recommendation;
  const manual = store.manualResult;

  const totalDiff = MOCK_HISTORY.reduce((sum, d) => sum + d.diff, 0);
  const avgDiff = totalDiff / MOCK_HISTORY.length;
  const maxDiffDay = MOCK_HISTORY.reduce((max, d) => d.diff > max.diff ? d : max, MOCK_HISTORY[0]);

  return (
    <div className="compare-page">
      <NavBar onBack={() => navigate(-1)}>决策对比分析</NavBar>

      <div className="page-content">
        {/* 累计收益差异 */}
        <Card className="hero-card" style={{ margin: '12px' }}>
          <div className="hero-label">近 {MOCK_HISTORY.length} 天累计收益差异</div>
          <div className="hero-diff">
            <span className="diff-positive">+{formatCurrency(totalDiff)}</span>
          </div>
          <div className="hero-sub">
            若全程按系统推荐执行，可多收益 {formatCurrency(totalDiff)}
          </div>
        </Card>

        {/* 关键指标 */}
        <div style={{ margin: '0 12px', display: 'flex', gap: 12 }}>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div className="metric-label">日均差异</div>
            <div className="metric-value" style={{ color: '#1677ff' }}>+{formatCurrency(avgDiff)}</div>
          </Card>
          <Card style={{ flex: 1, textAlign: 'center' }}>
            <div className="metric-label">最大单日差异</div>
            <div className="metric-value" style={{ color: '#52c41a' }}>+{formatCurrency(maxDiffDay.diff)}</div>
            <div style={{ fontSize: 11, color: '#999' }}>{maxDiffDay.date}</div>
          </Card>
        </div>

        {/* 今日对比 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📅</span>
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
                const manVal = manual.compareRows?.find((r: any) => r.product_key === key)?.manual_qty ?? 0;
                const diff = (sysVal as number) - (manVal as number);
                return (
                  <div key={key} className="compare-row">
                    <span>{PRODUCT_LABELS[key as keyof typeof PRODUCT_LABELS]}</span>
                    <span>{formatTons(manVal as number)}</span>
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
            <div className="empty-state">加载中...</div>
          )}
        </Card>

        {/* 历史对比 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📈</span>
            <span>历史对比 ({MOCK_HISTORY.length}天)</span>
          </div>
          <div className="history-list">
            {MOCK_HISTORY.map((day) => (
              <div key={day.date} className="history-item">
                <div className="history-date">{day.date}</div>
                <div className="history-bars">
                  <div className="history-bar manual" style={{ width: `${(day.manual / 220000) * 100}%` }} />
                  <div className="history-bar system" style={{ width: `${(day.system / 220000) * 100}%` }} />
                </div>
                <div className="history-values">
                  <span className="history-manual">{formatCurrency(day.manual)}</span>
                  <span className="history-system">{formatCurrency(day.system)}</span>
                  <Tag color="success">+{formatCurrency(day.diff)}</Tag>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
