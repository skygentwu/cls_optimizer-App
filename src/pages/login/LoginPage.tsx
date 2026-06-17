import { useState } from 'react';
import { Form, Input, Button, Toast, NavBar, Popup, Space } from 'antd-mobile';
import { SetOutline } from 'antd-mobile-icons';
import { login, ApiError } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { isValidApiBase, isTrustedDevHost } from '@/utils/apiBase';
import './login.css';

// 后端地址快捷预设（开发环境 Java 后端默认监听 8080）
const API_PRESETS = [
  { label: '自动', value: '', desc: '浏览器走 Vite 代理 / 原生用 10.0.2.2' },
  { label: '本机 8080', value: 'http://localhost:8080', desc: '本机直连 Java 后端' },
  { label: '模拟器 8080', value: 'http://10.0.2.2:8080', desc: 'Android 模拟器访问宿主机' },
];

// 通过 /healthz 探测后端是否可达
async function testConnection(baseUrl: string): Promise<boolean> {
  try {
    const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/healthz` : '/healthz';
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { apiBaseUrl, setApiBaseUrl } = useAppStore();

  // 连接设置弹层状态
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(apiBaseUrl);
  const [testing, setTesting] = useState(false);

  const openSettings = () => {
    setTempUrl(apiBaseUrl);
    setShowSettings(true);
  };

  const handleTest = async () => {
    setTesting(true);
    const ok = await testConnection(tempUrl.trim());
    setTesting(false);
    Toast.show({ icon: ok ? 'success' : 'fail', content: ok ? '连接成功' : '连接失败，请检查地址与后端' });
  };

  const handleSaveSettings = () => {
    const value = tempUrl.trim();
    if (!isValidApiBase(value)) {
      Toast.show({ icon: 'fail', content: '地址无效，请输入 http(s):// 开头的完整地址或留空' });
      return;
    }
    setApiBaseUrl(value);
    setShowSettings(false);
    if (value && !isTrustedDevHost(value)) {
      Toast.show({ icon: 'success', content: '已保存（注意：非受信明文地址，令牌可能外泄风险）' });
    } else {
      Toast.show({ icon: 'success', content: '后端地址已保存' });
    }
  };

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
      <NavBar
        back={null}
        style={{ background: 'transparent', color: '#fff' }}
        right={
          <span
            role="button"
            aria-label="连接设置"
            onClick={openSettings}
            style={{ color: '#fff', fontSize: 22, cursor: 'pointer', padding: '0 4px' }}
          >
            <SetOutline />
          </span>
        }
      >
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
                onEnterPress={handleLogin}
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

          <p className="login-hint" onClick={openSettings} style={{ cursor: 'pointer' }}>
            连接异常？点此设置后端地址
          </p>
        </div>
      </div>

      <Popup
        visible={showSettings}
        onMaskClick={() => setShowSettings(false)}
        onClose={() => setShowSettings(false)}
        bodyStyle={{
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 20,
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        <div className="api-settings">
          <h3 className="api-settings-title">后端连接设置</h3>
          <p className="api-settings-current">
            当前生效：{apiBaseUrl || '自动（浏览器走代理 / 原生用模拟器地址）'}
          </p>

          <div className="api-settings-presets">
            <Space wrap>
              {API_PRESETS.map((p) => (
                <Button
                  key={p.value || 'auto'}
                  size="small"
                  color={tempUrl.trim() === p.value ? 'primary' : 'default'}
                  fill={tempUrl.trim() === p.value ? 'solid' : 'outline'}
                  onClick={() => setTempUrl(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </Space>
          </div>

          <Form layout="vertical">
            <Form.Item
              label="后端地址"
              description="留空表示自动判断；自定义时请填写完整地址，如 http://192.168.1.10:8080"
            >
              <Input
                id="apiBaseUrl"
                name="apiBaseUrl"
                placeholder="http://localhost:8080"
                value={tempUrl}
                onChange={(val) => setTempUrl(val)}
                clearable
              />
            </Form.Item>
          </Form>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <Button block fill="outline" loading={testing} onClick={handleTest}>
              测试连接
            </Button>
            <Button block color="primary" onClick={handleSaveSettings}>
              保存
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  );
}
