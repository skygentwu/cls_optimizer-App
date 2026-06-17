import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonCard, SkeletonGrid } from './SkeletonCard';

describe('SkeletonCard', () => {
  it('渲染默认 3 行骨架屏', () => {
    const { container } = render(<SkeletonCard />);
    const paragraphs = container.querySelectorAll('.adm-skeleton-paragraph');
    expect(paragraphs.length).toBe(3);
  });

  it('支持自定义行数', () => {
    const { container } = render(<SkeletonCard rows={5} />);
    const paragraphs = container.querySelectorAll('.adm-skeleton-paragraph');
    expect(paragraphs.length).toBe(5);
  });
});

describe('SkeletonGrid', () => {
  it('渲染默认 4 个格子', () => {
    const { container } = render(<SkeletonGrid />);
    const titles = container.querySelectorAll('.adm-skeleton-title');
    expect(titles.length).toBe(4);
  });

  it('支持自定义数量', () => {
    const { container } = render(<SkeletonGrid count={2} />);
    const titles = container.querySelectorAll('.adm-skeleton-title');
    expect(titles.length).toBe(2);
  });
});
