import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

createRoot(document.getElementById('root')).render(
 <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        elements: {
          formButtonPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          card: 'shadow-xl rounded-[40px]'
        }
      }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
    <App />
    </ClerkProvider>
  </StrictMode>
)
