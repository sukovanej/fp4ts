import { Option } from './algebra';
import { flatMap_, flatTap_, flatten, fold_, map_, tap_ } from './operators';

declare module './algebra' {
  interface Option<A> {
    map: <B>(f: (a: A) => B) => Option<B>;
    tap: (f: (a: A) => unknown) => Option<A>;
    flatMap: <B>(f: (a: A) => Option<B>) => Option<B>;
    flatTap: (f: (a: A) => Option<unknown>) => Option<A>;
    flatten: A extends Option<infer B> ? Option<B> : never | unknown;
    fold: <B>(onNone: () => B, onSome: (a: A) => B) => B;
  }
}

Option.prototype.map = function <A, B>(
  this: Option<A>,
  f: (a: A) => B,
): Option<B> {
  return map_(this, f);
};

Option.prototype.tap = function <A>(
  this: Option<A>,
  f: (a: A) => unknown,
): Option<A> {
  return tap_(this, f);
};

Option.prototype.flatMap = function <A, B>(
  this: Option<A>,
  f: (a: A) => Option<B>,
): Option<B> {
  return flatMap_(this, f);
};

Option.prototype.flatTap = function <A>(
  this: Option<A>,
  f: (a: A) => Option<unknown>,
): Option<A> {
  return flatTap_(this, f);
};

Object.defineProperty(Option.prototype, 'flatten', {
  get<A>(this: Option<Option<A>>): Option<A> {
    return flatten(this);
  },
});

Option.prototype.fold = function <A, B>(
  this: Option<A>,
  onNone: () => B,
  onSome: (a: A) => B,
): B {
  return fold_(this, onNone, onSome);
};
