// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import fc, { Arbitrary } from 'fast-check';
import { Lazy, lazyVal } from '@fp4ts/core';
import { Constraining, Refining, Schemable } from '@fp4ts/schema-kernel';
import { ArbitraryF } from './arbitrary';

export const arbitrarySchemable: Lazy<Schemable<ArbitraryF>> = lazyVal(() =>
  Schemable.of({
    array: x => fc.array(x),
    string: fc.string(),
    number: fc.integer(),
    null: fc.constant(null),
    boolean: fc.boolean(),
    nullable: x => fc.oneof(x, fc.constant(null)),
    optional: x => fc.oneof(x, fc.constant(undefined)),
    literal: (...xs) => fc.oneof(...xs.map(fc.constant)),
    defer: thunk => fc.constant(null).chain(thunk),
    struct: xs => fc.record(xs),
    record: x => fc.dictionary(fc.string(), x),
    sum: (tag => (xs: any) =>
      fc.oneof(
        ...(Object.keys(xs).map(k => xs[k]) as any),
      )) as Schemable<ArbitraryF>['sum'],
    product: ((...xs) => fc.tuple(...xs)) as Schemable<ArbitraryF>['product'],
    imap: (arb, f, g) => arb.map(f),
  }),
);

export const arbitraryRefining: Lazy<Refining<ArbitraryF>> = lazyVal(() =>
  Refining.of({
    refine_: ((arb, p) => arb.filter(p)) as Refining<ArbitraryF>['refine_'],
  }),
);

export const arbitraryConstraining: Lazy<Constraining<ArbitraryF>> = lazyVal(
  () =>
    Constraining.of({
      ...arbitrarySchemable(),
      min_: (fa, n) => fa.filter(x => x >= n),
      minExclusive_: (fa, n) => fa.filter(x => x > n),
      max_: (fa, n) => fa.filter(x => x <= n),
      maxExclusive_: (fa, n) => fa.filter(x => x < n),
      nonEmpty: (<A>(fa: Arbitrary<string | A[]>) =>
        fa.filter(x => x.length > 0)) as Constraining<ArbitraryF>['nonEmpty'],
      minLength_: (<A>(fa: Arbitrary<string | A[]>, n: number) =>
        fa.filter(x => x.length <= n)) as Constraining<ArbitraryF>['nonEmpty'],
      maxLength_: (<A>(fa: Arbitrary<string | A[]>, n: number) =>
        fa.filter(x => x.length <= n)) as Constraining<ArbitraryF>['nonEmpty'],
    }),
);
