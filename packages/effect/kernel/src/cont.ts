// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { FunctionK, Either } from '@fp4ts/cats';
import { MonadCancel } from './monad-cancel';

export interface Cont<F, K, R> {
  <G>(G: MonadCancel<G, Error>): (
    k: (ea: Either<Error, K>) => void,
    get: Kind<G, [K]>,
    nt: FunctionK<F, G>,
  ) => Kind<G, [R]>;
}
