import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </StrictMode>
);
