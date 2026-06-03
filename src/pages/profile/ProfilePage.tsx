import { useState } from 'react';
import { NavBar, List, Button, Modal, Toast, Input } from 'antd-mobile';
import {
  UserOutline,
  CheckShieldOutline,
  SetOutline,
  InformationCircleOutline,
  QuestionCircleOutline,
  TagOutline,
  SystemQRcodeOutline,
} from 'antd-mobile-icons';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { logout } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import './profile.css';

export default function ProfilePage() {
  const { user, clearAuth } = useAuthStore();
  const { apiBaseUrl, setApiBaseUrl } = useAppStore();
  const navigate = useNavigate();
  const [editingApi, setEditingApi] = useState(false);
  const [tempUrl, setTempUrl] = useState(apiBaseUrl);

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

  const handleSaveApiUrl = () => {
    setApiBaseUrl(tempUrl.trim());
    setEditingApi(false);
    Toast.show({ icon: 'success', content: '后端地址已更新，请刷新页面生效' });
  };

  const handleResetApiUrl = () => {
    setApiBaseUrl('');
    setTempUrl('');
    Toast.show({ icon: 'success', content: '已重置为默认地址' });
  };

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
              description={apiBaseUrl || '默认（本机）'}
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
              <Input
                placeholder="如: https://clsoptimizer.loca.lt"
                value={tempUrl}
                onChange={(val) => setTempUrl(val)}
                clearable
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                留空则使用默认地址（localhost:8000）
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: '#1677ff' }}>
                当前: {apiBaseUrl || '默认'}
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
