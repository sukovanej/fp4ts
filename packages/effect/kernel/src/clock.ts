// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $, Kind } from '@fp4ts/core';
import {
  Applicative,
  Monad,
  KleisliF,
  Kleisli,
  OptionTF,
  OptionT,
} from '@fp4ts/cats';

export interface Clock<F> {
  readonly applicative: Applicative<F>;

  readonly monotonic: Kind<F, [number]>;

  readonly realTime: Kind<F, [number]>;

  readonly timed: <A>(fa: Kind<F, [A]>) => Kind<F, [[number, A]]>;
}

export type ClockRequirements<F> = Pick<
  Clock<F>,
  'applicative' | 'monotonic' | 'realTime'
> &
  Partial<Clock<F>>;
export const Clock = Object.freeze({
  of: <F>(F: ClockRequirements<F>): Clock<F> => {
    const self: Clock<F> = {
      timed: fa =>
        self.applicative.map3_(
          self.monotonic,
          fa,
          self.monotonic,
        )((start, a, end) => [end - start, a]),

      ...F,
    };
    return self;
  },

  forKleisli: <F, R>(
    F: Clock<F> & Applicative<F>,
  ): Clock<$<KleisliF, [F, R]>> =>
    Clock.of({
      applicative: Kleisli.Applicative(F),

      monotonic: () => F.monotonic,

      realTime: () => F.realTime,
    }),

  forOptionT: <F>(F: Clock<F> & Monad<F>): Clock<$<OptionTF, [F]>> =>
    Clock.of<$<OptionTF, [F]>>({
      applicative: OptionT.Monad(F),

      monotonic: OptionT.liftF(F)(F.monotonic),

      realTime: OptionT.liftF(F)(F.realTime),
    }),
});
