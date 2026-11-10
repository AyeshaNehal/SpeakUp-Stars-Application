import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setupGlobalErrorLogging } from './services/logger';

// Initialize privacy-safe global error scrubber
setupGlobalErrorLogging();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
