import { NavBar, List, Button, Modal, Toast } from 'antd-mobile';
import {
  UserOutline,
  CheckShieldOutline,
  SetOutline,
  InformationCircleOutline,
  QuestionCircleOutline,
  TagOutline,
} from 'antd-mobile-icons';
import { useAuthStore } from '@/stores/authStore';
import { logout } from '@/api/client';
import { useNavigate } from 'react-router-dom';
import './profile.css';

export default function ProfilePage() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

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
