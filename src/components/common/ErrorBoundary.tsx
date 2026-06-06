import { Component, type ReactNode } from 'react';
import { Result, Button } from 'antd-mobile';
import { CloseCircleOutline } from 'antd-mobile-icons';

/**
 * ErrorBoundary Props：包裹任意子组件，捕获其渲染期错误
 */
interface Props {
  children: ReactNode;
}

/**
 * ErrorBoundary State：记录是否发生错误及错误对象
 */
interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary：React 错误边界组件
 * 作用：捕获子组件树中的 JavaScript 错误，防止整个应用白屏崩溃
 * 使用方式：在 main.tsx 中包裹根组件，或在关键页面外层包裹
 *
 * 注意：只能捕获渲染期、生命周期、构造函数中的错误；
 * 无法捕获事件处理、异步代码（setTimeout/Promise）、服务端渲染错误
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * 静态方法：子组件抛出错误时更新状态，触发降级 UI 渲染
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * 错误捕获后的副作用：可在此上报日志（如 Sentry）
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  /**
   * 点击刷新后重置错误状态并重新加载页面
   * TODO: 未来可优化为"重试渲染"而非整页 reload，提升用户体验
   */
  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Result
            status="error"
            title="页面出错了"
            description={this.state.error?.message || '请尝试刷新页面'}
            icon={<CloseCircleOutline />}
            style={{ background: 'transparent' }}
          />
          <Button color="primary" size="small" onClick={this.handleReset} style={{ marginTop: 16 }}>
            刷新页面
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
