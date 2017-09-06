import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './style';

export const application = ReactDOM.render(
  <div className="application">
    This is the application
  </div>,
  document.getElementById('app-container')
);