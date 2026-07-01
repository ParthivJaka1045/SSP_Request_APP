import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/app-layout.css'
import './styles/catalog.css'
import './styles/responsive.css'
import App from './App.jsx'
import { RequestCartProvider } from './contexts/RequestCartContext'
import SmoothScroll from './components/providers/SmoothScroll'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SmoothScroll>
      <RequestCartProvider>
        <App />
      </RequestCartProvider>
    </SmoothScroll>
  </StrictMode>,
)
