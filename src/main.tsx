import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error swallow guard for cross-origin "Script error." that can occur
// in sandboxed iframe environments or when loading external mapping resources.
if (typeof window !== 'undefined') {
  // Global inspect prevention and shortcut blocking
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  document.addEventListener('keydown', (e) => {
    // Prevent F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    // Prevent Ctrl+Shift+I / Cmd+Option+I
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
      e.preventDefault();
      return false;
    }
    // Prevent Ctrl+Shift+J / Cmd+Option+J
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
      e.preventDefault();
      return false;
    }
    // Prevent Ctrl+Shift+C / Cmd+Option+C
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      return false;
    }
    // Prevent Ctrl+U / Cmd+Option+U (view-source)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
      return false;
    }
  });

  // Global console scrub/masking to protect database URLs, keys, and login parameters from Console Inspect
  const maskSensitiveData = (arg: any): any => {
    if (typeof arg === 'string') {
      let clean = arg;
      // Mask JWT tokens/keys (starts with eyJ...)
      clean = clean.replace(/eyJ[a-zA-Z0-9-_=]+\.[a-zA-Z0-9-_=]+\.?[a-zA-Z0-9-_.+/=]*/g, '[REDACTED_SECURE_TOKEN]');
      // Mask Supabase URLs
      clean = clean.replace(/[a-zA-Z0-9-]+\.supabase\.co/g, '[REDACTED_SECURE_URL]');
      // Mask typical secrets in JSON format strings
      clean = clean.replace(/(password|pass|key|secret)["']?\s*:\s*["']([^"']+)["']/gi, '$1: "[REDACTED]"');
      return clean;
    }
    
    if (arg && typeof arg === 'object') {
      try {
        const cloned = JSON.parse(JSON.stringify(arg));
        const recursiveMask = (obj: any) => {
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              const lowerKey = key.toLowerCase();
              if (
                lowerKey.includes('password') || 
                lowerKey.includes('key') || 
                lowerKey.includes('secret') || 
                lowerKey.includes('token') || 
                lowerKey === 'url'
              ) {
                if (typeof obj[key] === 'string') {
                  obj[key] = '[REDACTED]';
                }
              } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                recursiveMask(obj[key]);
              } else if (typeof obj[key] === 'string') {
                obj[key] = maskSensitiveData(obj[key]);
              }
            }
          }
        };
        recursiveMask(cloned);
        return cloned;
      } catch {
        return '[Object - Secure State]';
      }
    }
    return arg;
  };

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;

  console.log = (...args: any[]) => {
    originalLog(...args.map(maskSensitiveData));
  };
  console.warn = (...args: any[]) => {
    originalWarn(...args.map(maskSensitiveData));
  };
  console.error = (...args: any[]) => {
    originalError(...args.map(maskSensitiveData));
  };
  console.info = (...args: any[]) => {
    originalInfo(...args.map(maskSensitiveData));
  };

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

