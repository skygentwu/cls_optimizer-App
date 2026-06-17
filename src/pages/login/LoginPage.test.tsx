import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/pages/login/LoginPage';
import * as apiClient from '@/api/client';
import { useAuthStore } from '@/stores/authStore';

// Mock API 客户端
vi.mock('@/api/client', async () => {
  const actual = await vi.importActual<typeof apiClient>('@/api/client');
  return {
    ...actual,
    login: vi.fn(),
  };
});

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('LoginPage', () => {
  const mockLoginResponse = {
    access_token: 'mock-token-123',
    token_type: 'bearer',
    user: {
      username: 'admin',
      display_name: '管理员',
      role: 'admin',
      auth_source: 'local',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.login).mockResolvedValue(mockLoginResponse as any);
    // 清除 auth store 状态
    useAuthStore.getState().clearAuth();
  });

  it('渲染登录表单', () => {
    render(<LoginPage />);
    expect(screen.getByText('CLS Optimizer')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入账号')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument();
    expect(screen.getByText('登 录')).toBeInTheDocument();
  });

  it('输入账号密码并登录', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('请输入账号'), 'admin');
    await user.type(screen.getByPlaceholderText('请输入密码'), 'password123');
    await user.click(screen.getByText('登 录'));

    await waitFor(() => {
      expect(apiClient.login).toHaveBeenCalledWith('admin', 'password123');
    });
  });

  it('空账号密码显示提示', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByText('登 录'));

    await waitFor(() => {
      expect(screen.getByText('请输入账号和密码')).toBeInTheDocument();
    });
  });

  it('登录失败显示错误信息', async () => {
    vi.mocked(apiClient.login).mockRejectedValue(
      new apiClient.ApiError(401, 'Unauthorized')
    );

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('请输入账号'), 'admin');
    await user.type(screen.getByPlaceholderText('请输入密码'), 'wrong');
    await user.click(screen.getByText('登 录'));

    await waitFor(() => {
      expect(screen.getByText('账号或密码错误')).toBeInTheDocument();
    });
  });

  it('打开后端地址设置弹层', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByText('连接异常？点此设置后端地址'));

    await waitFor(() => {
      expect(screen.getByText('后端连接设置')).toBeInTheDocument();
    });
  });
});
