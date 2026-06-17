import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 带竞态防护的异步请求 hook。
 *
 * 解决的问题：
 * - 用户快速切换筛选条件（如 forecast 的 7/14/30 天、margin 的月份）时，
 *   多个请求并发返回，旧响应可能覆盖新数据（"后发先至"）。
 * - 组件卸载后异步回调仍执行 setState，触发 React 警告/内存泄漏。
 *
 * 工作机制：
 * 1. 每次 fetcher 执行前，abort 上一次未完成的请求（通过 AbortController）
 * 2. fetcher 内部可随时读取 `signal.aborted`，决定是否继续处理结果
 * 3. 组件卸载或 deps 变化时，useEffect cleanup 自动 abort 当前请求
 *
 * 用法：
 * ```ts
 * const { loading, error, run } = useAbortableAsync(async (signal) => {
 *   const res = await runForecastAnalysis(days);
 *   if (signal.aborted) return;       // 已被新请求取代，丢弃结果
 *   setData(res);
 * }, [days]);
 * ```
 *
 * @param fetcher 异步函数，接收 AbortSignal 参数；返回值被忽略（副作用由调用方自行 setState）
 * @param deps 依赖数组；变化时自动 abort 旧请求并重新执行 fetcher
 */
export function useAbortableAsync(
  fetcher: (signal: AbortSignal) => Promise<void>,
  deps: unknown[]
): {
  loading: boolean;
  error: boolean;
  /** 手动重新触发（保留原 deps，重新执行一次 fetcher） */
  run: () => void;
} {
  // 持有当前未完成的 controller；跨渲染保持引用稳定
  const abortRef = useRef<AbortController | null>(null);
  // 初始 loading=true：页面挂载即显示骨架屏，避免"先白屏再骨架屏"的闪烁
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 把 fetcher 存进 ref，避免它成为 useEffect 的依赖导致重复触发。
  // 调用方通常用 useCallback 包裹 fetcher，但即便引用变化也不应重启请求。
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    // 进入前：取消上一次未完成的请求，确保只有最新一次的结果会落地
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(false);
    try {
      await fetcherRef.current(ctrl.signal);
      // fetcher 内部应自行检查 signal.aborted 决定是否 setState；
      // 这里不再统一 setState，避免覆盖 fetcher 已写入的数据
    } catch {
      // 被取消的请求不算错误
      if (!ctrl.signal.aborted) {
        setError(true);
      }
    } finally {
      // 只有当前最新的请求才有资格把 loading 置回 false
      if (!ctrl.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    execute();
    // 卸载或 deps 变化时，取消进行中的请求
    return () => {
      abortRef.current?.abort();
    };
    // execute 引用稳定；deps 控制重新触发时机
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { loading, error, run: execute };
}
