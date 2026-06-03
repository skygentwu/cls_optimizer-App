import { Result, Button } from 'antd-mobile';
import { CloseCircleOutline } from 'antd-mobile-icons';

interface ErrorRetryProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorRetry({
  message = '数据加载失败',
  onRetry,
}: ErrorRetryProps) {
  return (
    <div style={{ padding: '32px 16px', textAlign: 'center' }}>
      <Result
        status="error"
        title="加载失败"
        description={message}
        icon={<CloseCircleOutline />}
        style={{ background: 'transparent' }}
      />
      {onRetry && (
        <Button color="primary" size="small" onClick={onRetry} style={{ marginTop: 12 }}>
          重新加载
        </Button>
      )}
    </div>
  );
}
