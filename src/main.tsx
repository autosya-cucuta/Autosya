import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("Main entry point hit. Initializing React...");
(window as any).AUTOSYA_VERSION = "2.0-ES";

const container = document.getElementById('root');
if (!container) {
  console.error("Root container not found!");
} else {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
