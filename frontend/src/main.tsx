import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.js'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.js'

const rootElement = document.getElementById('root')
if (rootElement) {
    createRoot(rootElement).render(
        <BrowserRouter>
        <AuthProvider>
            <App />
        </AuthProvider>
        </BrowserRouter>,
    )
}