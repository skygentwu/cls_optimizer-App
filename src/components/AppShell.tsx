import { TabBar } from 'antd-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppOutline,
  HistogramOutline,
  EyeOutline,
  AudioOutline,
  UserOutline,
} from 'antd-mobile-icons';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

const tabs = [
  { key: '/', title: '概览', icon: <AppOutline /> },
  { key: '/compare', title: '对比', icon: <HistogramOutline /> },
  { key: '/trends', title: '趋势', icon: <EyeOutline /> },
  { key: '/insights', title: '建议', icon: <AudioOutline /> },
  { key: '/profile', title: '我的', icon: <UserOutline /> },
];

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 60 }}>
        {children}
      </main>
      <TabBar
        activeKey={location.pathname}
        onChange={(key) => navigate(key)}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff' }}
      >
        {tabs.map((tab) => (
          <TabBar.Item key={tab.key} icon={tab.icon} title={tab.title} />
        ))}
      </TabBar>
    </div>
  );
}
