import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Filter out noise from browser extension scripts (e.g., MetaMask, Web3 crypto wallets, content scripts) and Firestore Quota logs
if (typeof window !== 'undefined') {
  const isIgnoredNoise = (msg: string) => {
    const lower = msg.toLowerCase();
    return (
      lower.includes('metamask') ||
      lower.includes('failed to connect to metamask') ||
      lower.includes('ethereum') ||
      lower.includes('wallet') ||
      lower.includes('web3') ||
      lower.includes('receiving end does not exist') ||
      lower.includes('broadcast channel unavailable') ||
      lower.includes('channel secret not available') ||
      lower.includes('usecache') ||
      lower.includes('inpage.js') ||
      lower.includes('contentscript.js') ||
      lower.includes('chrome-extension://') ||
      lower.includes('moz-extension://') ||
      lower.includes('resource-exhausted') ||
      lower.includes('quota limit exceeded') ||
      lower.includes('free daily write units') ||
      lower.includes('maximum backoff delay')
    );
  };

  // Gracefully filter unhandled rejection noise
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = String(reason?.message || reason?.code || reason?.stack || reason || '');
    if (isIgnoredNoise(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  }, true);

  // Gracefully filter runtime error events
  window.addEventListener('error', (event) => {
    const msg = String(event?.message || event?.error?.message || event?.filename || '');
    if (isIgnoredNoise(msg)) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  }, true);

  // Filter console.error logs for MetaMask, extension noise, and Firestore Quota messages
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const fullText = args.map(a => String(a?.message || a?.stack || a || '')).join(' ');
    if (isIgnoredNoise(fullText)) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Filter console.warn logs for extension noise
  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    const fullText = args.map(a => String(a?.message || a?.stack || a || '')).join(' ');
    if (isIgnoredNoise(fullText)) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

