// Copyright (c) 2021 Peter Matta
//
// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

import { pure as one, done } from './iterator-result';

export const singleton = <A>(x: A): Iterator<A> => {
  let done = false;
  return {
    next: () => {
      if (done) return { value: undefined, done: true };
      done = true;
      return { value: x, done: false };
    },
  };
};

export const pure = <A>(x: A): Iterator<A> => singleton(x);

export const empty: Iterator<never> = {
  next: () => ({ value: undefined, done: true }),
};

export const of = <A>(...xs: A[]): Iterator<A> => xs[Symbol.iterator]();

export const lift = <A>(next: () => IteratorResult<A>): Iterator<A> => ({
  next,
});

export const fromArray = <A>(xs: A[]): Iterator<A> => xs[Symbol.iterator]();
export const fromArrayReversed = <A>(xs: A[]): Iterator<A> => {
  let it = xs.length - 1;
  return lift(() => (it >= 0 ? one(xs[it++]) : done));
};
