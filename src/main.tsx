import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error swallow guard for cross-origin "Script error." that can occur
// in sandboxed iframe environments or when loading external mapping resources.
if (typeof window !== 'undefined') {
  const oldOnError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    const msgStr = String(message || '');
    const srcStr = String(source || '');
    
    // Check if error is a generic script error or originates from a cross-origin script
    const isGenericScriptError = msgStr.toLowerCase().includes('script error');
    const isCrossOriginSource = srcStr.startsWith('http') && !srcStr.includes(window.location.host);
    
    if (isGenericScriptError || isCrossOriginSource) {
      console.warn('Swallowed cross-origin script error via window.onerror:', message, source, lineno, colno);
      return true; // Prevents error from bubbling up or breaking the applet check
    }
    if (oldOnError) {
      return oldOnError.apply(this, arguments as any);
    }
    return false;
  };

  window.addEventListener('error', (event) => {
    const msgStr = String(event.message || '');
    const srcStr = String(event.filename || '');
    
    const isGenericScriptError = msgStr.toLowerCase().includes('script error');
    const isCrossOriginSource = srcStr.startsWith('http') && !srcStr.includes(window.location.host);
    
    if (isGenericScriptError || isCrossOriginSource) {
      console.warn('Swallowed cross-origin script error via event listener:', event);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const msgStr = event.reason ? String(event.reason.message || event.reason || '') : '';
    const srcStr = event.reason && event.reason.stack ? String(event.reason.stack) : '';
    
    const isGenericScriptError = msgStr.toLowerCase().includes('script error');
    const isCrossOriginSource = srcStr.startsWith('http') && !srcStr.includes(window.location.host);
    
    if (isGenericScriptError || isCrossOriginSource) {
      console.warn('Swallowed cross-origin unhandled rejection:', event.reason);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

