import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MetricsPage } from './pages/MetricsPage'

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <MetricsPage />
  // </StrictMode>,
)
