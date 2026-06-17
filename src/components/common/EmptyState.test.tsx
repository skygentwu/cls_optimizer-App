import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('渲染默认标题和描述', () => {
    render(<EmptyState />);
    expect(screen.getByText('暂无数据')).toBeInTheDocument();
    expect(screen.getByText('当前没有可展示的数据')).toBeInTheDocument();
  });

  it('渲染自定义标题和描述', () => {
    render(<EmptyState title="无记录" description="请稍后再试" />);
    expect(screen.getByText('无记录')).toBeInTheDocument();
    expect(screen.getByText('请稍后再试')).toBeInTheDocument();
  });
});
