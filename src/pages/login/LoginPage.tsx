import { useState } from 'react';
import { Form, Input, Button, Toast, NavBar } from 'antd-mobile';
import { login, ApiError } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import './login.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Toast.show({ icon: 'fail', content: '请输入账号和密码' });
      return;
    }
    setLoading(true);
    try {
      const res = await login(username, password);
      setAuth(res.access_token, res.user);
      Toast.show({ icon: 'success', content: '登录成功' });
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 401
        ? '账号或密码错误'
        : err instanceof ApiError
        ? `请求失败 (${err.status})`
        : '网络连接失败，请检查服务器地址';
      Toast.show({ icon: 'fail', content: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <NavBar back={null} style={{ background: 'transparent', color: '#fff' }}>
        <span style={{ color: '#fff', fontWeight: 600 }}>CLS Optimizer</span>
      </NavBar>

      <div className="login-content">
        <div className="login-header">
          <div className="login-logo">🧪</div>
          <h1 className="login-title">氯碱产品组合优化</h1>
          <p className="login-subtitle">经营决策支持系统</p>
        </div>

        <div className="login-form">
          <Form layout="vertical">
            <Form.Item label="账号">
              <Input
                id="username"
                name="username"
                placeholder="请输入账号"
                value={username}
                onChange={(val) => setUsername(val)}
                clearable
              />
            </Form.Item>
            <Form.Item label="密码">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(val) => setPassword(val)}
                clearable
              />
            </Form.Item>
          </Form>

          <Button
            color="primary"
            size="large"
            block
            loading={loading}
            onClick={handleLogin}
            style={{ marginTop: 24, borderRadius: 24 }}
          >
            登 录
          </Button>

          <p className="login-hint">默认账号: admin / 密码: admin</p>
        </div>
      </div>
    </div>
  );
}
