import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WindowWidthProvider } from './contexts/windowWidth.context.tsx'

createRoot(document.getElementById('root')!).render(
  <WindowWidthProvider>
    <App />
  </WindowWidthProvider>
)
