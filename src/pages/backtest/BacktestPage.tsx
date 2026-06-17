import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag, Selector } from 'antd-mobile';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartBox } from '@/components/common/ChartBox';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ErrorRetry } from '@/components/common/ErrorRetry';
import { runBacktestAnalysis } from '@/api/client';
import { formatCurrency } from '@/utils/format';
import { toNum, pick } from '@/utils/record';
import { useAbortableAsync } from '@/hooks/useAbortableAsync';
import './backtest.css';

/**
 * 回测明细行统一结构（前端展示用）。
 * 后端 detail_records 返回的是中文列名（系统边际贡献/人工边际贡献/效益差异 等），
 * 这里通过 mapDetailToRow 转换为统一英文键，避免类型断言掩盖字段不匹配。
 */
interface BacktestRow {
  date: string;
  manual: number;
  system: number;
  diff: number;
  products: { liquid_chlorine: number; hcl31: number; naclo10: number };
}

/** 后端中文键 → 前端 BacktestRow；兼容未来可能的英文键。 */
function mapDetailToRow(r: Record<string, unknown>): BacktestRow {
  return {
    date: String(pick(r, '日期', 'date') ?? ''),
    manual: toNum(pick(r, '人工边际贡献', 'manual_margin', 'manual')),
    system: toNum(pick(r, '系统边际贡献', 'system_margin', 'system')),
    diff: toNum(pick(r, '效益差异', 'diff')),
    products: {
      liquid_chlorine: toNum(pick(r, '系统液氯', 'liquid_chlorine')),
      hcl31: toNum(pick(r, '系统盐酸', 'hcl31')),
      naclo10: toNum(pick(r, '系统次氯', 'naclo10')),
    },
  };
}

export default function BacktestPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<'7' | '14' | '30'>('14');
  const [data, setData] = useState<BacktestRow[]>([]);

  const filtered = data.slice(0, Number(range));
  const totalDiff = filtered.reduce((s, d) => s + d.diff, 0);
  // 防御除零：数据为空时累计/平均/胜率回退为 0，避免 NaN
  const avgDiff = filtered.length ? totalDiff / filtered.length : 0;
  const bestDay = filtered.length
    ? filtered.reduce((max, d) => d.diff > max.diff ? d : max, filtered[0])
    : null;
  const winRate = filtered.length
    ? (filtered.filter(d => d.system > d.manual).length / filtered.length * 100).toFixed(0)
    : '0';

  const { loading, error, run } = useAbortableAsync(async (signal) => {
    const analysis = await runBacktestAnalysis();
    // 被新请求取代则丢弃，避免旧响应覆盖
    if (signal.aborted) return;
    // 后端 detail_records 为中文键，用 mapDetailToRow 安全转换
    const records: BacktestRow[] = (analysis.detail_records || []).map(mapDetailToRow).filter((r) => r.date);
    setData(records);
  }, []);

  if (loading) {
    return (
      <div className="backtest-page">
        <NavBar onBack={() => navigate(-1)}>历史回测</NavBar>
        <div className="page-content">
          <SkeletonCard rows={3} />
          <SkeletonCard rows={4} />
          <SkeletonCard rows={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backtest-page">
        <NavBar onBack={() => navigate(-1)}>历史回测</NavBar>
        <div className="page-content">
          <ErrorRetry onRetry={run} />
        </div>
      </div>
    );
  }

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
            <div className="metric-value" style={{ color: '#52c41a' }}>+{formatCurrency(bestDay?.diff ?? 0)}</div>
            <div style={{ fontSize: 11, color: '#999' }}>{bestDay?.date ?? '-'}</div>
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

        {/* 收益趋势对比 - LineChart */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📈</span>
            <span>收益趋势对比</span>
          </div>
          <ChartBox height={200}>
            <LineChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
              <Legend />
              <Line type="monotone" dataKey="manual" name="人工" stroke="#d9d9d9" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="system" name="系统" stroke="#1677ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartBox>
        </Card>

        {/* 日收益差异 - BarChart */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📊</span>
            <span>日收益差异</span>
          </div>
          <ChartBox height={200}>
            <BarChart data={filtered}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
              <Bar dataKey="diff" name="差异" fill="#52c41a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartBox>
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
