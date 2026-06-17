import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag, Toast, Button } from 'antd-mobile';
import { useAppStore } from '@/stores/appStore';
import { generateAdvisorReport } from '@/api/client';
import './report.css';

export default function ReportPage() {
  const navigate = useNavigate();
  const rec = useAppStore((s) => s.recommendation);
  const decisionName = useAppStore((s) => s.decisionName);
  const [report, setReport] = useState('');
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await generateAdvisorReport({
        decision_name: decisionName,
        opt_products: rec?.products ?? null,
        opt_total_margin: rec?.total_margin ?? null,
        use_llm: true,
      });
      if (res.report) {
        setReport(res.report);
        Toast.show({ icon: 'success', content: '报告生成成功' });
      } else {
        Toast.show({ icon: 'fail', content: '报告内容为空' });
      }
    } catch {
      Toast.show({ icon: 'fail', content: '生成失败，请稍后重试' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="report-page">
      <NavBar onBack={() => navigate(-1)}>经营报告</NavBar>

      <div className="page-content">
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
                  return null;
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
      </div>
    </div>
  );
}
