import React from 'react';
import ReactDOM from 'react-dom';
import { Amplify } from 'aws-amplify';
import './index.css';
import App from './App';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID as string,
      userPoolId: process.env.REACT_APP_USER_POOL_ID as string,
    },
  },
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
);
