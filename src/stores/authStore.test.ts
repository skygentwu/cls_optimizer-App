import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

/**
 * authStore 测试集
 * 功能：验证 JWT 登录态的读写、清除、以及 Zustand persist 持久化
 */
describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    // 恢复到初始未登录状态（Zustand persist 会读取 localStorage，这里强制重置）
    useAuthStore.setState(useAuthStore.getInitialState?.() ?? { token: '', user: null, isLoggedIn: false });
  });

  it('初始状态为未登录', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBe('');
    expect(state.user).toBeNull();
    expect(state.isLoggedIn).toBe(false);
  });

  it('setAuth 更新 token、用户信息、登录状态', () => {
    useAuthStore.getState().setAuth('mock-token', { username: 'admin', display_name: 'Admin', role: 'admin', auth_source: 'local' });
    const state = useAuthStore.getState();
    expect(state.token).toBe('mock-token');
    expect(state.isLoggedIn).toBe(true);
    expect(state.user?.username).toBe('admin');
  });

  it('clearAuth 重置所有登录信息', () => {
    useAuthStore.getState().setAuth('token', { username: 'admin', display_name: 'Admin', role: 'admin', auth_source: 'local' });
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.token).toBe('');
    expect(state.isLoggedIn).toBe(false);
    expect(state.user).toBeNull();
  });

  it('登录态自动持久化到 localStorage（Zustand persist）', () => {
    useAuthStore.getState().setAuth('persisted-token', { username: 'user', display_name: 'User', role: 'user', auth_source: 'local' });
    const raw = localStorage.getItem('cls-auth-storage');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.token).toBe('persisted-token');
  });
});
