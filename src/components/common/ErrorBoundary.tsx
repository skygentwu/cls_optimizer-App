import { Component, type ReactNode } from 'react';
import { Result, Button } from 'antd-mobile';
import { CloseCircleOutline } from 'antd-mobile-icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

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
