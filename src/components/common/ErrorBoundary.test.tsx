import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * 辅助组件：用于在测试中故意抛出错误
 * 正常渲染时显示子组件内容，shouldThrow=true 时抛异常
 */
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div data-testid="child">Normal content</div>;
};

/**
 * ErrorBoundary 测试集
 * 作用：验证 React 错误边界能否捕获子组件异常，并展示降级 UI
 */
describe('ErrorBoundary', () => {
  it('无异常时正常渲染子组件', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Safe</div>
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Safe');
  });

  it('捕获异常后显示降级错误页面', () => {
    // 屏蔽 console.error，避免测试输出被 React 错误日志污染
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // 验证降级 UI 渲染：标题、错误详情、刷新按钮
    expect(screen.getByText('页面出错了')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /刷新页面/ })).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('点击刷新按钮触发页面重载', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reloadMock = vi.fn();
    // Mock window.location.reload，避免测试时真的刷新页面
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, reload: reloadMock },
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByRole('button', { name: /刷新页面/ }));
    expect(reloadMock).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
