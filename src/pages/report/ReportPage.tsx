import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag, Toast, Button } from 'antd-mobile';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { ErrorRetry } from '@/components/common/ErrorRetry';

import './report.css';

// 模拟历史报告
const MOCK_REPORTS = [
  { id: 1, date: '2026-06-02', title: '6月2日经营分析报告', type: '日报', status: '已采纳' },
  { id: 2, date: '2026-06-01', title: '6月1日经营分析报告', type: '日报', status: '已采纳' },
  { id: 3, date: '2026-05-31', title: '5月第4周经营周报', type: '周报', status: '已采纳' },
  { id: 4, date: '2026-05-24', title: '5月第3周经营周报', type: '周报', status: '待复核' },
];

const SAMPLE_REPORT = `## 经营决策分析报告

### 一、当前经营状况

截至 2026年6月2日，系统基于最新价格数据生成以下推荐方案：

| 产品 | 推荐产量 | 当前价格 | 单位毛利 |
|------|---------|---------|---------|
| 液氯 | 50 吨/天 | 235 元/吨 | 115 元/吨 |
| 31%盐酸 | 85 吨/天 | 167 元/吨 | 82 元/吨 |
| 10%次氯酸钠 | 33 吨/天 | 398 元/吨 | 178 元/吨 |

### 二、关键发现

1. **液氯价格持续上涨**：近7天液氯价格上涨 4.4%，预计短期仍将维持上行趋势
2. **盐酸边际贡献最优**：当前盐酸单位毛利最高，建议保持较高产量配比
3. **氯气平衡良好**：推荐方案氯气利用率 98.5%，无需额外调整

### 三、风险提示

- 次氯酸钠下游需求存在波动风险
- 若液氯价格突破 250 元/吨，建议重新评估产量配比
- 关注原材料成本变化对边际贡献的影响

### 四、决策建议

建议采纳系统推荐方案，预计日边际贡献可达 **¥200,800**，较人工方案提升 **¥12,100**。
`;

export default function ReportPage() {
  const navigate = useNavigate();
  const [report, setReport] = useState('');
  const [generating, setGenerating] = useState(false);
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
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      // 模拟API调用延迟
      await new Promise(r => setTimeout(r, 1500));
      setReport(SAMPLE_REPORT);
      Toast.show({ icon: 'success', content: '报告生成成功' });
    } catch {
      Toast.show({ icon: 'fail', content: '生成失败' });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="report-page">
        <NavBar onBack={() => navigate(-1)}>经营报告</NavBar>
        <SkeletonCard rows={3} />
        <SkeletonCard rows={3} />
        <SkeletonCard rows={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-page">
        <NavBar onBack={() => navigate(-1)}>经营报告</NavBar>
        <ErrorRetry onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="report-page">
      <NavBar onBack={() => navigate(-1)}>经营报告</NavBar>

      <div className="page-content">
        {/* 生成报告按钮 */}
        <Card style={{ margin: '12px' }}>
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>AI 经营分析报告</div>
            <div style={{ fontSize: 13, color: '#999', marginBottom: 16 }}>
              基于最新价格数据与约束条件自动生成
            </div>
            <Button
              color="primary"
              size="large"
              block
              loading={generating}
              onClick={generateReport}
              style={{ borderRadius: 24 }}
            >
              {report ? '重新生成报告' : '生成今日报告'}
            </Button>
          </div>
        </Card>

        {/* 报告内容 */}
        {report && (
          <Card style={{ margin: '12px' }}>
            <div className="card-title">
              <span>📄</span>
              <span>报告内容</span>
              <Tag color="success">已生成</Tag>
            </div>
            <div className="report-content">
              {report.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="report-h2">{line.replace('## ', '')}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="report-h3">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('|')) {
                  return null; // 简化表格渲染
                }
                if (line.match(/^\d+\./)) {
                  return <li key={i} className="report-li">{line.replace(/^\d+\.\s*/, '')}</li>;
                }
                if (line.trim() === '') {
                  return null;
                }
                if (line.startsWith('建议')) {
                  return <div key={i} className="report-highlight">{line}</div>;
                }
                return <p key={i} className="report-p">{line}</p>;
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <Button block fill="outline" onClick={() => { Toast.show({ icon: 'fail', content: 'Word 导出功能开发中' }); }}>
                下载 Word
              </Button>
              <Button
                block
                fill="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(report);
                    Toast.show({ icon: 'success', content: '已复制到剪贴板' });
                  } catch {
                    Toast.show({ icon: 'fail', content: '复制失败' });
                  }
                }}
              >
                复制内容
              </Button>
            </div>
          </Card>
        )}

        {/* 历史报告 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
            <span>📜</span>
            <span>历史报告</span>
          </div>
          <div className="report-list">
            {MOCK_REPORTS.map((item) => (
              <div key={item.id} className="report-item">
                <div className="report-header">
                  <span className="report-title">{item.title}</span>
                  <Tag color={item.status === '已采纳' ? 'success' : 'warning'}>{item.status}</Tag>
                </div>
                <div className="report-meta">
                  <span>{item.date}</span>
                  <span>{item.type}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
