import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App.jsx';
import './index.css';

// Find the root element
const container = document.getElementById('root');
const root = createRoot(container);

// Render the App component to the DOM
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 