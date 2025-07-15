// src/components/FullScreenLoader.tsx
import React from 'react';
import { Spin } from 'antd';

const FullScreenLoader: React.FC = () => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}
  >
    <Spin size="large" tip="Generating PDF..." />
  </div>
);

export default FullScreenLoader;