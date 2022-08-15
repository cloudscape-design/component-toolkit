// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import pages from './pages-index';

import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <React.Suspense fallback="loading...">
      <BrowserRouter>
        <Routes>
          {pages.map(({ name, Component }) => (
            <Route path={`/${name}`} key={name} element={<Component />} />
          ))}
          <Route
            path="/*"
            element={
              <div id="index">
                {pages.map(({ name }) => (
                  <li key={name}>
                    <Link to={name}>{name}</Link>
                  </li>
                ))}
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </React.Suspense>
  </React.StrictMode>,
  document.getElementById('app')
);
