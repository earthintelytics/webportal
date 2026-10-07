import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { LoadingProvider } from './hooks/useLoading'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LoadingProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LoadingProvider>
  </StrictMode>,
)


// Installable on phones: keep the app on the device (public/sw.js) and remember
// the phone's install offer so the "Install app" button can use it.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__fiInstallPrompt = e;
  window.dispatchEvent(new Event('fi-install-available'));
});
