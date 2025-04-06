import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

// Add Inter font
const inter = document.createElement('link')
inter.rel = 'stylesheet'
inter.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
document.head.appendChild(inter)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
