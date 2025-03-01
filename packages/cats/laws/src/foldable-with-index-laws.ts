// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { Kind } from '@fp4ts/core';
import { Eval, FoldableWithIndex, MonoidK } from '@fp4ts/cats-core';
import { Monoid } from '@fp4ts/cats-kernel';
import { IsEq } from '@fp4ts/cats-test-kit';
import { FoldableLaws } from './foldable-laws';

export const FoldableWithIndexLaws = <F, I>(F: FoldableWithIndex<F, I>) => ({
  ...FoldableLaws(F),

  indexedLeftFoldConsistentWithFoldMap:
    <B>(B: Monoid<B>) =>
    <A>(fa: Kind<F, [A]>, f: (a: A, i: I) => B): IsEq<B> =>
      new IsEq(
        F.foldMapWithIndex_(B)(fa, f),
        F.foldLeftWithIndex_(fa, B.empty, (b, a, i) =>
          B.combine_(b, () => f(a, i)),
        ),
      ),

  indexedRightFoldConsistentWithFoldMap:
    <B>(B: Monoid<B>) =>
    <A>(fa: Kind<F, [A]>, f: (a: A, i: I) => B): IsEq<B> => {
      const M = Eval.Monoid(B);

      return new IsEq(
        F.foldMapWithIndex_(B)(fa, f),
        F.foldRightWithIndex_(fa, M.empty, (a, b, i) =>
          M.combine_(
            Eval.later(() => f(a, i)),
            () => b,
          ),
        ).value,
      );
    },

  indexedFoldMapKConsistentWithFoldMap:
    <G>(G: MonoidK<G>) =>
    <A, B>(
      fa: Kind<F, [A]>,
      f: (a: A, i: I) => Kind<G, [B]>,
    ): IsEq<Kind<G, [B]>> =>
      new IsEq(
        F.foldMapWithIndex_(G.algebra<B>())(fa, f),
        F.foldMapKWithIndex_(G)(fa, f),
      ),
});
