import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { withPWA } from './Pwa';

const PwaApp = withPWA(App);

ReactDOM.render(<PwaApp />, document.getElementById('root'));

// register();
