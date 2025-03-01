// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, $variables, Kind, TyK, TyVar } from '../hkt';
import { TypeRef } from './type-ref';

export interface Newtype<Ref extends string, A> {
  readonly Ref: Ref;
  readonly _A: A;
}

// prettier-ignore
type NewKind<Ref extends string, F, A extends unknown[]> =
  Newtype<Ref, Kind<F, A>> & { tag: A };

export interface NewtypeF<Ref extends string, F> extends TyK {
  [$type]: this[$variables] extends infer A extends unknown[]
    ? NewKind<Ref, F, A>
    : never;
}

export interface KindId extends TyK<[unknown]> {
  [$type]: TyVar<this, 0>;
}

export interface Constructor<Ref extends string, A>
  extends TypeRef<Ref, Newtype<Ref, A>> {
  Ref: Ref;
  (a: A): Newtype<Ref, A>;
  unapply(nt: Newtype<Ref, A>): A;
}

export interface ConstructorK<Ref extends string, F = KindId> {
  Ref: Ref;
  <A extends unknown[]>(fa: Kind<F, A>): NewKind<Ref, F, A>;
  unapply<A extends unknown[]>(nt: NewKind<Ref, F, A>): Kind<F, A>;
  fix<A extends unknown[]>(): Constructor<Ref, Kind<F, A>>;
}

export function newtype<A>(): <Ref extends string>(
  Ref: Ref,
) => Constructor<Ref, A> {
  return function <Ref extends string>(Ref: Ref): Constructor<Ref, A> {
    const cotr: Constructor<Ref, A> = function (_: A): Newtype<Ref, A> {
      return _ as any;
    } as Constructor<Ref, A>;
    cotr.Ref = Ref;
    cotr.unapply = (_): A => _ as any;
    return cotr;
  };
}

export function newtypeK<F = KindId>(): <Ref extends string>(
  Ref: Ref,
) => ConstructorK<Ref, F> {
  return function <Ref extends string>(Ref: Ref): ConstructorK<Ref, F> {
    const cotr: ConstructorK<Ref, F> = function <A extends unknown[]>(
      _: Kind<F, A>,
    ): NewKind<Ref, F, A> {
      return _ as any;
    };
    cotr.Ref = Ref;
    cotr.unapply = <A extends unknown[]>(_: NewKind<Ref, F, A>): Kind<F, A> =>
      _ as any;
    cotr.fix = <A extends unknown[]>() => newtype<Kind<F, A>>()(Ref);
    return cotr;
  };
}

export type KindOf<T> = [T] extends [ConstructorK<infer Ref, infer F>]
  ? NewtypeF<Ref, F>
  : never;
