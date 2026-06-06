import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag, Toast, Button, Badge } from 'antd-mobile';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/utils/format';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ErrorRetry } from '@/components/common/ErrorRetry';
import './insights.css';

// FIXME: 初版暂无预警和历史建议接口，待后端提供后替换为真实数据
const ALERTS: Array<{ id: number; level: string; title: string; desc: string; time: string }> = [];
const HISTORY_ADVICE: Array<{ date: string; summary: string; diff: number }> = [];

export default function InsightsPage() {
  const navigate = useNavigate();
  const store = useAppStore();
  const [report, setReport] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  };

  const loadReport = async () => {
    const rec = store.recommendation;
    if (!rec) {
      Toast.show({ icon: 'fail', content: '请先在概览页获取推荐数据' });
      return;
    }
    setReportLoading(true);
    try {
      // 使用模拟数据（实际应调用 generateAdvisorReport API）
      setReport(`## 今日经营建议

### 核心结论
根据当前价格数据和约束条件，系统推荐以下产量配比：

- **液氯**: ${rec.products?.liquid_chlorine ?? 0} 吨/天
- **31%盐酸**: ${rec.products?.hcl31 ?? 0} 吨/天  
- **10%次氯酸钠**: ${rec.products?.naclo10 ?? 0} 吨/天

### 关键洞察
1. 当前液氯价格处于上涨趋势，建议维持推荐产量
2. 盐酸边际贡献最优，可适当增加配比
3. 氯气平衡状态良好，无需额外调整

### 风险提示
- 次氯酸钠需求有波动风险，建议密切关注市场动态
- 若液氯价格继续上升超过 250 元/吨，建议重新评估配比`);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    if (store.recommendation && !report) {
      loadReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.recommendation]);

  if (loading) {
    return (
      <div className="insights-page">
        <NavBar onBack={() => navigate(-1)}>智能建议</NavBar>
        <SkeletonCard rows={3} />
        <SkeletonCard rows={3} />
        <SkeletonCard rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-page">
        <NavBar onBack={() => navigate(-1)}>智能建议</NavBar>
        <ErrorRetry onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="insights-page">
      <NavBar onBack={() => navigate(-1)}>智能建议</NavBar>

      <div className="page-content">
        {/* 预警通知 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>🔔</span>
            <span>预警通知</span>
            {ALERTS.length > 0 && <Badge content={ALERTS.length} style={{ '--right': '-6px', '--top': '0px' }} />}
          </div>
          {ALERTS.length > 0 ? (
            <div className="alert-list">
              {ALERTS.map((alert) => (
                <div key={alert.id} className={`alert-item alert-${alert.level}`}>
                  <div className="alert-header">
                    <span className="alert-title">{alert.title}</span>
                    <span className="alert-time">{alert.time}</span>
                  </div>
                  <div className="alert-desc">{alert.desc}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#999', fontSize: 14 }}>
              暂无预警通知
            </div>
          )}
        </Card>

        {/* 今日经营建议 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>🤖</span>
            <span>AI 经营建议</span>
            <Tag color="primary">实时</Tag>
          </div>
          {report ? (
            <div className="report-content">
              {report.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h3 key={i} className="report-h3">{line.replace('## ', '')}</h3>;
                }
                if (line.startsWith('### ')) {
                  return <h4 key={i} className="report-h4">{line.replace('### ', '')}</h4>;
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="report-li">{line.replace('- ', '')}</li>;
                }
                if (line.match(/^\d+\./)) {
                  return <li key={i} className="report-li">{line.replace(/^\d+\.\s*/, '')}</li>;
                }
                if (line.trim()) {
                  return <p key={i} className="report-p">{line}</p>;
                }
                return null;
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Button color="primary" loading={reportLoading} onClick={loadReport}>
                生成今日建议
              </Button>
            </div>
          )}
        </Card>

        {/* 历史建议 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📜</span>
            <span>历史建议记录</span>
          </div>
          {HISTORY_ADVICE.length > 0 ? (
            <div className="history-list">
              {HISTORY_ADVICE.map((item, i) => (
                <div key={i} className="history-item">
                  <div className="history-header">
                    <span className="history-date">{item.date}</span>
                    <Tag color="success">+{formatCurrency(item.diff)}</Tag>
                  </div>
                  <div className="history-summary">{item.summary}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#999', fontSize: 14 }}>
              暂无历史建议记录
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
