// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import {
  $,
  $type,
  Fix,
  Kind,
  Lazy,
  tupled,
  TyK,
  TyVar,
  α,
  β,
  λ,
} from '@fp4ts/core';
import {
  Applicative,
  Apply,
  FlatMap,
  FunctionK,
  Functor,
  isStackSafeMonad,
  Monad,
  MonadError,
  MonoidK,
  Profunctor,
  SemigroupK,
  Strong,
} from '@fp4ts/cats-core';
import { Left, Right, Tuple2 } from '@fp4ts/cats-core/lib/data';
import { MonadState } from '../monad-state';

export type IxStateT<S1, S2, F, A> = (s1: S1) => Kind<F, [[A, S2]]>;
export const IxStateT = function <S1, S2, F, A>(
  runIxStateT: (s1: S1) => Kind<F, [[A, S2]]>,
): IxStateT<S1, S2, F, A> {
  return runIxStateT;
};

IxStateT.mapK =
  <F, G>(fk: FunctionK<F, G>) =>
  <S1, S2, A>(f: IxStateT<S1, S2, F, A>): IxStateT<S1, S2, G, A> =>
  s =>
    fk(f(s));

IxStateT.state =
  <F>(F: Applicative<F>) =>
  <S1, S2, A>(f: (s1: S1) => [A, S2]): IxStateT<S1, S2, F, A> =>
  s =>
    F.pure(f(s));

IxStateT.runA =
  <F>(F: Functor<F>) =>
  <S1>(s1: S1) =>
  <A>(fa: IxStateT<S1, unknown, F, A>): Kind<F, [A]> =>
    F.map_(fa(s1), ([a]) => a);

IxStateT.runS =
  <F>(F: Functor<F>) =>
  <S1>(s1: S1) =>
  <S2>(fa: IxStateT<S1, S2, F, unknown>): Kind<F, [S2]> =>
    F.map_(fa(s1), ([, s2]) => s2);

IxStateT.SemigroupK = <S1, S2, F>(
  F: SemigroupK<F>,
): SemigroupK<$<IxStateTF, [S1, S2, F]>> =>
  SemigroupK.of<$<IxStateTF, [S1, S2, F]>>({
    combineK_: (x, y) => s1 => F.combineK_(x(s1), () => y()(s1)),
  });

IxStateT.MonoidK = <S1, S2, F>(
  F: MonoidK<F>,
): MonoidK<$<IxStateTF, [S1, S2, F]>> =>
  MonoidK.of<$<IxStateTF, [S1, S2, F]>>({
    emptyK:
      <A>() =>
      () =>
        F.emptyK<A>(),
    combineK_:
      <A>(x: IxStateT<S1, S2, F, A>, y: Lazy<IxStateT<S1, S2, F, A>>) =>
      s1 =>
        F.combineK_<[A, S2]>(x(s1), () => y()(s1)),
  });

IxStateT.Profunctor = <F, A>(
  F: Functor<F>,
): Profunctor<λ<IxStateTF, [α, β, Fix<F>, Fix<A>]>> =>
  Profunctor.of({
    dimap_: <S1, S2, S0, S3>(
      fab: IxStateT<S1, S2, F, A>,
      f: (s0: S0) => S1,
      g: (s2: S2) => S3,
    ) => suspend(F, (s: S0) => F.map_(fab(f(s)), Tuple2.Bifunctor.map(g))),
  });

IxStateT.Strong = <F, A>(
  F: Functor<F>,
): Strong<λ<IxStateTF, [α, β, Fix<F>, Fix<A>]>> =>
  Strong.of<λ<IxStateTF, [α, β, Fix<F>, Fix<A>]>>({
    ...IxStateT.Profunctor(F),
    first:
      <C>() =>
      <S1, S2>(fab: IxStateT<S1, S2, F, A>) =>
        suspend(F, ([s1, c]: [S1, C]) =>
          F.map_(fab(s1), ([a, s2]) => [a, [s2, c]]),
        ),
    second:
      <C>() =>
      <S1, S2>(fab: IxStateT<S1, S2, F, A>) =>
        suspend(F, ([c, s1]: [C, S1]) =>
          F.map_(fab(s1), ([a, s2]) => [a, [c, s2]]),
        ),
  });

export type StateT<S, F, A> = IxStateT<S, S, F, A>;
export const StateT = function <S, F, A>(
  runStateT: (s: S) => Kind<F, [[A, S]]>,
): StateT<S, F, A> {
  return runStateT;
};

StateT.mapK = IxStateT.mapK as <F, G>(
  fk: FunctionK<F, G>,
) => <S, A>(f: StateT<S, F, A>) => StateT<S, G, A>;

StateT.state = IxStateT.state as <F, W>(
  F: Applicative<F>,
) => <S, A>(f: (s1: S) => [A, S]) => StateT<S, F, A>;

StateT.runA = IxStateT.runA as <F>(
  F: Functor<F>,
) => <S1>(s1: S1) => <A>(fa: IxStateT<S1, unknown, F, A>) => Kind<F, [A]>;

StateT.runS = IxStateT.runS as <F>(
  F: Functor<F>,
) => <S1>(s1: S1) => <S2>(fa: IxStateT<S1, S2, F, unknown>) => Kind<F, [S2]>;

StateT.Functor = <F, S>(F: Functor<F>): Functor<$<IxStateTF, [S, S, F]>> =>
  Functor.of({
    map_: (fa, f) =>
      suspend(F, s => F.map_(fa(s), Tuple2.Bifunctor.leftMap(f))),
  });

StateT.Apply = <F, S>(F: FlatMap<F>): Apply<$<IxStateTF, [S, S, F]>> =>
  Apply.of({
    ...StateT.Functor(F),
    ap_: (ff, fa) =>
      suspend(F, s1 =>
        F.flatMap_(ff(s1), ([f, s2]) =>
          F.map_(fa(s2), Tuple2.Bifunctor.leftMap(f)),
        ),
      ),
  });

StateT.FlatMap = <F, S>(F: FlatMap<F>): FlatMap<$<IxStateTF, [S, S, F]>> =>
  FlatMap.of<$<IxStateTF, [S, S, F]>>({
    ...StateT.Apply(F),
    flatMap_: (fa, f) =>
      suspend(F, s => F.flatMap_(fa(s), ([a, s]) => f(a)(s))),
    tailRecM_: (x, f) => s1 =>
      F.tailRecM_(tupled(x, s1), ([x, sx]) =>
        F.map_(f(x)(sx), ([ea, sy]) =>
          ea.fold(
            x => Left(tupled(x, sy)),
            z => Right(tupled(z, sy)),
          ),
        ),
      ),
  });

StateT.Monad = <S, F>(F: Monad<F>): Monad<$<IxStateTF, [S, S, F]>> =>
  Monad.of<$<IxStateTF, [S, S, F]>>({
    ...StateT.FlatMap(F),
    pure: a => s => F.pure([a, s]),
  });

StateT.MonadError = <S, F, E>(
  F: MonadError<F, E>,
): MonadError<$<IxStateTF, [S, S, F]>, E> =>
  MonadError.of<$<IxStateTF, [S, S, F]>, E>({
    ...StateT.Monad(F),
    throwError:
      <A>(e: E) =>
      () =>
        F.throwError<A>(e),
    handleErrorWith_: (fa, h) =>
      suspend(F, s => F.handleErrorWith_(fa(s), e => h(e)(s))),
  });

StateT.MonadState = <S, F>(
  F: Monad<F>,
): MonadState<$<IxStateTF, [S, S, F]>, S> =>
  MonadState.of<$<IxStateTF, [S, S, F]>, S>({
    ...StateT.Monad(F),
    get: s => F.pure([s, s]),
    set: s => s1 => F.pure([undefined, s]),
    modify: f => s => F.pure([undefined, f(s)]),
    inspect: f => s => F.pure([f(s), s]),
  });

const suspend = <S1, S2, F, A>(
  F: Functor<F>,
  f: (s1: S1) => Kind<F, [[A, S2]]>,
): IxStateT<S1, S2, F, A> =>
  isStackSafeMonad(F) ? s1 => F.defer(() => f(s1)) : f;

/**
 * @category Type Constructor
 * @category Data
 */
interface IxStateTF extends TyK<[unknown, unknown, unknown, unknown]> {
  [$type]: IxStateT<
    TyVar<this, 0>,
    TyVar<this, 1>,
    TyVar<this, 2>,
    TyVar<this, 3>
  >;
}
