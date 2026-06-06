import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState(useAuthStore.getInitialState?.() ?? { token: '', user: null, isLoggedIn: false });
  });

  it('has initial logged-out state', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBe('');
    expect(state.user).toBeNull();
    expect(state.isLoggedIn).toBe(false);
  });

  it('setAuth updates state', () => {
    useAuthStore.getState().setAuth('mock-token', { username: 'admin', display_name: 'Admin', role: 'admin', auth_source: 'local' });
    const state = useAuthStore.getState();
    expect(state.token).toBe('mock-token');
    expect(state.isLoggedIn).toBe(true);
    expect(state.user?.username).toBe('admin');
  });

  it('clearAuth resets state', () => {
    useAuthStore.getState().setAuth('token', { username: 'admin', display_name: 'Admin', role: 'admin', auth_source: 'local' });
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.token).toBe('');
    expect(state.isLoggedIn).toBe(false);
    expect(state.user).toBeNull();
  });

  it('persists to localStorage', () => {
    useAuthStore.getState().setAuth('persisted-token', { username: 'user', display_name: 'User', role: 'user', auth_source: 'local' });
    const raw = localStorage.getItem('cls-auth-storage');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.state.token).toBe('persisted-token');
  });
});
