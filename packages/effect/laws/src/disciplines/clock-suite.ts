// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Eq } from '@fp4ts/cats';
import { Clock } from '@fp4ts/effect-kernel';
import { RuleSet } from '@fp4ts/cats-test-kit';
import { ClockLaws } from '../clock-laws';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const ClockSuite = <F>(F: Clock<F>) => {
  const laws = ClockLaws(F);

  return {
    clock: (mkEqF: <X>(E: Eq<X>) => Eq<Kind<F, [X]>>): RuleSet =>
      new RuleSet('clock', [
        [
          'clock monotonicity',
          () => {
            const result = laws.monotonicity();
            const True = F.applicative.pure(true);
            const E = mkEqF(Eq.fromUniversalEquals());
            return expect(E.equals(result, True)).toBe(true);
          },
        ],
      ]),
  };
};
