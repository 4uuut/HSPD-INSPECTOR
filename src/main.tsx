import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out noise from browser extension scripts (e.g., MetaMask, Web3 crypto wallets, content scripts)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = String(reason?.message || reason || '');
    if (
      msg.includes('MetaMask') ||
      msg.includes('ethereum') ||
      msg.includes('wallet') ||
      msg.includes('Receiving end does not exist') ||
      msg.includes('Broadcast channel unavailable') ||
      msg.includes('Channel secret not available') ||
      msg.includes('useCache') ||
      msg.includes('inpage.js') ||
      msg.includes('contentscript.js')
    ) {
      // Prevent noisy unhandled rejection from browser extensions
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = String(event?.message || '');
    if (
      msg.includes('MetaMask') ||
      msg.includes('ethereum') ||
      msg.includes('inpage.js') ||
      msg.includes('contentscript.js')
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

