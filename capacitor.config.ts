import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chloralkali.clsoptimizer',
  appName: 'CLS Optimizer',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1890ff',
      showSpinner: true,
      spinnerColor: '#ffffff',
    },
  },
};

export default config;
