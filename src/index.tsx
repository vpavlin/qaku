import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { WakuContext, WakuContextProvider } from './hooks/useWaku';
import { BrowserRouter, RouterProvider, createBrowserRouter } from 'react-router-dom';
import Main from './pages/main';
import { ToastContextProvider } from './hooks/useToast';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  
    <BrowserRouter>
      <ToastContextProvider>
          <App />
       </ToastContextProvider>
    </BrowserRouter>
  
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
