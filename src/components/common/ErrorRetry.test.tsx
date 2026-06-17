import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorRetry } from './ErrorRetry';

describe('ErrorRetry', () => {
  it('渲染默认错误信息', () => {
    render(<ErrorRetry />);
    expect(screen.getByText('加载失败')).toBeInTheDocument();
    expect(screen.getByText('数据加载失败')).toBeInTheDocument();
  });

  it('渲染自定义错误信息', () => {
    render(<ErrorRetry message="网络超时" />);
    expect(screen.getByText('网络超时')).toBeInTheDocument();
  });

  it('传入 onRetry 时显示重新加载按钮', () => {
    const onRetry = vi.fn();
    render(<ErrorRetry onRetry={onRetry} />);
    const btn = screen.getByText('重新加载');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('未传入 onRetry 时不显示按钮', () => {
    render(<ErrorRetry />);
    expect(screen.queryByText('重新加载')).not.toBeInTheDocument();
  });
});
