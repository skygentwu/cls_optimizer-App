import { Result } from 'antd-mobile';
import { UnorderedListOutline } from 'antd-mobile-icons';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = '暂无数据',
  description = '当前没有可展示的数据',
}: EmptyStateProps) {
  return (
    <Result
      status="waiting"
      title={title}
      description={description}
      icon={<UnorderedListOutline />}
      style={{ padding: '32px 16px', background: 'transparent' }}
    />
  );
}
