// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { id, Lazy, lazyVal, Kind } from '@fp4ts/core';
import {
  Alternative,
  Functor,
  FunctorFilter,
  Monad,
  MonoidK,
  Traversable,
  Eval,
  Applicative,
} from '@fp4ts/cats';

import { Chunk as ChunkBase, EmptyChunk } from './algebra';
import type { ChunkF, Chunk } from './chunk';

export const chunkMonoidK: Lazy<MonoidK<ChunkF>> = lazyVal(() =>
  MonoidK.of({
    emptyK: () => ChunkBase.empty,
    combineK_: (lhs, rhs) => lhs.concat(rhs()),
  }),
);

export const chunkFunctor: Lazy<Functor<ChunkF>> = lazyVal(() =>
  Functor.of({ map_: (x, f) => x.map(f) }),
);

export const chunkFunctorFilter: Lazy<FunctorFilter<ChunkF>> = lazyVal(() =>
  FunctorFilter.of({
    ...chunkFunctor(),
    mapFilter_: (x, f) => x.collect(f),
    collect_: (x, f) => x.collect(f),
  }),
);

export const chunkAlternative: Lazy<Alternative<ChunkF>> = lazyVal(() =>
  Alternative.of({ ...chunkMonad(), ...chunkMonoidK() }),
);

export const chunkMonad: Lazy<Monad<ChunkF>> = lazyVal(() =>
  Monad.of({
    pure: ChunkBase.singleton,
    map_: (fa, f) => fa.map(f),
    flatMap_: (xs, f) => xs.flatMap(f),
    flatten: xs => xs.flatMap(id),
    tailRecM_: ChunkBase.tailRecM_,
    map2Eval_:
      <A, B>(fa: Chunk<A>, efb: Eval<Chunk<B>>) =>
      <C>(f: (a: A, b: B) => C) =>
        fa.isEmpty
          ? Eval.now(EmptyChunk)
          : efb.map(fb => fa.flatMap(a => fb.map(b => f(a, b)))),
  }),
);

export const chunkTraversable: Lazy<Traversable<ChunkF>> = lazyVal(() =>
  Traversable.of({
    ...chunkFunctor(),
    foldLeft_: (xs, z, f) => xs.foldLeft(z, f),
    foldRight_: <A, B>(
      fa: Chunk<A>,
      b: Eval<B>,
      f: (a: A, b: Eval<B>) => Eval<B>,
    ): Eval<B> => {
      const go = (i: number): Eval<B> =>
        i < fa.size
          ? f(
              fa.elem(i),
              Eval.defer(() => go(i + 1)),
            )
          : b;
      return Eval.defer(() => go(0));
    },
    traverse_:
      <G>(G: Applicative<G>) =>
      <A, B>(fa: Chunk<A>, f: (a: A) => Kind<G, [B]>): Kind<G, [Chunk<B>]> =>
        fa.traverse(G)(f),
  }),
);
