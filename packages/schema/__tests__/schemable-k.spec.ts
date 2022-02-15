// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

/* eslint-disable @typescript-eslint/ban-types */
import fc, { Arbitrary } from 'fast-check';
import { $ } from '@fp4ts/core';
import { ConstF, Some, None, Eq, Option, OptionF, Monoid } from '@fp4ts/cats';
import { SchemaK, SchemableK } from '@fp4ts/schema-kernel';
import { checkAll } from '@fp4ts/cats-test-kit';
import { FoldableSuite, FunctorSuite } from '@fp4ts/cats-laws';
import { Bin, Tip, TreeF, Tree1F, Tree1, Tree } from './tree';

describe('schemable-k', () => {
  describe('regular tree', () => {
    const TreeSK = <K>(k: SchemaK<$<ConstF, [K]>>): SchemaK<$<TreeF, [K]>> =>
      SchemaK.sum('tag')({
        bin: SchemaK.struct({
          tag: SchemaK.literal('bin'),
          k: k,
          v: SchemaK.par,
          lhs: SchemaK.defer(() => TreeSK(k)),
          rhs: SchemaK.defer(() => TreeSK(k)),
        }),
        tip: SchemaK.struct({ tag: SchemaK.literal('tip') }),
      }).imap<$<TreeF, [K]>>(
        t => (t.tag === 'bin' ? new Bin(t.k, t.v, t.lhs, t.rhs) : Tip),
        t => {
          if (t === Tip) return { tag: 'tip' };
          const { k, v, lhs, rhs } = t as Bin<K, any>;
          return { tag: 'bin', k, v, lhs, rhs };
        },
      );

    const arbTree =
      <K>(arbK: Arbitrary<K>) =>
      <A>(arbA: Arbitrary<A>): Arbitrary<Tree<K, A>> => {
        const maxDepth = 20;
        const tip = fc.constant(Tip);
        const node = (n: number): Arbitrary<Tree<K, A>> =>
          n < 1
            ? tip
            : fc
                .tuple(arbK, arbA, tree(n - 1), tree(n - 1))
                .map(
                  ([k, v, lhs, rhs]) =>
                    new Bin(k, v, lhs as Tree<K, A>, rhs as Tree<K, A>),
                );
        const tree = fc.memo((n: number) => fc.oneof(tip, node(n)));
        return tree(maxDepth);
      };

    const eqk = TreeSK(SchemaK.number).interpret(SchemableK.EqK);
    const functor = TreeSK(SchemaK.number).interpret(SchemableK.Functor);
    const functorTests = FunctorSuite(functor);

    checkAll(
      'Functor<Tree<number, *>>',
      functorTests.functor(
        fc.string(),
        fc.string(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        arbTree(fc.integer()),
        eqk.liftEq,
      ),
    );

    const foldable = TreeSK(SchemaK.number).interpret(SchemableK.Foldable);
    const foldableTests = FoldableSuite(foldable);

    checkAll(
      'Foldable<Tree<number, *>>',
      foldableTests.foldable(
        fc.integer(),
        fc.string(),
        Monoid.addition,
        Monoid.string,
        Eq.primitive,
        Eq.primitive,
        arbTree(fc.integer()),
      ),
    );
  });

  describe('optional tree', () => {
    const TreeSK = <K>(
      k: SchemaK<$<ConstF, [K]>>,
    ): SchemaK<[OptionF, $<Tree1F, [K]>]> =>
      SchemaK.struct({
        k: k,
        v: SchemaK.par,
        lhs: SchemaK.defer(() => TreeSK(k)),
        rhs: SchemaK.defer(() => TreeSK(k)),
      }).imap<$<Tree1F, [K]>>(
        ({ k, v, lhs, rhs }) => new Tree1(k, v, lhs, rhs),
        ({ k, v, lhs, rhs }) => ({ k, v, lhs, rhs }),
      ).optional;

    const arbTree =
      <K>(arbK: Arbitrary<K>) =>
      <A>(arbA: Arbitrary<A>): Arbitrary<Option<Tree1<K, A>>> => {
        const maxDepth = 20;
        const tip = fc.constant(None as Option<Tree1<never, never>>);
        const node = (n: number): Arbitrary<Option<Tree1<K, A>>> =>
          n < 1
            ? tip
            : fc
                .tuple(arbK, arbA, tree(n - 1), tree(n - 1))
                .map(
                  ([k, v, lhs, rhs]) =>
                    new Tree1(
                      k,
                      v,
                      lhs as Option<Tree1<K, A>>,
                      rhs as Option<Tree1<K, A>>,
                    ),
                )
                .map(Some);

        const tree = fc.memo((n: number) => fc.oneof(tip, node(n)));
        return node(maxDepth);
      };

    const eqk = TreeSK(SchemaK.number).interpret(SchemableK.EqK);
    const F = TreeSK(SchemaK.number).interpret(SchemableK.Functor);
    const functorTests = FunctorSuite(F);

    checkAll(
      'Functor<Option<Tree<number, *>>>',
      functorTests.functor(
        fc.string(),
        fc.string(),
        fc.string(),
        Eq.primitive,
        Eq.primitive,
        arbTree(fc.integer()),
        eqk.liftEq,
      ),
    );

    const foldable = TreeSK(SchemaK.number).interpret(SchemableK.Foldable);
    const foldableTests = FoldableSuite(foldable);

    checkAll(
      'Foldable<Tree<number, *>>',
      foldableTests.foldable(
        fc.integer(),
        fc.string(),
        Monoid.addition,
        Monoid.string,
        Eq.primitive,
        Eq.primitive,
        arbTree(fc.integer()),
      ),
    );
  });
});
