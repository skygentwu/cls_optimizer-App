import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag, Toast, Button } from 'antd-mobile';
import { useAppStore } from '@/stores/appStore';
import { generateAdvisorReport } from '@/api/client';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import './insights.css';

export default function InsightsPage() {
  const navigate = useNavigate();
  const recommendation = useAppStore((s) => s.recommendation);
  const decisionName = useAppStore((s) => s.decisionName);

  const [report, setReport] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // 持有当前进行中的请求 controller，用于：1) 取消竞态 2) 卸载时清理
  const abortRef = useRef<AbortController | null>(null);
  // 标记是否已为本轮 recommendation 自动触发过请求，避免"清空 report→重新生成"双触发
  const autoFetchedFor = useRef<unknown>(null);

  const loadReport = async () => {
    if (!recommendation) {
      Toast.show({ icon: 'fail', content: '请先在概览页获取推荐数据' });
      return;
    }
    // 取消上一次未完成的请求
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setReportLoading(true);
    try {
      const res = await generateAdvisorReport({
        decision_name: decisionName,
        opt_products: recommendation.products,
        opt_total_margin: recommendation.total_margin,
        use_llm: false,
      });
      // 被新请求取代则丢弃，避免旧响应覆盖
      if (ctrl.signal.aborted) return;
      setReport(res.report);
    } catch {
      if (ctrl.signal.aborted) return;
      Toast.show({ icon: 'fail', content: '生成建议失败，请重试' });
    } finally {
      if (!ctrl.signal.aborted) {
        setReportLoading(false);
      }
    }
  };

  // 仅在 recommendation 变化时自动触发一次。
  // 关键：依赖里不含 report，避免"清空 report→重新生成"按钮操作引发的双触发。
  useEffect(() => {
    if (recommendation && autoFetchedFor.current !== recommendation) {
      autoFetchedFor.current = recommendation;
      loadReport();
    }
    return () => {
      // 卸载或 recommendation 变化时取消进行中的请求
      abortRef.current?.abort();
    };
    // loadReport 引用每次渲染都变，但这里只想在 recommendation 变化时触发，
    // 故用 ref 兜底防重复，并显式限定依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendation]);

  if (reportLoading && !report) {
    return (
      <div className="insights-page">
        <NavBar onBack={() => navigate(-1)}>智能建议</NavBar>
        <SkeletonCard rows={3} />
        <SkeletonCard rows={3} />
        <SkeletonCard rows={3} />
      </div>
    );
  }

  return (
    <div className="insights-page">
      <NavBar onBack={() => navigate(-1)}>智能建议</NavBar>

      <div className="page-content">
        {/* 今日经营建议 */}
        <Card style={{ margin: '12px' }}>
          <div className="card-title">
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
          {report && (
            <Button
              size="mini"
              color="primary"
              fill="outline"
              loading={reportLoading}
              onClick={() => { setReport(''); loadReport(); }}
              style={{ marginTop: 12 }}
            >
              重新生成
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
