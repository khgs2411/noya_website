import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ProductProvider } from '@class-kit/react'

import App from './App'
import './i18n'
import './index.css'
import { classKitClient } from './lib/class-kit-client'
import { registerServiceWorker } from './register-service-worker'
import { registerVersionCheck } from './register-version-check'

registerServiceWorker()
registerVersionCheck()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProductProvider client={classKitClient}>
      <App />
    </ProductProvider>
  </StrictMode>,
)
