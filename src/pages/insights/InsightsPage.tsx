import { useState, useEffect } from 'react';
import { NavBar, Card, Tag, Toast, Button, Badge } from 'antd-mobile';
import { useAppStore } from '@/stores/appStore';
import { formatCurrency } from '@/utils/format';
import './insights.css';

// 模拟预警数据
const ALERTS = [
  { id: 1, level: 'warning', title: '液氯价格异常波动', desc: '近3日液氯价格上涨 4.4%，建议关注', time: '今天 09:30' },
  { id: 2, level: 'success', title: '系统推荐收益提升', desc: '今日按系统推荐可多收益 ¥12,100', time: '今天 08:00' },
  { id: 3, level: 'info', title: '预测分析已更新', desc: '未来7天价格预测已生成', time: '昨天 18:00' },
];

// 模拟历史建议
const HISTORY_ADVICE = [
  { date: '2026-06-01', summary: '建议增加盐酸产量至 85 吨/天，液氯减产 5 吨/天', diff: 12100 },
  { date: '2026-05-31', summary: '液氯价格上涨趋势明显，建议维持当前产量配比', diff: 8800 },
  { date: '2026-05-30', summary: '次氯酸钠需求下降，建议适当减产', diff: 6500 },
];

export default function InsightsPage() {
  const store = useAppStore();
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    const rec = store.recommendation;
    if (!rec) {
      Toast.show({ icon: 'fail', content: '请先在概览页获取推荐数据' });
      return;
    }
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (store.recommendation && !report) {
      loadReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.recommendation]);

  return (
    <div className="insights-page">
      <NavBar back={null}>智能建议</NavBar>

      <div className="page-content">
        {/* 预警通知 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>🔔</span>
            <span>预警通知</span>
            <Badge content={ALERTS.length} style={{ '--right': '-6px', '--top': '0px' }} />
          </div>
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
              <Button color="primary" loading={loading} onClick={loadReport}>
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
        </Card>
      </div>
    </div>
  );
}
