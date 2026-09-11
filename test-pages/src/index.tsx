// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import pages from './pages-index';

import './index.css';

function getPathname() {
  return window.location.pathname;
}

function App() {
  const [pathname, setPathname] = useState(getPathname);

  useEffect(() => {
    function onPopState() {
      setPathname(getPathname());
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function navigate(path: string) {
    window.history.pushState(null, '', path);
    setPathname(path);
  }

  const matched = pages.find(({ name }) => pathname === `/${name}`);

  if (matched) {
    return (
      <React.Suspense fallback="loading...">
        <matched.Component />
      </React.Suspense>
    );
  }

  return (
    <div id="index">
      {pages.map(({ name }) => (
        <li key={name}>
          <a
            href={`/${name}`}
            onClick={e => {
              e.preventDefault();
              navigate(`/${name}`);
            }}
          >
            {name}
          </a>
        </li>
      ))}
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('app')
);
