import { TabBar } from 'antd-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppOutline,
  HistogramOutline,
  EditSOutline,
  PayCircleOutline,
  UserSetOutline,
} from 'antd-mobile-icons';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

const tabs = [
  { key: '/', title: '首页', icon: <AppOutline /> },
  { key: '/recommendation', title: '推荐', icon: <HistogramOutline /> },
  { key: '/manual', title: '模拟', icon: <EditSOutline /> },
  { key: '/prices', title: '价格', icon: <PayCircleOutline /> },
  { key: '/profile', title: '我的', icon: <UserSetOutline /> },
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
