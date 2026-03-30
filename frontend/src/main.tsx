import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.js'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.js'
import { LocaleProvider } from './context/LocaleContext.js'

const rootElement = document.getElementById('root')
if (rootElement) {
    createRoot(rootElement).render(
        <BrowserRouter>
        <AuthProvider>
            <LocaleProvider>
            <App />
            </LocaleProvider>
        </AuthProvider>
        </BrowserRouter>,
    )
}