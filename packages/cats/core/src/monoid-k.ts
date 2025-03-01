// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Monoid } from '@fp4ts/cats-kernel';
import { SemigroupK, SemigroupKRequirements } from './semigroup-k';

/**
 * @category Type Class
 */
export interface MonoidK<F> extends SemigroupK<F> {
  emptyK<A>(): Kind<F, [A]>;
  algebra<A>(): Monoid<Kind<F, [A]>>;
  dual(): MonoidK<F>;
}
export type MonoidKRequirements<F> = Pick<MonoidK<F>, 'emptyK'> &
  SemigroupKRequirements<F> &
  Partial<MonoidK<F>>;
export const MonoidK = Object.freeze({
  of: <F>(F: MonoidKRequirements<F>): MonoidK<F> => {
    const self: MonoidK<F> = {
      ...SemigroupK.of(F),

      dual: () =>
        MonoidK.of({
          combineK_: (x, y) => self.combineK_(y(), () => x),
          emptyK: self.emptyK,
          dual: () => self,
        }),

      algebra: <A>() =>
        Monoid.of<Kind<F, [A]>>({
          combine_: SemigroupK.of(F).algebra<A>().combine_,
          empty: F.emptyK<A>(),
        }),
      ...F,
    };
    return self;
  },
});
