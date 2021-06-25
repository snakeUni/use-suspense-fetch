/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { hydrateRoot } from 'react-dom'
import App from './App'
import { SuspenseFetchProvider } from 'use-suspense-fetch'

hydrateRoot(
  document,
  <SuspenseFetchProvider>
    <App assets={window.assetManifest} />
  </SuspenseFetchProvider>
)
