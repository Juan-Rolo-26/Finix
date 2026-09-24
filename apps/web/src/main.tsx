import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

console.log('\n\n=============================================');
console.log('===> LEVANTANDO FRONTEND LOCAL <===');
console.log('=============================================\n\n');

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>,
);

if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}
