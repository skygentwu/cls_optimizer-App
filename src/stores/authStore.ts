import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

/**
 * AuthState：用户认证状态接口
 * - token: JWT Access Token，用于 API 请求的 Authorization Header
 * - user: 当前登录用户信息
 * - isLoggedIn: 是否已登录（由 token 和 user 派生，但单独存储便于组件直接读取）
 */
interface AuthState {
  token: string;
  user: User | null;
  isLoggedIn: boolean;
  setAuth: (token: string, user: User) => void;   // 登录成功后写入
  clearAuth: () => void;                           // 退出登录或 401 时清除
}

/**
 * useAuthStore：认证状态管理（Zustand + persist 中间件）
 * - 自动持久化到 localStorage，键名为 cls-auth-storage
 * - 页面刷新后登录态不丢失
 * - 注意：JWT 存在 localStorage 中有 XSS 风险，需确保前端无脚本注入漏洞
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: '',
      user: null,
      isLoggedIn: false,
      setAuth: (token, user) => set({ token, user, isLoggedIn: true }),
      clearAuth: () => set({ token: '', user: null, isLoggedIn: false }),
    }),
    {
      name: 'cls-auth-storage',   // localStorage 键名
    }
  )
);
