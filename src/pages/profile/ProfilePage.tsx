import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { NavBar, List, Button, Modal, Toast, Input, Switch, Selector, Space } from 'antd-mobile';
import {
  UserOutline,
  CheckShieldOutline,
  SetOutline,
  InformationCircleOutline,
  QuestionCircleOutline,
  TagOutline,
  SystemQRcodeOutline,
  EyeOutline,
} from 'antd-mobile-icons';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { logout } from '@/api/client';
import { isValidApiBase, isTrustedDevHost, testConnection } from '@/utils/apiBase';
import { useNavigate } from 'react-router-dom';
import './profile.css';

const PRESETS = [
  { label: '自动判断', value: 'auto', desc: '浏览器走Proxy，模拟器用10.0.2.2' },
  { label: '模拟器', value: 'emulator', desc: 'http://10.0.2.2:8080' },
  { label: '本机', value: 'localhost', desc: 'http://localhost:8080' },
  { label: '自定义', value: 'custom', desc: '手动输入地址' },
];

function getPresetFromUrl(url: string): string {
  if (!url) return 'auto';
  if (url.includes('10.0.2.2')) return 'emulator';
  if (url.includes('localhost')) return 'localhost';
  return 'custom';
}

function getUrlFromPreset(preset: string): string {
  switch (preset) {
    case 'emulator': return 'http://10.0.2.2:8080';
    case 'localhost': return 'http://localhost:8080';
    case 'auto':
    default: return '';
  }
}

export default function ProfilePage() {
  const { user, clearAuth } = useAuthStore();
  const { apiBaseUrl, setApiBaseUrl, theme, toggleTheme } = useAppStore();
  const navigate = useNavigate();
  const [editingApi, setEditingApi] = useState(false);
  const [tempUrl, setTempUrl] = useState(apiBaseUrl);
  const [preset, setPreset] = useState(getPresetFromUrl(apiBaseUrl));
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState<boolean | null>(null);

  useEffect(() => {
    setTempUrl(apiBaseUrl);
    setPreset(getPresetFromUrl(apiBaseUrl));
    setTestOk(null);
  }, [apiBaseUrl, editingApi]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    clearAuth();
    Toast.show({ icon: 'success', content: '已退出登录' });
    navigate('/login');
  };

  const confirmLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      onConfirm: handleLogout,
    });
  };

  const applyPreset = (val: string) => {
    setPreset(val);
    setTempUrl(getUrlFromPreset(val));
    setTestOk(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestOk(null);
    const ok = await testConnection(tempUrl);
    setTestOk(ok);
    setTesting(false);
    Toast.show({ icon: ok ? 'success' : 'fail', content: ok ? '连接成功' : '连接失败' });
  };

  const handleSaveApiUrl = () => {
    const value = tempUrl.trim();
    if (!isValidApiBase(value)) {
      Toast.show({ icon: 'fail', content: '地址无效，请输入 http(s):// 开头的完整地址或留空' });
      return;
    }
    if (value && !isTrustedDevHost(value)) {
      Toast.show({ icon: 'success', content: '已保存（注意：非受信明文地址，令牌可能外泄风险），正在重启应用...' });
    } else {
      Toast.show({ icon: 'success', content: '地址已更新，正在重启应用...' });
    }
    setApiBaseUrl(value);
    setEditingApi(false);
    setTimeout(() => window.location.reload(), 800);
  };

  const handleResetApiUrl = () => {
    setApiBaseUrl('');
    setTempUrl('');
    setPreset('auto');
    Toast.show({ icon: 'success', content: '已重置为默认地址' });
  };

  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="profile-page">
      <NavBar back={null}>我的</NavBar>

      <div className="page-content">
        {/* 用户信息卡片 */}
        <div className="user-card">
          <div className="user-avatar">
            {user?.display_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.display_name || user?.username || '用户'}</div>
            <div className="user-role">
              {user?.role === 'admin' ? '管理员' : '普通用户'}
            </div>
          </div>
        </div>

        {/* 功能列表 */}
        <div style={{ margin: '12px' }}>
          <List>
            <List.Item prefix={<UserOutline />} description={user?.username}>
              账号信息
            </List.Item>
            <List.Item prefix={<CheckShieldOutline />} description={user?.auth_source || '本地'}>
              认证方式
            </List.Item>
            {user?.role === 'admin' && (
              <List.Item prefix={<SetOutline />} arrow>
                管理控制台
              </List.Item>
            )}
          </List>
        </div>

        {/* 后端地址配置 */}
        <div style={{ margin: '12px' }}>
          <List header="网络配置">
            <List.Item
              prefix={<SystemQRcodeOutline />}
              description={apiBaseUrl || (isNative ? '自动（模拟器）' : '自动（浏览器Proxy）')}
              arrow
              onClick={() => setEditingApi(true)}
            >
              后端服务器地址
            </List.Item>
          </List>
        </div>

        <Modal
          visible={editingApi}
          title="配置后端地址"
          content={
            <div style={{ padding: '8px 0' }}>
              <Selector
                options={PRESETS.map(p => ({ label: p.label, value: p.value, description: p.desc }))}
                value={[preset]}
                onChange={(v) => applyPreset(String(v[0]))}
                showCheckMark={false}
                style={{ marginBottom: 12 }}
              />

              {preset === 'custom' && (
                <Input
                  id="apiBaseUrl"
                  name="apiBaseUrl"
                  placeholder="如: http://192.168.1.5:8080"
                  value={tempUrl}
                  onChange={(val) => { setTempUrl(val); setTestOk(null); }}
                  clearable
                  style={{ marginBottom: 8 }}
                />
              )}

              <Space block justify="between" align="center">
                <div style={{ fontSize: 12, color: '#1677ff' }}>
                  当前: {tempUrl || '自动判断'}
                </div>
                <Button
                  size="mini"
                  color={testOk === true ? 'success' : testOk === false ? 'danger' : 'primary'}
                  loading={testing}
                  onClick={handleTest}
                >
                  {testOk === true ? '已连通' : testOk === false ? '不通' : '测试连接'}
                </Button>
              </Space>

              <div style={{ marginTop: 8, fontSize: 11, color: '#999' }}>
                {isNative
                  ? '模拟器选「模拟器」，真机请选「自定义」并填电脑局域网IP'
                  : '浏览器开发保持「自动判断」即可，由 Vite Proxy 转发'}
              </div>
            </div>
          }
          closeOnAction
          onClose={() => setEditingApi(false)}
          actions={[
            {
              key: 'reset',
              text: '重置',
              onClick: handleResetApiUrl,
            },
            {
              key: 'save',
              text: '保存',
              primary: true,
              onClick: handleSaveApiUrl,
            },
          ]}
        />

        <div style={{ margin: '12px' }}>
          <List header="外观">
            <List.Item
              prefix={<EyeOutline />}
              extra={<Switch checked={theme === 'dark'} onChange={toggleTheme} />}
            >
              深色模式
            </List.Item>
          </List>
        </div>

        <div style={{ margin: '12px' }}>
          <List>
            <List.Item prefix={<InformationCircleOutline />} arrow>
              关于系统
            </List.Item>
            <List.Item prefix={<QuestionCircleOutline />} arrow>
              帮助文档
            </List.Item>
            <List.Item prefix={<TagOutline />} description="v1.0.0">
              版本信息
            </List.Item>
          </List>
        </div>

        <div className="logout-section">
          <Button block color="danger" fill="outline" onClick={confirmLogout}>
            退出登录
          </Button>
        </div>
      </div>
    </div>
  );
}
