import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { LangProvider } from '../i18n';
import { applyDesignTokens } from './tokens';
import './styles.css';

applyDesignTokens();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LangProvider>
      <BrowserRouter basename="/konfigurator">
        <App />
      </BrowserRouter>
    </LangProvider>
  </React.StrictMode>
);
