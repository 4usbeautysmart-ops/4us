import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthWrapper } from './auth/AuthWrapper';
// import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration';

// A inicialização do Firebase foi removida daqui para corrigir o problema da tela em branco.
// Como o AuthWrapper está configurado para contornar a autenticação, a inicialização
// do Firebase não é necessária e estava causando um erro fatal antes do app renderizar.
// import './services/firebaseConfig';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthWrapper />
  </React.StrictMode>
);

// O registro do service worker foi movido para o index.html
// serviceWorkerRegistration.register()