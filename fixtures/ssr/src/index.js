/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { hydrateRoot } from 'react-dom'
import App from './App'
import { SuspenseFetchProvider, getServerInitialData } from 'use-suspense-fetch'

const initialData = getServerInitialData()

console.log('initialData:', initialData)

hydrateRoot(
  document,
  <SuspenseFetchProvider initialData={initialData}>
    <App assets={window.assetManifest} />
  </SuspenseFetchProvider>
)
