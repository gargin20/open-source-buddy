import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/theme.css';
import './styles/cards.css';
import './styles/sidebar.css';
import './styles/detail.css';
import './styles/prcoach.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
