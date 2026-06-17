import { useEffect, useRef, useState, type ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartBoxProps {
  /** 图表固定高度（px） */
  height: number;
  /** 单个 recharts 图表元素，如 <BarChart>...</BarChart> */
  children: ReactElement;
}

/**
 * 图表容器：先测量自身宽度，待拿到 > 0 的真实宽度后再渲染图表。
 *
 * 直接使用 <ResponsiveContainer width="100%"> 时，首帧容器尺寸尚未完成布局，
 * recharts 会以 -1×-1 渲染并打印 “width(-1) and height(-1) ...” 警告。
 * 这里用 ResizeObserver 拿到真实宽度后再以具体数值渲染，从根本上消除该警告，
 * 同时仍然随容器宽度自适应；仅在宽度实际变化时更新 state，避免无谓重渲染。
 */
export function ChartBox({ height, children }: ChartBoxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0]?.contentRect.width ?? el.clientWidth);
      setWidth((prev) => (prev === next ? prev : next));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {width > 0 && (
        <ResponsiveContainer width={width} height={height}>
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}
