// Copyright (c) 2021-2022 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { $type, Base, instance, TyK, TyVar } from '@fp4ts/core';

/**
 * @category Type Class
 */
export interface Eq<A> extends Base<A> {
  readonly equals: (lhs: A, rhs: A) => boolean;
  readonly notEquals: (lhs: A, rhs: A) => boolean;
}

export type EqRequirements<A> = Pick<Eq<A>, 'equals'> & Partial<Eq<A>>;
export const Eq = Object.freeze({
  of: <A>(E: EqRequirements<A>): Eq<A> =>
    instance({
      notEquals: (a, b) => !E.equals(a, b),
      ...E,
    }),

  by: <A, B>(E: Eq<B>, f: (a: A) => B): Eq<A> =>
    Eq.of<A>({
      equals: (a, b) => E.equals(f(a), f(b)),
    }),

  fromUniversalEquals: <A>(): Eq<A> =>
    Eq.of({
      equals: (lhs, rhs) => lhs === rhs,
      notEquals: (lhs, rhs) => lhs !== rhs,
    }),

  get void(): Eq<void> {
    return Eq.of({ equals: () => true });
  },

  get never(): Eq<never> {
    return Eq.of({ equals: () => false });
  },

  Error: {
    get allEqual(): Eq<Error> {
      return Eq.of({ equals: () => true });
    },
    get strict(): Eq<Error> {
      return Eq.of({
        equals: (lhs, rhs) => {
          if (lhs === rhs) return true;
          if (lhs.constructor.prototype !== rhs.constructor.prototype)
            return false;
          if (lhs.message !== rhs.message) return false;
          return true;
        },
      });
    },
  },

  tuple2<A, B>(A: Eq<A>, B: Eq<B>): Eq<[A, B]> {
    return Eq.of({
      equals: ([la, lb], [ra, rb]) => A.equals(la, ra) && B.equals(lb, rb),
    });
  },

  tuple<A extends unknown[]>(...es: { [k in keyof A]: Eq<A[k]> }): Eq<A> {
    return Eq.of({
      equals: (xs, ys) => es.every((e, i) => e.equals(xs[i], ys[i])),
    });
  },
  record<A>(e: Eq<A>): Eq<Record<string, A>> {
    return Eq.of({
      equals: (xs, ys) => {
        for (const k in xs) {
          if (!(k in ys)) return false;
        }
        for (const k in ys) {
          if (!(k in xs)) return false;
        }
        return Object.keys(xs).every(k => e.equals(xs[k], ys[k]));
      },
    });
  },
  // eslint-disable-next-line @typescript-eslint/ban-types
  struct<A extends {}>(es: { [k in keyof A]: Eq<A[k]> }): Eq<A> {
    return Eq.of({
      equals: (xs, ys) =>
        (Object.keys(es) as (keyof typeof es)[]).every(k =>
          es[k].equals(xs[k], ys[k]),
        ),
    });
  },
});

// -- HKT

export interface EqF extends TyK<[unknown]> {
  [$type]: Eq<TyVar<this, 0>>;
}
