import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { WindowWidthProvider } from './contexts/windowWidth.context.tsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1048894982845-hbtmagenticcurator2026.apps.googleusercontent.com"

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <WindowWidthProvider>
      <App />
    </WindowWidthProvider>
  </GoogleOAuthProvider>
)
