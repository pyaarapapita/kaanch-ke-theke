import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { preloadRouteFor } from './utils/routePages'

function renderApp() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
}

// createRoot discards the HTML already in #root. Prerendered routes wait for their
// page chunk first, so that HTML is replaced directly by the real page with no blank
// gap. A failed preload still renders, and React.lazy retries the import.
preloadRouteFor(window.location.pathname).then(renderApp, renderApp)
