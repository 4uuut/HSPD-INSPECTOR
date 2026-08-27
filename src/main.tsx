import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out noise from browser extension scripts (e.g., MetaMask, Web3 crypto wallets, content scripts) and Firestore Quota logs
if (typeof window !== 'undefined') {
  // Gracefully filter unhandled rejection noise
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = String(reason?.message || reason?.code || reason || '');
    if (
      msg.includes('MetaMask') ||
      msg.includes('ethereum') ||
      msg.includes('wallet') ||
      msg.includes('Receiving end does not exist') ||
      msg.includes('Broadcast channel unavailable') ||
      msg.includes('Channel secret not available') ||
      msg.includes('useCache') ||
      msg.includes('inpage.js') ||
      msg.includes('contentscript.js') ||
      msg.includes('resource-exhausted') ||
      msg.includes('Quota limit exceeded') ||
      msg.includes('Free daily write units')
    ) {
      event.preventDefault();
    }
  });

  // Gracefully filter runtime error events
  window.addEventListener('error', (event) => {
    const msg = String(event?.message || '');
    if (
      msg.includes('MetaMask') ||
      msg.includes('ethereum') ||
      msg.includes('inpage.js') ||
      msg.includes('contentscript.js') ||
      msg.includes('resource-exhausted') ||
      msg.includes('Quota limit exceeded') ||
      msg.includes('Free daily write units')
    ) {
      event.preventDefault();
    }
  });

  // Filter console.error logs for Firestore Quota Exceeded backoff messages
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const fullText = args.map(a => String(a?.message || a || '')).join(' ');
    if (
      fullText.includes('resource-exhausted') ||
      fullText.includes('Quota limit exceeded') ||
      fullText.includes('Free daily write units') ||
      fullText.includes('maximum backoff delay')
    ) {
      // Mute known quota exhaustion logs
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

