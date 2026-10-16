import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AppVersion from './AppVersion.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <AppVersion />
  </StrictMode>,
)
