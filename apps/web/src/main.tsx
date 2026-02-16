import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google';

// IMPORTANT: Replace this with your actual Google Client ID from https://console.cloud.google.com/
const GOOGLE_CLIENT_ID = "335615221204-6aa1ljvisfihmubouaa4infstadqbr94.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </GoogleOAuthProvider>
    </React.StrictMode>,
)
