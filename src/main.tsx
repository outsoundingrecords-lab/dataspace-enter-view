import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { PreferencesProvider } from './context/PreferencesContext';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <PreferencesProvider>
        <App />
      </PreferencesProvider>
    </React.StrictMode>
  );
}
